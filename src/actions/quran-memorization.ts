"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { quranMemorizationLogs, students, users, staffProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getStudentQuranLogs(
    studentId: number,
    sessionId: number,
    term: number
) {
    const sessionUser = await auth();
    if (!sessionUser?.user) return { success: false, error: "Unauthorized" };

    try {
        const logs = await db.select()
            .from(quranMemorizationLogs)
            .where(and(
                eq(quranMemorizationLogs.studentId, studentId),
                eq(quranMemorizationLogs.sessionId, sessionId),
                eq(quranMemorizationLogs.term, term.toString() as any)
            ));
        
        return { success: true, data: logs };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveQuranMemorizationLog(data: {
    studentId: number;
    sessionId: number;
    term: number;
    surahName: string;
    status: 'memorized' | 'in_progress' | 'not_started';
    tajweedRating: number;
    fluencyRating: number;
    teacherRemark: string;
}) {
    const sessionUser = await auth();
    if (!sessionUser?.user) return { success: false, error: "Unauthorized" };

    try {
        const [existing] = await db.select()
            .from(quranMemorizationLogs)
            .where(and(
                eq(quranMemorizationLogs.studentId, data.studentId),
                eq(quranMemorizationLogs.sessionId, data.sessionId),
                eq(quranMemorizationLogs.term, data.term.toString() as any),
                eq(quranMemorizationLogs.surahName, data.surahName)
            ))
            .limit(1);

        if (existing) {
            await db.update(quranMemorizationLogs)
                .set({
                    status: data.status,
                    tajweedRating: data.tajweedRating,
                    fluencyRating: data.fluencyRating,
                    teacherRemark: data.teacherRemark
                })
                .where(eq(quranMemorizationLogs.id, existing.id));
        } else {
            await db.insert(quranMemorizationLogs).values({
                studentId: data.studentId,
                sessionId: data.sessionId,
                term: data.term.toString() as any,
                surahName: data.surahName,
                status: data.status,
                tajweedRating: data.tajweedRating,
                fluencyRating: data.fluencyRating,
                teacherRemark: data.teacherRemark
            });
        }

        revalidatePath("/student/report-sheets");
        return { success: true };
    } catch (error: any) {
        console.error("Quran Memorization Log Error:", error);
        return { success: false, error: error.message };
    }
}
