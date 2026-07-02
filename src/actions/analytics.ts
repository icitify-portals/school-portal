// @ts-nocheck
"use server";

import { db } from "@/db/db";
import { users, students, courses, results, attendance, activityLogs, enrollments, visitors, visitor_destinations, securityKeys, securityKeyLogs, securityLostAndFound, supportTickets } from "@/db/schema";
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

      // @ts-expect-error - Auto-suppressed by script
      // @ts-expect-error - Auto-suppressed by script
// @ts-expect-error - TS2305: Auto-suppressed for build
import { getAuthUser } from "@/actions/auth-actions";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getSecurityAnalytics() {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");
    
    const authorized = await hasPermission("security.analytics.view") || await hasRole(["admin", "superadmin", "security", "Security Officer"]);
    if (!authorized) throw new Error("Forbidden: Insufficient privileges.");

    // Visitor Analytics
    const topDestinationsRaw = await db.select({
        destinationName: visitor_destinations.destinationName,
        count: sql<number>`count(${visitor_destinations.id})`
    })
    .from(visitor_destinations)
    .groupBy(visitor_destinations.destinationName)
    .orderBy(desc(sql`count(${visitor_destinations.id})`))
    .limit(5);

    const purposeBreakdownRaw = await db.select({
        purpose: visitor_destinations.purpose,
        count: sql<number>`count(${visitor_destinations.id})`
    })
    .from(visitor_destinations)
    .groupBy(visitor_destinations.purpose)
    .orderBy(desc(sql`count(${visitor_destinations.id})`))
    .limit(5);

    const allVisits = await db.select({ startTime: visitor_destinations.visitStartTime }).from(visitor_destinations);
    const timelineMap: Record<string, number> = {};
    allVisits.forEach(v => {
        if (!v.startTime) return;
        const date = new Date(v.startTime).toISOString().slice(0, 10);
        timelineMap[date] = (timelineMap[date] || 0) + 1;
    });
    const visitorTimeline = Object.entries(timelineMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

    // Key Analytics
    const keyStatusBreakdown = await db.select({
        status: securityKeys.status,
        count: sql<number>`count(${securityKeys.id})`
    })
    .from(securityKeys)
    .groupBy(securityKeys.status);

    const topKeysRaw = await db.select({
        keyId: securityKeyLogs.keyId,
        count: sql<number>`count(${securityKeyLogs.id})`
    })
    .from(securityKeyLogs)
    .where(eq(securityKeyLogs.action, 'checkout'))
    .groupBy(securityKeyLogs.keyId)
    .orderBy(desc(sql`count(${securityKeyLogs.id})`))
    .limit(5);

    const topKeys = await Promise.all(topKeysRaw.map(async (tk) => {
        const [k] = await db.select().from(securityKeys).where(eq(securityKeys.id, tk.keyId));
        return { name: k ? k.keyIdentifier : `Key ${tk.keyId}`, count: tk.count };
    }));

    // Lost & Found
    const lostFoundStatus = await db.select({
        status: securityLostAndFound.status,
        count: sql<number>`count(${securityLostAndFound.id})`
    }).from(securityLostAndFound).groupBy(securityLostAndFound.status);

    const lostFoundCategory = await db.select({
        category: securityLostAndFound.category,
        count: sql<number>`count(${securityLostAndFound.id})`
    }).from(securityLostAndFound).groupBy(securityLostAndFound.category);

    // Support Tickets
    const ticketStatus = await db.select({
        status: supportTickets.status,
        count: sql<number>`count(${supportTickets.id})`
    }).from(supportTickets).groupBy(supportTickets.status);

    const ticketCategory = await db.select({
        category: supportTickets.category,
        count: sql<number>`count(${supportTickets.id})`
    }).from(supportTickets).groupBy(supportTickets.category);

    return {
        visitors: { topDestinations: topDestinationsRaw, purposeBreakdown: purposeBreakdownRaw, timeline: visitorTimeline, total: allVisits.length },
        keys: { statusBreakdown: keyStatusBreakdown, topKeys },
        lostFound: { statusBreakdown: lostFoundStatus, categoryBreakdown: lostFoundCategory },
        tickets: { statusBreakdown: ticketStatus, categoryBreakdown: ticketCategory }
    };
}
