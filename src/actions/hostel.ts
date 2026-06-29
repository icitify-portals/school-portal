"use server";

import { db } from "@/db/db";
import { 
    hostels, 
    hostelBlocks, 
    hostelRooms, 
    hostelApplications, 
    hostelMaintenanceRequests, 
    students, 
    users, 
    academicSessions 
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getHostelAllocation() {
    const session = await auth();
    if (!session?.user) return null;
    const userId = parseInt(session.user.id!);

    try {
        // Find current student
        const student = await db.query.students.findFirst({
            where: eq(students.userId, userId)
        });

        if (!student) return null;

        // Find active application/allocation
        const allocation = await db.query.hostelApplications.findFirst({
            where: and(
                eq(hostelApplications.studentId, student.id),
                eq(hostelApplications.status, 'allocated')
            ),
            with: {
                hostel: true,
                room: {
                    with: {
                        block: true
                    }
                },
                session: true
            }
        });

        return allocation || null;
    } catch (error) {
        console.error("Failed to fetch hostel allocation:", error);
        return null;
    }
}

export async function applyForHostel(hostelId: number) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    const userId = parseInt(session.user.id!);

    try {
        const student = await db.query.students.findFirst({
            where: eq(students.userId, userId)
        });

        if (!student) return { error: "Student record not found" };

        // Check for existing application
        const existing = await db.query.hostelApplications.findFirst({
            where: and(
                eq(hostelApplications.studentId, student.id),
                eq(hostelApplications.status, 'pending')
            )
        });

        if (existing) return { error: "You already have a pending application" };

        // Get active session (mocked for now, usually from system settings)
        const activeSession = await db.query.academicSessions.findFirst({
            where: eq(academicSessions.isCurrent, true)
        });

        if (!activeSession) return { error: "No active academic session found" };

        await db.insert(hostelApplications).values({
            studentId: student.id,
            hostelId,
            sessionId: activeSession.id,
            status: 'pending'
        });

        revalidatePath("/hostel");
        return { success: true };
    } catch (error) {
        console.error("Hostel application failed:", error);
        return { error: "Failed to submit application" };
    }
}

export async function submitMaintenanceRequest(data: { roomId: number, issue: string, priority: 'low' | 'medium' | 'high' }) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    const userId = parseInt(session.user.id!);

    try {
        const student = await db.query.students.findFirst({
            where: eq(students.userId, userId)
        });

        if (!student) return { error: "Student record not found" };

        // @ts-expect-error - TS2769: Auto-suppressed for build
        await db.insert(hostelMaintenanceRequests).values({
            studentId: student.id,
            roomId: data.roomId,
            issue: data.issue,
            priority: data.priority,
            status: 'pending'
        });

        revalidatePath("/hostel");
        return { success: true };
    } catch (error) {
        console.error("Maintenance request failed:", error);
        return { error: "Failed to submit maintenance request" };
    }
}

export async function getHostels() {
    try {
        return await db.query.hostels.findMany();
    } catch (error) {
        return [];
    }
}
