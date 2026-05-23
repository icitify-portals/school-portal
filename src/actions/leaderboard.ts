"use server";

import { db } from "@/db/db";
import {
    students,
    users,
    departments,
    issuedCertificates,
    issuedBadges,
    semesterSummaries
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getLeaderboardMetrics } from "./settings";
import { auth } from "@/auth";

export async function getLeaderboardData(options: { deptId?: number, page?: number, pageSize?: number } = {}) {
    try {
        const { deptId, page = 1, pageSize = 10 } = options;
        const metrics = await getLeaderboardMetrics();
        const offset = (page - 1) * pageSize;

        // Fetch total count for pagination
        const [countRes] = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .where(deptId ? eq(students.deptId, deptId) : undefined);
        const totalCount = countRes?.count || 0;

        // Fetch students with their counts
        const leaderboard = await db.select({
            id: students.id,
            name: users.name,
            imageUrl: students.imageUrl,
            deptName: departments.name,
            deptId: students.deptId,
            matricNumber: students.matricNumber,
            cgpa: sql<number>`COALESCE(${semesterSummaries.cgpa}, 0)`,
            certCount: sql<number>`(SELECT COUNT(*) FROM issued_certificates WHERE student_id = ${students.id})`,
            badgeCount: sql<number>`(SELECT COUNT(*) FROM issued_badges WHERE student_id = ${students.id})`,
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(semesterSummaries, eq(students.id, semesterSummaries.studentId))
            .where(deptId ? eq(students.deptId, deptId) : undefined);

        // Calculate scores in-memory
        const allRanked = leaderboard.map(s => {
            const score = (s.certCount * metrics.certWeight) +
                (s.badgeCount * metrics.badgeWeight) +
                (parseFloat(s.cgpa.toString()) * metrics.cgpaWeight);
            return {
                ...s,
                score: Math.round(score)
            };
        })
            .sort((a, b) => b.score - a.score)
            .map((s, index) => ({ ...s, rank: index + 1 }));

        // Apply pagination to the ranked results
        const paginatedData = allRanked.slice(offset, offset + pageSize);

        return { success: true, data: paginatedData, totalCount };
    } catch (error) {
        console.error("Leaderboard error:", error);
        return { success: false, error: "Failed to fetch leaderboard" };
    }
}

export async function getMyRank() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userId = parseInt(session.user.id);
    const res = await getLeaderboardData();
    if (!res.success) return null;

    // Find student by userId
    const [student] = await db.select({ id: students.id }).from(students).where(eq(students.userId, userId)).limit(1);
    if (!student) return null;

    return (res.data as any[]).find(s => s.id === student.id) || null;
}
