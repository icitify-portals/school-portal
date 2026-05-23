"use server";

import { db } from "@/db/db";
import { users, students, courses, results, attendance, activityLogs, enrollments } from "@/db/schema";
import { sql, eq, desc, and, gte, lte, count } from "drizzle-orm";

export async function getDashboardKPIs() {
    try {
        // Last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. Total Active Students
        const [activeStudents] = await db.select({ count: count() })
            .from(students)
            .where(eq(students.status, 'active'));

        // 2. Active Users defined by logged activity in last 7 days
        const [recentActiveUsers] = await db.select({
            count: sql<number>`count(distinct ${activityLogs.userId})`
        })
            .from(activityLogs)
            .where(gte(activityLogs.createdAt, sevenDaysAgo));

        // 3. Total Enrollments
        const [totalEnrollments] = await db.select({ count: count() }).from(enrollments);

        // 4. Activity Over Time (for chart) - last 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const activityTrend = await db.select({
            date: sql<string>`DATE(${activityLogs.createdAt})`,
            logins: sql<number>`sum(case when ${activityLogs.action} = 'login' then 1 else 0 end)`,
            total: count(),
        })
            .from(activityLogs)
            .where(gte(activityLogs.createdAt, fourteenDaysAgo))
            .groupBy(sql`DATE(${activityLogs.createdAt})`)
            .orderBy(sql`DATE(${activityLogs.createdAt})`);

        return {
            success: true,
            activeStudents: activeStudents.count,
            recentActiveUsers: recentActiveUsers.count,
            totalEnrollments: totalEnrollments.count,
            activityTrend
        };
    } catch (error: any) {
        console.error("Dashboard KPI Error:", error);
        return { success: false, error: "Failed to load dashboard metrics" };
    }
}

export async function getCourseUsageStats() {
    try {
        // Join courses with enrollments and results
        const stats = await db.select({
            id: courses.id,
            code: courses.code,
            name: courses.name,
            enrollments: sql<number>`count(distinct ${enrollments.id})`,
            avgTotalScore: sql<number>`avg(case when ${results.totalScore} > 0 then ${results.totalScore} else null end)`,
            passedCount: sql<number>`sum(case when ${results.gradePoint} > 0 then 1 else 0 end)`,
        })
            .from(courses)
            .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
            .leftJoin(results, eq(results.enrollmentId, enrollments.id))
            .groupBy(courses.id, courses.code, courses.name)
            .orderBy(desc(sql`count(distinct ${enrollments.id})`))
            .limit(100);

        return { success: true, stats };
    } catch (error: any) {
        console.error("Course Usage Stats Error:", error);
        return { success: false, error: "Failed to load course usage stats" };
    }
}

export async function getStudentParticipation() {
    try {
        // Get students with attendance count and average score
        const stats = await db.select({
            id: students.id,
            matricNumber: students.matricNumber,
            name: sql<string>`concat(${students.firstName}, ' ', ${students.lastName})`,
            attendanceCount: sql<number>`count(distinct ${attendance.id})`,
            avgScore: sql<number>`avg(case when ${results.totalScore} > 0 then ${results.totalScore} else null end)`,
        })
            .from(students)
            .leftJoin(enrollments, eq(enrollments.studentId, students.id))
            .leftJoin(results, eq(results.enrollmentId, enrollments.id))
            .leftJoin(attendance, eq(attendance.userId, students.userId))
            .groupBy(students.id, students.matricNumber, students.firstName, students.lastName)
            .having(sql`count(distinct ${attendance.id}) > 0 OR avg(${results.totalScore}) IS NOT NULL`)
            .orderBy(desc(sql`count(distinct ${attendance.id})`))
            .limit(100);

        return { success: true, stats };
    } catch (error: any) {
        console.error("Student Participation Error:", error);
        return { success: false, error: "Failed to load student participation stats" };
    }
}

export async function generateCsvString(headers: string[], rows: any[][]): Promise<string> {
    const csvRows = [
        headers.join(','), // Header row
        ...rows.map(row => row.map(cell => {
            const cellStr = typeof cell === 'string' ? cell : (cell === null || cell === undefined ? '' : String(cell));
            // Escape quotes and wrap in quotes if contains comma
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        }).join(','))
    ];

    return csvRows.join('\n');
}
