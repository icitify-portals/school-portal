"use server";

import { db } from "@/db";
import { departments, programmes, courseDepartmentSettings, courses, staffProfiles, courseAssignments } from "@/db/schema";
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
      const assignments = await db.select().from(courseAssignments).where(inArray(courseAssignments.courseId, courseIds));
      
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
