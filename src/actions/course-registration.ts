"use server";

import { CourseRegistrationService } from "@/services/CourseRegistrationService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { studentCourseRegistrations, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hasRole } from "@/lib/rbac";

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
        revalidatePath("/admin/academic/registrations");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
