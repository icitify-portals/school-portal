"use server";

import { db } from "@/db/db";
import { academicSessions, students } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAcademicSessions() {
    try {
        return await db.select().from(academicSessions).orderBy(desc(academicSessions.name));
    } catch (error) {
        console.error("Error fetching academic sessions:", error);
        return [];
    }
}

export async function getCurrentSession() {
    try {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
        return session || null;
    } catch (error) {
        console.error("Error fetching current session:", error);
        return null;
    }
}

export async function createAcademicSession(data: {
    name: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    currentSemester?: '1' | '2';
    status?: 'planned' | 'active' | 'archived';
}) {
    try {
        // If this is set to current, unset others
        if (data.isCurrent) {
            await db.update(academicSessions).set({ isCurrent: false });
        }

        await db.insert(academicSessions).values({
            name: data.name,
            startDate: data.startDate as any,
            endDate: data.endDate as any,
            isCurrent: !!data.isCurrent,
            currentSemester: data.currentSemester || '1',
            status: data.status || 'planned',
        });

        revalidatePath("/admin/settings/portal");
        return { success: true };
    } catch (error) {
        console.error("Error creating academic session:", error);
        return { success: false, error: "Failed to create session" };
    }
}

export async function setCurrentSession(id: number) {
    try {
        // 1. Unset all
        await db.update(academicSessions).set({ isCurrent: false });

        // 2. Set target
        await db.update(academicSessions)
            .set({ isCurrent: true, status: 'active' })
            .where(eq(academicSessions.id, id));

        // --- PHASE 4: FINANCIAL ENFORCEMENT ---
        const [newSession] = await db.select().from(academicSessions).where(eq(academicSessions.id, id));
        if (newSession && newSession.name === "2026/2027") {
            await db.update(students).set({ 
                isFinanciallyLocked: true
            });
            console.log("CRITICAL: 2026/2027 Session Transition. Student financial locks reactivated.");
        }

        revalidatePath("/admin/settings/portal");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to set current session" };
    }
}

export async function setCurrentSemester(sessionId: number, semester: '1' | '2') {
    try {
        await db.update(academicSessions)
            .set({ currentSemester: semester })
            .where(eq(academicSessions.id, sessionId));

        revalidatePath("/admin/settings/portal");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update semester" };
    }
}

export async function toggleAddDrop(id: number, status: boolean) {
    try {
        await db.update(academicSessions)
            .set({ isAddDropOpen: status })
            .where(eq(academicSessions.id, id));

        revalidatePath("/admin/settings/portal");
        revalidatePath("/student/registration");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to toggle Add/Drop window" };
    }
}

export async function toggleRegistration(id: number, status: boolean) {
    try {
        await db.update(academicSessions)
            .set({ isRegistrationOpen: status })
            .where(eq(academicSessions.id, id));

        revalidatePath("/admin/settings/portal");
        revalidatePath("/student/registration");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to toggle registration" };
    }
}

export async function deleteAcademicSession(id: number) {
    try {
        await db.delete(academicSessions).where(eq(academicSessions.id, id));
        revalidatePath("/admin/settings/portal");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete session" };
    }
}
export async function updateAcademicSession(id: number, data: { name?: string; startDate?: string; endDate?: string; status?: string }) {
    try {
        const updateData: any = { ...data };
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);
        
        await db.update(academicSessions).set(updateData).where(eq(academicSessions.id, id));
        revalidatePath("/admin/settings/portal");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update session" };
    }
}
