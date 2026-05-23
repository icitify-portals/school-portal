"use server";

import { db } from "@/db/db";
import { registrationLevelControls, registrationConcessions, academicSessions, students, users } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// --- LEVEL-BASED CONTROLS ---

export async function getLevelControls(sessionId: number) {
    try {
        return await db.select().from(registrationLevelControls).where(eq(registrationLevelControls.sessionId, sessionId));
    } catch (error) {
        console.error("Error fetching level controls:", error);
        return [];
    }
}

export async function setLevelControl(sessionId: number, level: number, isOpen: boolean) {
    try {
        const [existing] = await db.select().from(registrationLevelControls).where(and(
            eq(registrationLevelControls.sessionId, sessionId),
            eq(registrationLevelControls.level, level)
        )).limit(1);

        if (existing) {
            await db.update(registrationLevelControls)
                .set({ isOpen })
                .where(eq(registrationLevelControls.id, existing.id));
        } else {
            await db.insert(registrationLevelControls).values({
                sessionId,
                level,
                isOpen
            });
        }

        revalidatePath("/admin/registration/controls");
        return { success: true };
    } catch (error) {
        console.error("Error setting level control:", error);
        return { success: false, error: "Failed to update level control" };
    }
}

// --- CONCESSIONS (DVC APPROVAL) ---

export async function requestConcession(data: {
    studentId: number;
    sessionId: number;
    reason: string;
}) {
    try {
        await db.insert(registrationConcessions).values({
            studentId: data.studentId,
            sessionId: data.sessionId,
            reason: data.reason,
            status: 'pending'
        });

        revalidatePath("/student/registration");
        return { success: true };
    } catch (error) {
        console.error("Error requesting concession:", error);
        return { success: false, error: "Failed to submit concession request" };
    }
}

export async function getPendingConcessions() {
    try {
        const rows = await db.select({
            concession: registrationConcessions,
            student: students,
            user: users,
            session: academicSessions
        })
            .from(registrationConcessions)
            .innerJoin(students, eq(registrationConcessions.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(academicSessions, eq(registrationConcessions.sessionId, academicSessions.id))
            .where(eq(registrationConcessions.status, 'pending'))
            .orderBy(desc(registrationConcessions.createdAt));

        return rows.map(r => ({
            ...r.concession,
            student: {
                ...r.student,
                user: r.user
            },
            session: r.session
        }));
    } catch (error) {
        console.error("Error fetching pending concessions:", error);
        return [];
    }
}

export async function approveConcession(concessionId: number, expiresAt?: Date) {
    try {
        const session = await auth();
        const user = session?.user as any;

        if (user?.role !== 'dvc' && user?.role !== 'admin') {
            return { success: false, error: "Unauthorized: Only DVC or Admin can approve concessions" };
        }

        await db.update(registrationConcessions)
            .set({
                status: 'approved',
                approvedBy: parseInt(user.id),
                expiresAt: expiresAt || null
            })
            .where(eq(registrationConcessions.id, concessionId));

        revalidatePath("/admin/registration/concessions");
        return { success: true };
    } catch (error) {
        console.error("Error approving concession:", error);
        return { success: false, error: "Failed to approve concession" };
    }
}

export async function rejectConcession(concessionId: number) {
    try {
        const session = await auth();
        const user = session?.user as any;

        if (user?.role !== 'dvc' && user?.role !== 'admin') {
            return { success: false, error: "Unauthorized" };
        }

        await db.update(registrationConcessions)
            .set({ status: 'rejected' })
            .where(eq(registrationConcessions.id, concessionId));

        revalidatePath("/admin/registration/concessions");
        return { success: true };
    } catch (error) {
        console.error("Error rejecting concession:", error);
        return { success: false, error: "Failed to reject concession" };
    }
}

export async function checkRegistrationAccess(studentId: number, sessionId: number) {
    try {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);

        if (!session) return { canRegister: false, reason: "Session not found" };

        // 1. Global Check
        if (session.isRegistrationOpen) return { canRegister: true };

        // 2. Level Check
        const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);

        if (student) {
            const [levelControl] = await db.select().from(registrationLevelControls).where(and(
                eq(registrationLevelControls.sessionId, sessionId),
                eq(registrationLevelControls.level, student.currentLevel || 100)
            )).limit(1);
            if (levelControl?.isOpen) return { canRegister: true };
        }

        // 3. Concession Check
        const [concession] = await db.select().from(registrationConcessions).where(and(
            eq(registrationConcessions.studentId, studentId),
            eq(registrationConcessions.sessionId, sessionId),
            eq(registrationConcessions.status, 'approved'),
            sql`${registrationConcessions.expiresAt} IS NULL OR ${registrationConcessions.expiresAt} > NOW()`
        )).limit(1);

        if (concession) return { canRegister: true };

        // 4. Pending Check (to show status)
        const [pending] = await db.select().from(registrationConcessions).where(and(
            eq(registrationConcessions.studentId, studentId),
            eq(registrationConcessions.sessionId, sessionId),
            eq(registrationConcessions.status, 'pending')
        )).limit(1);

        return {
            canRegister: false,
            reason: "Registration is closed for your level.",
            hasPendingConcession: !!pending
        };
    } catch (error) {
        console.error("Error checking registration access:", error);
        return { canRegister: false, reason: "Access verification failed", hasPendingConcession: false };
    }
}
