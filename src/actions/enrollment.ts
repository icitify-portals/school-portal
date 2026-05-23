"use strict";
"use server";

import { db } from "@/db/db";
import { enrollments, cohortEnrollments, userCohorts, students } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentSession } from "./portal";
import { revalidatePath } from "next/cache";

export async function enrollStudentInCourse(studentId: number, courseId: number, academicYear?: string, semester?: number) {
    try {
        let yearToUse = academicYear;
        let semesterToUse = semester || 1;

        if (!yearToUse) {
            const currentSession = await getCurrentSession();
            if (!currentSession) return { success: false, error: "No active academic session found" };
            if (!currentSession.isRegistrationOpen) return { success: false, error: "Registration is currently closed for this session" };

            yearToUse = currentSession.name;
            if (!semester) semesterToUse = parseInt(currentSession.currentSemester || "1");
        } else {
            // Explicit year provided, but let's still check if it's the current session and if it's open
            const currentSession = await getCurrentSession();
            if (currentSession && currentSession.name === yearToUse && !currentSession.isRegistrationOpen) {
                return { success: false, error: "Registration is currently closed for this session" };
            }
        }

        const existing = await db.select().from(enrollments)
            .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)))
            .limit(1);

        if (existing.length > 0) return { success: false, error: "Student already enrolled" };

        await db.insert(enrollments).values({
            studentId,
            courseId,
            academicYear: yearToUse,
            semester: semesterToUse,
        });

        revalidatePath(`/admin/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        console.error("Enrollment error:", error);
        return { success: false, error: "Enrollment failed" };
    }
}

export async function enrollCohortInCourse(cohortId: number, courseId: number) {
    try {
        const existing = await db.select().from(cohortEnrollments)
            .where(and(eq(cohortEnrollments.cohortId, cohortId), eq(cohortEnrollments.courseId, courseId)))
            .limit(1);

        if (existing.length > 0) return { success: false, error: "Cohort already enrolled" };

        await db.insert(cohortEnrollments).values({ cohortId, courseId });
        revalidatePath(`/admin/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        console.error("Cohort enrollment error:", error);
        return { success: false, error: "Cohort enrollment failed" };
    }
}

export async function getEnrolledStudents(courseId: number) {
    try {
        // Individual enrollments
        const directEnrollments = await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));

        // Cohort enrollments
        const cohortEnrs = await db.select().from(cohortEnrollments).where(eq(cohortEnrollments.courseId, courseId));

        let cohortStudents: any[] = [];
        if (cohortEnrs.length > 0) {
            const cohortIds = cohortEnrs.map(ce => ce.cohortId);
            // Get all students in these cohorts
            // This is complex because cohorts map to users, and we need student IDs
            // For now, let's keep it simple and just return the types of enrollment for UI
        }

        return { directEnrollments, cohortEnrollments: cohortEnrs };
    } catch (error) {
        console.error("Failed to fetch enrollments:", error);
        return { directEnrollments: [], cohortEnrollments: [] };
    }
}
