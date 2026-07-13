"use server";

import { db } from "@/db";
import { departments, programmes, courseDepartmentSettings, courses, staffProfiles, courseLecturers } from "@/db/schema";
import { eq, inArray, getTableColumns } from "drizzle-orm";

export async function getDepartments() {
  try {
    const allDepartments = await db.select().from(departments);
    
    // Also fetch programmes to group them by department
    const allProgrammes = await db.select().from(programmes);

    // Fetch faculties to attach to departments
    const { faculties } = await import("@/db/schema");
    const allFaculties = await db.select().from(faculties);

    return allDepartments.map(dept => ({
      ...dept,
      faculty: allFaculties.find(f => f.id === dept.facultyId),
      programmes: allProgrammes.filter(p => p.deptId === dept.id)
    }));
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return [];
  }
}

export async function getDepartmentDetails(deptId: number) {
  try {
    const department = await db.query.departments.findFirst({
      where: eq(departments.id, deptId),
    });

    if (!department) return null;

    const deptProgrammes = await db.select().from(programmes).where(eq(programmes.deptId, deptId));

    // Get courses mapped to this department
    const courseSettings = await db.select().from(courseDepartmentSettings).where(eq(courseDepartmentSettings.deptId, deptId));
    const courseIds = courseSettings.map(cs => cs.courseId);

    let mappedCourses: any[] = [];
    if (courseIds.length > 0) {
      const coursesData = await db.select().from(courses).where(inArray(courses.id, courseIds));
      
      // Get assignments for these courses
      const assignments = await db.select().from(courseLecturers).where(inArray(courseLecturers.courseId, courseIds));
      
      const staffIds = assignments.map(a => a.staffId).filter(id => id !== null) as number[];
      
      let staffData: any[] = [];
      if (staffIds.length > 0) {
        staffData = await db.select().from(staffProfiles).where(inArray(staffProfiles.id, staffIds));
      }

      mappedCourses = coursesData.map(c => {
        const cSettings = courseSettings.find(cs => cs.courseId === c.id);
        const cAssignments = assignments.filter(a => a.courseId === c.id);
        const lecturers = cAssignments.map(a => staffData.find(s => s.id === a.staffId)).filter(Boolean);

        return {
          ...c,
          settings: cSettings,
          lecturers
        };
      });
    }

    return {
      department,
      programmes: deptProgrammes,
      courses: mappedCourses
    };
  } catch (error) {
    console.error("Failed to fetch department details:", error);
    return null;
  }
}

import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function createDepartment(name: string, code: string, facultyId: number, data?: any) {
    try {
        const allowed = await hasPermission("academic.departments.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to create department" };

        await db.insert(departments).values({
            name,
            code,
            facultyId,
            minUnitsAnnual: data?.minUnitsAnnual || 24,
            maxUnitsAnnual: data?.maxUnitsAnnual || 48,
            minUnitsSemester: data?.minUnitsSemester || 12,
            maxUnitsSemester: data?.maxUnitsSemester || 24,
        });
        revalidatePath("/admin/departments");
        return { success: true };
    } catch (error) {
        console.error("Failed to create department:", error);
        return { success: false, error: "Failed to create department" };
    }
}

export async function updateDepartment(id: number, data: any) {
    try {
        const allowed = await hasPermission("academic.departments.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update department" };

        await db.update(departments)
            .set(data)
            .where(eq(departments.id, id));
        revalidatePath("/admin/departments");
        return { success: true };
    } catch (error) {
        console.error("Failed to update department:", error);
        return { success: false, error: "Failed to update department" };
    }
}

export async function deleteDepartment(id: number) {
    try {
        const allowed = await hasPermission("academic.departments.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to delete department" };

        await db.delete(departments).where(eq(departments.id, id));
        revalidatePath("/admin/departments");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete department:", error);
        return { success: false, error: "Failed to delete department" };
    }
}

export async function bulkImportDepartments(data: any[]) {
    try {
        const allowed = await hasPermission("academic.departments.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to import departments" };

        await db.transaction(async (tx) => {
            for (const row of data) {
                const { name, code, facultyId } = row;
                if (!name || !code || !facultyId) continue;

                // Check if dept exists
                const existing = await tx.select().from(departments).where(eq(departments.code, code)).limit(1);
                if (existing.length > 0) continue;

                await tx.insert(departments).values({
                    name,
                    code,
                    facultyId: parseInt(facultyId)
                });
            }
        });

        revalidatePath("/admin/departments");
        return { success: true, message: `Successfully processed ${data.length} records.` };
    } catch (error) {
        console.error("Bulk Dept Import Error:", error);
        return { success: false, error: "Failed to process bulk import. Ensure department codes are unique." };
    }
}
