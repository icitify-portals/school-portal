"use server";

import { db } from "@/db/db";
import {
    performanceKpis,
    performanceReviews,
    staffProfiles,
    users
} from "@/db/schema";
import { eq, and, desc, aliasedTable } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getKPIs() {
    return await db.select().from(performanceKpis).orderBy(performanceKpis.category);
}

export async function createKPI(data: {
    name: string;
    description: string;
    weight: number;
    category: 'teaching' | 'research' | 'administration' | 'general';
}) {
    try {
        const allowed = await hasPermission("hr.performance.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("hr_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to manage KPIs" };

        await db.insert(performanceKpis).values(data);
        revalidatePath("/admin/hr/performance");
        return { success: true };
    } catch (error) {
        console.error("Create KPI error:", error);
        return { success: false, error: "Failed to create KPI" };
    }
}

export async function initiateAppraisal(staffId: number, year: number, period: 'annual' | 'semi_annual') {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const allowed = await hasPermission("hr.performance.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("hr_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to initiate appraisals" };

        // Check if appraisal already exists for this period
        const existing = await db.select()
            .from(performanceReviews)
            .where(and(
                eq(performanceReviews.staffId, staffId),
                eq(performanceReviews.year, year),
                eq(performanceReviews.period, period)
            ))
            .limit(1);

        if (existing.length > 0) return { success: false, error: "Appraisal already initiated for this period" };

        await db.insert(performanceReviews).values({
            staffId,
            reviewerId: parseInt(session.user.id),
            year,
            period,
            status: 'draft'
        });

        revalidatePath("/admin/hr/performance");
        return { success: true };
    } catch (error) {
        console.error("Initiate appraisal error:", error);
        return { success: false, error: "Failed to initiate appraisal" };
    }
}

export async function getStaffReviews(staffId?: number) {
    try {
        const allowed = await hasPermission("hr.performance.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("hr_officer");
        if (!allowed) return [];

        const reviewers = aliasedTable(users, "reviewers");

        let query = db.select({
            review: performanceReviews,
            staff: staffProfiles,
            staffUser: users,
            reviewer: reviewers
        })
            .from(performanceReviews)
            .innerJoin(staffProfiles, eq(performanceReviews.staffId, staffProfiles.id))
            .innerJoin(users, eq(staffProfiles.userId, users.id))
            .innerJoin(reviewers, eq(performanceReviews.reviewerId, reviewers.id));

        if (staffId) {
            // @ts-ignore
            query = query.where(eq(performanceReviews.staffId, staffId));
        }

        return await query.orderBy(desc(performanceReviews.createdAt));
    } catch (error) {
        console.error("Get reviews error:", error);
        return [];
    }
}

export async function submitReview(reviewId: number, data: {
    ratings: Record<string, number>;
    overallScore: number;
    comments: string;
    finalize: boolean;
}) {
    try {
        const allowed = await hasPermission("hr.performance.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("hr_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to submit reviews" };

        await db.update(performanceReviews)
            .set({
                ratings: JSON.stringify(data.ratings),
                overallScore: data.overallScore.toString(),
                comments: data.comments,
                status: data.finalize ? 'finalized' : 'submitted',
                finalizedAt: data.finalize ? new Date() : null
            })
            .where(eq(performanceReviews.id, reviewId));

        revalidatePath("/admin/hr/performance");
        return { success: true };
    } catch (error) {
        console.error("Submit review error:", error);
        return { success: false, error: "Failed to submit review" };
    }
}
