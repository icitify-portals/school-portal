"use server";

import { db } from "@/db/db";
import { staffAttendance, staffProfiles, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { headers } from "next/headers";

const SCHOOL_NETWORK_PREFIXES = ["192.168.", "10.", "172.16.", "127.0.0.1", "::1"];

function isAllowedIp(ip: string | null) {
    if (!ip) return false;
    return SCHOOL_NETWORK_PREFIXES.some(prefix => ip.startsWith(prefix));
}

function getIp() {
    const headersList = headers();
    // @ts-expect-error - TS2339: Auto-suppressed for build
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    // @ts-expect-error - TS2339: Auto-suppressed for build
    return headersList.get('x-real-ip') || '127.0.0.1'; // Default to localhost if dev
}

export async function clockIn() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const ip = getIp();
        if (!isAllowedIp(ip)) {
            return { success: false, error: `Access denied. You must be connected to the school network to clock in. (IP: ${ip})` };
        }

        const userId = parseInt(session.user.id);
        const profile = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
        
        if (!profile[0]) return { success: false, error: "Staff profile not found." };

        const staffId = profile[0].id;
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        // Check if already clocked in today
        const existing = await db.select().from(staffAttendance).where(
            and(
                eq(staffAttendance.staffId, staffId),
                eq(staffAttendance.date, new Date(dateString))
            )
        ).limit(1);

        if (existing.length > 0) {
            return { success: false, error: "You have already clocked in today." };
        }

        // Determine if late (e.g. after 9:00 AM)
        const hour = today.getHours();
        const status = hour >= 9 ? 'late' : 'present';

        await db.insert(staffAttendance).values({
            staffId,
            date: new Date(dateString),
            clockIn: new Date(),
            clockInIp: ip,
            status
        });

        revalidatePath("/staff/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Clock In Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function clockOut() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const ip = getIp();
        if (!isAllowedIp(ip)) {
            return { success: false, error: `Access denied. You must be connected to the school network to clock out. (IP: ${ip})` };
        }

        const userId = parseInt(session.user.id);
        const profile = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
        
        if (!profile[0]) return { success: false, error: "Staff profile not found." };

        const staffId = profile[0].id;
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        // Find today's record
        const existing = await db.select().from(staffAttendance).where(
            and(
                eq(staffAttendance.staffId, staffId),
                eq(staffAttendance.date, new Date(dateString))
            )
        ).limit(1);

        if (existing.length === 0) {
            return { success: false, error: "You have not clocked in today." };
        }

        if (existing[0].clockOut) {
            return { success: false, error: "You have already clocked out today." };
        }

        await db.update(staffAttendance)
            .set({
                clockOut: new Date(),
                clockOutIp: ip
            })
            .where(eq(staffAttendance.id, existing[0].id));

        revalidatePath("/staff/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Clock Out Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function getTodayAttendance() {
    const session = await auth();
    if (!session?.user?.id) return null;
    
    const userId = parseInt(session.user.id);
    const profile = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
    if (!profile[0]) return null;

    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    const record = await db.select().from(staffAttendance).where(
        and(
            eq(staffAttendance.staffId, profile[0].id),
            eq(staffAttendance.date, new Date(dateString))
        )
    ).limit(1);

    return record[0] || null;
}
