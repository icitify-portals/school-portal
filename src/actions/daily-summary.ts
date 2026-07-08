"use server";

import { db } from "@/db/db";
import { 
    transactions, 
    students, 
    enrollments, 
    supportTickets, 
    visitors, 
    activityLogs,
    users
} from "@/db/schema";
import { eq, and, gte, lt, sql, count } from "drizzle-orm";
import { getAuthUser } from "@/actions/auth-actions";

export async function getDailySummary(dateStr: string) {
    try {
        const user = await getAuthUser();
        if (!user || !['developer', 'super_admin', 'admin'].includes(user.role)) {
            throw new Error("Unauthorized access. Admin privileges required.");
        }

        // Parse date
        const startDate = new Date(dateStr);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        // 1. Finance: Payments
        const [paymentStats] = await db.select({
            count: count(),
            totalSum: sql<number>`SUM(CAST(${transactions.amount} AS DECIMAL(12,2)))`
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.status, 'completed'),
                gte(transactions.createdAt, startDate),
                lt(transactions.createdAt, endDate)
            )
        );

        const transactionsList = await db.select({
            id: transactions.id,
            amount: transactions.amount,
            type: transactions.type,
            purpose: transactions.purpose,
            status: transactions.status,
            gateway: transactions.gateway,
            gatewayReference: transactions.gatewayReference,
            rrr: transactions.rrr,
            createdAt: transactions.createdAt,
            studentName: sql<string>`CONCAT(${students.firstName}, ' ', ${students.lastName})`,
            matricNumber: students.matricNumber,
        })
        .from(transactions)
        .leftJoin(students, eq(transactions.studentId, students.id))
        .where(
            and(
                eq(transactions.status, 'completed'),
                gte(transactions.createdAt, startDate),
                lt(transactions.createdAt, endDate)
            )
        )
        .orderBy(sql`${transactions.createdAt} DESC`);

        // 2. Academics: Students & Enrollments
        const [studentStats] = await db.select({ count: count() })
        .from(students)
        .where(
            and(
                gte(students.createdAt, startDate),
                lt(students.createdAt, endDate)
            )
        );

        const [enrollmentStats] = await db.select({ count: count() })
        .from(enrollments)
        .where(
            and(
                gte(enrollments.enrollmentDate, startDate),
                lt(enrollments.enrollmentDate, endDate)
            )
        );

        // 3. Support: Tickets
        const [ticketStats] = await db.select({ count: count() })
        .from(supportTickets)
        .where(
            and(
                gte(supportTickets.createdAt, startDate),
                lt(supportTickets.createdAt, endDate)
            )
        );

        // 4. Security: Visitors
        const [visitorStats] = await db.select({ count: count() })
        .from(visitors)
        .where(
            and(
                gte(visitors.createdAt, startDate),
                lt(visitors.createdAt, endDate)
            )
        );

        // 5. Usage: Activity Logs (Unique Users)
        const [activityStats] = await db.select({
            count: sql<number>`COUNT(DISTINCT ${activityLogs.userId})`
        })
        .from(activityLogs)
        .where(
            and(
                gte(activityLogs.createdAt, startDate),
                lt(activityLogs.createdAt, endDate)
            )
        );

        return {
            success: true,
            data: {
                payments: {
                    count: paymentStats.count || 0,
                    revenue: paymentStats.totalSum || 0,
                    transactionsList: transactionsList || []
                },
                academics: {
                    newStudents: studentStats.count || 0,
                    newEnrollments: enrollmentStats.count || 0
                },
                support: {
                    newTickets: ticketStats.count || 0
                },
                security: {
                    newVisitors: visitorStats.count || 0
                },
                usage: {
                    activeUsers: activityStats.count || 0
                }
            }
        };

    } catch (error: any) {
        console.error("Failed to fetch daily summary:", error);
        return { success: false, message: error.message || "Failed to load summary." };
    }
}
