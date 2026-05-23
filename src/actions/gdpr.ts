"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import {
    users, students, enrollments, results, semesterSummaries,
    promotionLogs, activityLogs, pushSubscriptions
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { logActivity } from "./audit";

// Export all data for a specific user (GDPR data portability)
export async function exportUserData(userId: number) {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'admin') return { error: "Unauthorized" };

        // Fetch user record
        const [user] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            status: users.status,
            createdAt: users.createdAt,
        }).from(users).where(eq(users.id, userId)).limit(1);

        if (!user) return { error: "User not found." };

        // Fetch student record if exists
        const studentRecords = await db.select().from(students)
            .where(eq(students.userId, userId));

        // Fetch enrollments
        let enrollmentRecords: any[] = [];
        if (studentRecords.length > 0) {
            enrollmentRecords = await db.select().from(enrollments)
                .where(eq(enrollments.studentId, studentRecords[0].id));
        }

        // Fetch results (via enrollment IDs)
        let resultRecords: any[] = [];
        if (enrollmentRecords.length > 0) {
            const enrollmentIds = enrollmentRecords.map(e => e.id);
            resultRecords = await db.select().from(results)
                .where(sql`${results.enrollmentId} IN (${sql.join(enrollmentIds.map(id => sql`${id}`), sql`, `)})`);
        }

        // Fetch semester summaries
        let summaryRecords: any[] = [];
        if (studentRecords.length > 0) {
            summaryRecords = await db.select().from(semesterSummaries)
                .where(eq(semesterSummaries.studentId, studentRecords[0].id));
        }

        // Fetch activity logs
        const activityRecords = await db.select({
            action: activityLogs.action,
            resource: activityLogs.resource,
            ipAddress: activityLogs.ipAddress,
            createdAt: activityLogs.createdAt,
        }).from(activityLogs)
            .where(eq(activityLogs.userId, userId))
            .limit(1000);

        const exportData = {
            exportDate: new Date().toISOString(),
            user,
            studentProfile: studentRecords,
            enrollments: enrollmentRecords,
            academicResults: resultRecords,
            semesterSummaries: summaryRecords,
            activityHistory: activityRecords,
        };

        await logActivity('gdpr_data_export', 'user', userId, { exportedBy: session?.user?.id });

        return { success: true, data: JSON.stringify(exportData, null, 2) };
    } catch (error) {
        console.error("GDPR Export Error:", error);
        return { error: "Failed to export user data." };
    }
}

// Anonymize user data (GDPR right to be forgotten)
export async function anonymizeUser(userId: number) {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'admin') return { error: "Unauthorized" };

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) return { error: "User not found." };

        // Don't allow anonymizing admin accounts
        if (user.role === 'admin') return { error: "Cannot anonymize admin accounts." };

        const anonymizedId = `ANON-${userId}-${Date.now()}`;

        // Anonymize user record (keep structure, remove PII)
        await db.update(users)
            .set({
                name: `Anonymized User ${userId}`,
                email: `${anonymizedId}@anonymized.local`,
                password: '',
                status: 'withdrawn',
            })
            .where(eq(users.id, userId));

        // Anonymize student record if exists
        const [student] = await db.select().from(students)
            .where(eq(students.userId, userId)).limit(1);

        if (student) {
            await db.update(students)
                .set({
                    firstName: 'Anonymized',
                    lastName: 'User',
                    matricNumber: `ANON-${student.id}`,
                    status: 'withdrawn',
                })
                .where(eq(students.id, student.id));
        }

        // Delete push subscriptions
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

        // Anonymize activity logs (keep actions but remove IP/userAgent)
        await db.update(activityLogs)
            .set({ ipAddress: null, userAgent: null })
            .where(eq(activityLogs.userId, userId));

        await logActivity('gdpr_anonymize', 'user', userId, { anonymizedBy: session?.user?.id });

        return { success: true, message: `User ${userId} has been anonymized.` };
    } catch (error) {
        console.error("GDPR Anonymize Error:", error);
        return { error: "Failed to anonymize user." };
    }
}

// Get data retention settings
export async function getDataRetentionSettings() {
    try {
        // For now, return sensible defaults; could be stored in a settings table
        return {
            success: true,
            settings: {
                retainGraduatedYears: 5,
                retainWithdrawnYears: 2,
                retainActivityLogsMonths: 24,
                autoDeleteEnabled: false,
            },
        };
    } catch (error) {
        return { error: "Failed to fetch data retention settings." };
    }
}

// Get GDPR summary statistics
export async function getGdprSummary() {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'admin') return { error: "Unauthorized" };

        const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);

        const [anonymizedCount] = await db.select({ count: sql<number>`count(*)` })
            .from(users)
            .where(sql`${users.email} LIKE '%@anonymized.local'`);

        const [activityCount] = await db.select({ count: sql<number>`count(*)` })
            .from(activityLogs);

        return {
            success: true,
            summary: {
                totalUsers: totalUsers?.count || 0,
                anonymizedUsers: anonymizedCount?.count || 0,
                totalActivityLogs: activityCount?.count || 0,
            },
        };
    } catch (error) {
        console.error("GDPR Summary Error:", error);
        return { error: "Failed to fetch GDPR summary." };
    }
}
