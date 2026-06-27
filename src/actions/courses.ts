"use strict";
"use server";

import { db } from "@/db/db";
import { courses, courseDepartmentSettings, coursePrerequisites, departments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getCourses() {
    try {
        const allCourses = await db.select().from(courses);

        // Fetch relations separately using explicit joins
        const settingsRaw = await db
            .select({
                setting: courseDepartmentSettings,
                department: departments,
            })
            .from(courseDepartmentSettings)
            .innerJoin(departments, eq(courseDepartmentSettings.deptId, departments.id));

        const prerequisitesRaw = await db
            .select({
                prerequisiteEntry: coursePrerequisites,
                prerequisite: courses,
            })
            .from(coursePrerequisites)
            .innerJoin(courses, eq(coursePrerequisites.prerequisiteId, courses.id));

        const settings = settingsRaw.map(r => ({ ...r.setting, department: r.department }));
        const prerequisites = prerequisitesRaw.map(r => ({ ...r.prerequisiteEntry, prerequisite: r.prerequisite }));

        return allCourses.map(course => ({
            ...course,
            departmentSettings: settings.filter(s => s.courseId === course.id),
            prerequisites: prerequisites.filter(p => p.courseId === course.id)
        }));
    } catch (error) {
        console.error("Failed to fetch courses:", error);
        return [];
    }
}

export async function createCourse(data: {
    name: string;
    code: string;
    creditUnits: number;
    description?: string;
    isUniversityRequired?: boolean;
    countsForCgpa?: boolean;
    isGroupSubject?: boolean;
    parentCourseId?: number | null;
}) {
    try {
        const allowed = await hasPermission("academic.courses.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to create course" };

        const [result] = await db.insert(courses).values({
            ...data,
            isUniversityRequired: data.isUniversityRequired || false,
            countsForCgpa: data.countsForCgpa ?? true,
            isGroupSubject: data.isGroupSubject || false,
            parentCourseId: data.parentCourseId || null,
        });
        revalidatePath("/admin/courses");
        return { success: true, courseId: result.insertId };
    } catch (error) {
        console.error("Failed to create course:", error);
        return { success: false, error: "Course code must be unique" };
    }
}

export async function addCourseToDepartment(data: {
    courseId: number;
    deptId: number;
    semester: "1" | "2";
    status: "compulsory" | "required" | "elective";
    level: number;
}) {
    try {
        const allowed = await hasPermission("academic.courses.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to link course to department" };

        await db.insert(courseDepartmentSettings).values(data);
        revalidatePath("/admin/courses");
        return { success: true };
    } catch (error) {
        console.error("Failed to link course to department:", error);
        return { success: false, error: "Course already linked to this department" };
    }
}

export async function updateCourseDepartmentSetting(courseId: number, deptId: number, data: {
    semester?: "1" | "2";
    status?: "compulsory" | "required" | "elective";
    level?: number;
}) {
    try {
        const allowed = await hasPermission("academic.courses.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update department course setting" };

        await db.update(courseDepartmentSettings)
            .set(data)
            .where(and(
                eq(courseDepartmentSettings.courseId, courseId),
                eq(courseDepartmentSettings.deptId, deptId)
            ));
        revalidatePath("/admin/courses");
        return { success: true };
    } catch (error) {
        console.error("Failed to update department setting:", error);
        return { success: false, error: "Failed to update department setting" };
    }
}

export async function removeCourseFromDepartment(courseId: number, deptId: number) {
    try {
        const allowed = await hasPermission("academic.courses.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to remove course from department" };

        await db.delete(courseDepartmentSettings)
            .where(and(
                eq(courseDepartmentSettings.courseId, courseId),
                eq(courseDepartmentSettings.deptId, deptId)
            ));
        revalidatePath("/admin/courses");
        return { success: true };
    } catch (error) {
        console.error("Failed to remove course from department:", error);
        return { success: false, error: "Failed to remove course from department" };
    }
}

export async function addPrerequisite(courseId: number, prerequisiteId: number) {
    try {
        const allowed = await hasPermission("academic.courses.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to add course prerequisite" };

        await db.insert(coursePrerequisites).values({ courseId, prerequisiteId });
        revalidatePath("/admin/courses");
        return { success: true };
    } catch (error) {
        console.error("Failed to add prerequisite:", error);
        return { success: false, error: "Prerequisite already added" };
    }
}

export async function removePrerequisite(courseId: number, prerequisiteId: number) {
    try {
        const allowed = await hasPermission("academic.courses.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to remove course prerequisite" };

        await db.delete(coursePrerequisites).where(
            and(eq(coursePrerequisites.courseId, courseId), eq(coursePrerequisites.prerequisiteId, prerequisiteId))
        );
        revalidatePath("/admin/courses");
        return { success: true };
    } catch (error) {
        console.error("Failed to remove prerequisite:", error);
        return { success: false, error: "Failed to remove prerequisite" };
    }
}

export async function updateCourse(id: number, data: any) {
    try {
        const allowed = await hasPermission("academic.courses.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update course" };

        await db.update(courses).set(data).where(eq(courses.id, id));
        revalidatePath("/admin/courses");
        return { success: true };
    } catch (error) {
        console.error("Failed to update course:", error);
        return { success: false, error: "Failed to update course" };
    }
}

export async function deleteCourse(id: number) {
    try {
        const allowed = await hasPermission("academic.courses.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to delete course" };

        // Dependencies are handled by DB-level references or needs manual cleanup if not cascading
        await db.delete(courses).where(eq(courses.id, id));
        revalidatePath("/admin/courses");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete course:", error);
        return { success: false, error: "Failed to delete course. Ensure it has no students enrolled." };
    }
}

export async function bulkImportCourses(data: any[]) {
    try {
        const allowed = await hasPermission("academic.courses.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to import courses" };

        await db.transaction(async (tx) => {
            for (const row of data) {
                const { name, code, creditUnits, description } = row;
                if (!name || !code || !creditUnits) continue;

                // Check if course exists
                const existing = await tx.select().from(courses).where(eq(courses.code, code)).limit(1);
                if (existing.length > 0) continue;

                await tx.insert(courses).values({
                    name,
                    code,
                    creditUnits: parseInt(creditUnits),
                    description: description || null
                });
            }
        });

        revalidatePath("/admin/courses");
        return { success: true, message: `Successfully processed ${data.length} records.` };
    } catch (error) {
        console.error("Bulk Course Import Error:", error);
        return { success: false, error: "Failed to process bulk import. Ensure course codes are unique." };
    }
}
export async function getAvailableCourses(deptId: number, level: number) {
    try {
        const results = await db.select({
            id: courses.id,
            name: courses.name,
            code: courses.code,
            units: courses.creditUnits,
            status: courseDepartmentSettings.status
        })
            .from(courses)
            .innerJoin(courseDepartmentSettings, eq(courses.id, courseDepartmentSettings.courseId))
            .where(
                and(
                    eq(courseDepartmentSettings.deptId, deptId),
                    eq(courseDepartmentSettings.level, level)
                )
            );
        return results;
    } catch (error) {
        console.error("Failed to fetch available courses:", error);
        return [];
    }
}
