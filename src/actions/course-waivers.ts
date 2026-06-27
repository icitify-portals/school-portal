"use server";

import { CourseRegistrationService } from "@/services/CourseRegistrationService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { courseRegistrationWaivers, users, students, courses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { hasRole, hasPermission } from "@/lib/rbac";

export async function grantCourseWaiverAction(data: {
    studentId: number,
    courseId: number,
    reason: string
}) {
    try {
        const isAuth = await hasPermission("academic.waiver.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("dean") || await hasRole("hod");
        if (!isAuth) throw new Error("Unauthorized: HOD/Dean access required");

        const adminId = 1; // Current User Placeholder
        await CourseRegistrationService.grantWaiver({
            ...data,
            grantedBy: adminId
        });
        
        revalidatePath("/admin/academic/waivers");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getActiveWaiversAction() {
    try {
        const waivers = await db.select({
            id: courseRegistrationWaivers.id,
            studentName: users.name,
            courseName: courses.name,
            courseCode: courses.code,
            reason: courseRegistrationWaivers.reason,
            grantedAt: courseRegistrationWaivers.createdAt
        })
        .from(courseRegistrationWaivers)
        .innerJoin(students, eq(courseRegistrationWaivers.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .innerJoin(courses, eq(courseRegistrationWaivers.courseId, courses.id))
        .orderBy(desc(courseRegistrationWaivers.createdAt));

        return { success: true, data: waivers };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
