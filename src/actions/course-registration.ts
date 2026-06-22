"use server";

import { CourseRegistrationService } from "@/services/CourseRegistrationService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { studentCourseRegistrations, courses, students } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hasRole } from "@/lib/rbac";
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
            units: courses.creditUnits,
            status: studentCourseRegistrations.status
        })
        .from(studentCourseRegistrations)
        .innerJoin(courses, eq(studentCourseRegistrations.courseId, courses.id))
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
        const isStaff = await hasRole("admin") || await hasRole("superadmin") || await hasRole("teacher");
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
