"use server";

import { CourseRegistrationService } from "@/services/CourseRegistrationService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { studentCourseRegistrations, courses, students, users, courseDepartmentSettings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { hasRole, hasPermission } from "@/lib/rbac";
import { sendInAppNotification } from "./notifications";

export async function getAvailableCoursesAction(studentId: number, semester: '1' | '2') {
    try {
        const data = await CourseRegistrationService.getAvailableCourses(studentId, semester);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function submitCourseRegistrationAction(data: {
    studentId: number,
    sessionId: number,
    semester: '1' | '2',
    courseIds: number[]
}) {
    try {
        // COURSE-6: early prerequisite check before level/capacity validations
        const failedPrerequisites = await CourseRegistrationService.validatePrerequisites(data.studentId, data.courseIds);
        if (failedPrerequisites.length > 0) {
            return { success: false, error: "Prerequisite Failure", failedPrerequisites };
        }

        const result = await CourseRegistrationService.submitRegistration(data);
        
        const student = await db.select({ userId: students.userId }).from(students).where(eq(students.id, data.studentId)).limit(1);
        if (student.length > 0 && student[0].userId) {
            await sendInAppNotification({
                userId: student[0].userId,
                title: "Registration Submitted",
                message: `You have successfully submitted your course registration (${result.totalUnits} units).`,
                type: "success",
                link: "/student/courses/registration"
            });
        }

        revalidatePath("/student/courses/registration");
        return { success: true, totalUnits: result.totalUnits };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getRegisteredCoursesAction(studentId: number, sessionId: number, semester: '1' | '2') {
    try {
        const registered = await db.select({
            id: courses.id,
            name: courses.name,
            code: courses.code,
            units: sql<number>`COALESCE(${courseDepartmentSettings.creditUnits}, ${courses.creditUnits})`.mapWith(Number),
            finalStatus: studentCourseRegistrations.finalStatus
        })
        .from(studentCourseRegistrations)
        .innerJoin(courses, eq(studentCourseRegistrations.courseId, courses.id))
        .innerJoin(students, eq(studentCourseRegistrations.studentId, students.id))
        .leftJoin(courseDepartmentSettings, and(
            eq(courseDepartmentSettings.courseId, courses.id),
            eq(courseDepartmentSettings.deptId, students.deptId),
            sql`${studentCourseRegistrations.semester} = ${courseDepartmentSettings.semester}`
        ))
        .where(and(
            eq(studentCourseRegistrations.studentId, studentId),
            eq(studentCourseRegistrations.sessionId, sessionId),
            eq(studentCourseRegistrations.semester, semester)
        ));

        return { success: true, data: registered };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function approveStudentRegistrationAction(studentId: number, sessionId: number, semester: '1' | '2') {
    try {
        const isStaff = await hasPermission("academic.registration.approve") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("teacher");
        if (!isStaff) throw new Error("Unauthorized access");

        const staffId = 1; // Placeholder
        await CourseRegistrationService.approveRegistration(studentId, sessionId, semester, staffId);
        
        const student = await db.select({ userId: students.userId }).from(students).where(eq(students.id, studentId)).limit(1);
        if (student.length > 0 && student[0].userId) {
            await sendInAppNotification({
                userId: student[0].userId,
                title: "Registration Approved",
                message: `Your course registration has been approved.`,
                type: "success",
                link: "/student/courses/registration"
            });
        }

        revalidatePath("/admin/academic/registrations");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getCourseRegisteredStudentsRosterAction(courseId: number, sessionId?: number, semester?: '1' | '2') {
    try {
        const isAuthorized = await hasPermission("academic.registration.approve") || 
                             await hasRole("admin") || 
                             await hasRole("superadmin") || 
                             await hasRole("record_officer") ||
                             await hasRole("registrar") ||
                             await hasRole("teacher");
                             
        if (!isAuthorized) throw new Error("Unauthorized: Insufficient permissions to view course roster");

        let conditions = [eq(studentCourseRegistrations.courseId, courseId)];
        if (sessionId) conditions.push(eq(studentCourseRegistrations.sessionId, sessionId));
        if (semester) conditions.push(eq(studentCourseRegistrations.semester, semester));

        const rows = await db.select({
            registrationId: studentCourseRegistrations.id,
            studentId: students.id,
            matricNumber: students.matricNumber,
            admissionNumber: students.admissionNumber,
            studentName: users.name,
            studentEmail: users.email,
            level: students.currentLevel,
            courseId: courses.id,
            courseCode: courses.code,
            courseName: courses.name,
            creditUnits: sql<number>`COALESCE(${courseDepartmentSettings.creditUnits}, ${courses.creditUnits})`.mapWith(Number),
            finalStatus: studentCourseRegistrations.finalStatus,
            advisorStatus: studentCourseRegistrations.advisorStatus,
            registeredAt: studentCourseRegistrations.registeredAt
        })
        .from(studentCourseRegistrations)
        .innerJoin(students, eq(studentCourseRegistrations.studentId, students.id))
        .leftJoin(users, eq(students.userId, users.id))
        .innerJoin(courses, eq(studentCourseRegistrations.courseId, courses.id))
        .leftJoin(courseDepartmentSettings, and(
            eq(courseDepartmentSettings.courseId, courses.id),
            eq(courseDepartmentSettings.deptId, students.deptId),
            sql`${studentCourseRegistrations.semester} = ${courseDepartmentSettings.semester}`
        ))
        .where(and(...conditions));

        return { success: true, data: rows };
    } catch (error) {
        console.error("getCourseRegisteredStudentsRosterAction error:", error);
        return { success: false, error: (error as Error).message, data: [] };
    }
}
