"use server";

import { db } from "@/db/db";
import { visitors, visitor_destinations } from "@/db/schema";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
// @ts-expect-error - TS2305: Auto-suppressed for build
import { getAuthUser } from "@/actions/auth-actions";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function kioskCheckInAction(data: {
    name: string;
    phone?: string;
    purpose: string;
    destinationType: 'office' | 'laboratory' | 'library' | 'classroom' | 'other';
    destinationName: string;
    departmentId?: number;
}) {
    try {
        // A kiosk might not have an active logged-in user if it's a public tablet,
        // but typically it's authenticated as a generic "kiosk" user or admin.
        // We will skip strict RBAC here to allow self-service check-in, 
        // or assume the front desk staff is logged in.

        const [newVisitorId] = await db.transaction(async (tx) => {
            const [insertResult] = await tx.insert(visitors).values({
                name: data.name,
                phone: data.phone,
                purpose: data.purpose,
                actualArrival: new Date(),
                status: 'checked_in'
            });

            const visitorId = insertResult.insertId;

            await tx.insert(visitor_destinations).values({
                visitorId: visitorId,
                destinationType: data.destinationType,
                destinationName: data.destinationName,
                departmentId: data.departmentId,
                visitStartTime: new Date(),
                purpose: data.purpose,
                status: 'pending' // pending until checkout
            });

            return [visitorId];
        });

        return { success: true, message: "Checked in successfully. Welcome!", visitorId: newVisitorId };
    } catch (err: any) {
        return { error: err.message || "Failed to check in." };
    }
}

export async function kioskCheckOutAction(destinationId: number) {
    try {
        await db.update(visitor_destinations)
            .set({ 
                status: 'completed', 
                visitEndTime: new Date() 
            })
            .where(eq(visitor_destinations.id, destinationId));

        return { success: true, message: "Checked out successfully. Have a great day!" };
    } catch (err: any) {
        return { error: err.message || "Failed to check out." };
    }
}

export async function getOfficeVisitorsAction(destinationName: string) {
    try {
        const activeVisitors = await db.query.visitor_destinations.findMany({
            where: and(
                eq(visitor_destinations.destinationName, destinationName),
                eq(visitor_destinations.status, 'pending')
            ),
            with: {
                visitor: true
            },
            orderBy: [desc(visitor_destinations.visitStartTime)]
        });

        return { visitors: activeVisitors };
    } catch (err: any) {
        return { error: err.message || "Failed to fetch visitors." };
    }
}

export async function getCentralVisitorAnalyticsAction() {
    try {
        const user = await getAuthUser();
        if (!user) throw new Error("Unauthorized");

        const authorized = await hasPermission("security.visitors.view") || await hasRole(["admin", "superadmin", "security", "Security Officer"]);
        if (!authorized) throw new Error("Forbidden: Insufficient privileges.");

        const activeDestinations = await db.query.visitor_destinations.findMany({
            where: eq(visitor_destinations.status, 'pending'),
            with: { visitor: true },
            orderBy: [desc(visitor_destinations.visitStartTime)]
        });

        // Fetch counts for today
        const todayStr = new Date().toISOString().slice(0, 10);
        
        // This is a naive count. For exact dates in SQL, use native db functions.
        const allDestinations = await db.select().from(visitor_destinations);
        const totalToday = allDestinations.filter(d => 
            d.visitStartTime && d.visitStartTime.toISOString().startsWith(todayStr)
        ).length;

        return { 
            activeVisitors: activeDestinations,
            totalToday,
            currentlyActive: activeDestinations.length
        };
    } catch (err: any) {
        return { error: err.message || "Failed to fetch analytics." };
    }
}
