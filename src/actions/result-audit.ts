"use server";

import { db } from "@/db/db";
import { resultEditLogs, users, students, courses, academicSessions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { hasRole } from "@/lib/rbac";

export async function getResultAuditLogs() {
    try {
        const isPrincipal = await hasRole("principal") || await hasRole("superadmin");
        if (!isPrincipal) throw new Error("Unauthorized: Audit access required");

        const logs = await db.select({
            id: resultEditLogs.id,
            studentName: users.name,
            courseName: courses.name,
            oldScore: resultEditLogs.oldScore,
            newScore: resultEditLogs.newScore,
            reason: resultEditLogs.reason,
            editedBy: sql<string>`(SELECT name FROM users WHERE id = ${resultEditLogs.editedBy})`,
            createdAt: resultEditLogs.createdAt,
            term: resultEditLogs.term
        })
        .from(resultEditLogs)
        .innerJoin(students, eq(resultEditLogs.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .innerJoin(courses, eq(resultEditLogs.courseId, courses.id))
        .orderBy(desc(resultEditLogs.createdAt))
        .limit(50);

        return { success: true, data: logs };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
