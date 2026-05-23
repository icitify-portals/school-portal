"use server";

import { db } from "@/db/db";
import { examSlots, academicSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getExamSlots(sessionId?: number, semester?: '1' | '2') {
    try {
        let query = db.select().from(examSlots);
        
        const conditions = [];
        if (sessionId) conditions.push(eq(examSlots.sessionId, sessionId));
        if (semester) conditions.push(eq(examSlots.semester, semester));
        
        if (conditions.length > 0) {
            // @ts-ignore - Drizzle typed query building
            return { success: true, data: await query.where(and(...conditions)) };
        }

        return { success: true, data: await query };
    } catch (error) {
        console.error("Fetch exam slots error:", error);
        return { success: false, error: "Failed to fetch exam slots" };
    }
}

export async function createExamSlot(data: {
    title: string;
    sessionId: number;
    semester: '1' | '2';
    startTime: Date;
    endTime: Date;
    type?: 'quiz' | 'exam';
}) {
    try {
        const [res] = await db.insert(examSlots).values({
            ...data,
            type: data.type || 'exam',
        });

        revalidatePath("/admin/cbt/exam-slots");
        return { success: true, id: res.insertId };
    } catch (error) {
        console.error("Create exam slot error:", error);
        return { success: false, error: "Failed to create exam slot" };
    }
}

export async function updateExamSlot(id: number, data: Partial<{
    title: string;
    sessionId: number;
    semester: '1' | '2';
    startTime: Date;
    endTime: Date;
    type: 'quiz' | 'exam';
}>) {
    try {
        await db.update(examSlots).set(data).where(eq(examSlots.id, id));
        revalidatePath("/admin/cbt/exam-slots");
        return { success: true };
    } catch (error) {
        console.error("Update exam slot error:", error);
        return { success: false, error: "Failed to update exam slot" };
    }
}

export async function deleteExamSlot(id: number) {
    try {
        await db.delete(examSlots).where(eq(examSlots.id, id));
        revalidatePath("/admin/cbt/exam-slots");
        return { success: true };
    } catch (error) {
        console.error("Delete exam slot error:", error);
        return { success: false, error: "Failed to delete exam slot" };
    }
}

export async function getActiveSessions() {
    try {
        const sessions = await db.select().from(academicSessions).where(eq(academicSessions.isActive, true));
        return { success: true, sessions };
    } catch (error) {
        return { success: false, error: "Failed to fetch sessions" };
    }
}
