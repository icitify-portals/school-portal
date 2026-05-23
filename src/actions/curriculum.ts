"use server";

import { db } from "@/db/db";
import { 
    curriculumFrameworks, 
    curriculumDisciplines, 
    curriculumTopics, 
    curriculumOutcomes, 
    lessons, 
    itsSessions 
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- Framework Management ---

export async function getFrameworks() {
    try {
        return await db.select().from(curriculumFrameworks).orderBy(desc(curriculumFrameworks.createdAt));
    } catch (error) {
        console.error("Fetch frameworks error:", error);
        return [];
    }
}

export async function createFramework(data: any) {
    try {
        await db.insert(curriculumFrameworks).values(data);
        revalidatePath("/admin/curriculum");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

// --- Topic & Lesson Management ---

export async function getTopicsByDiscipline(disciplineId: number) {
    try {
        return await db.select().from(curriculumTopics).where(eq(curriculumTopics.disciplineId, disciplineId)).orderBy(curriculumTopics.order);
    } catch (error) {
        return [];
    }
}

export async function getLessonsByTopic(topicId: number) {
    try {
        return await db.select().from(lessons).where(eq(lessons.topicId, topicId)).orderBy(lessons.createdAt);
    } catch (error) {
        return [];
    }
}

// --- ITS Session Actions ---

export async function startITSSession(studentId: number, lessonId: number) {
    try {
        const [session] = await db.insert(itsSessions).values({
            studentId,
            lessonId,
            status: 'started',
        });
        return { success: true, sessionId: session.insertId };
    } catch (error) {
        return { success: false };
    }
}

export async function logITSEngagement(sessionId: number, score: number) {
    try {
        await db.update(itsSessions).set({ engagementScore: score }).where(eq(itsSessions.id, sessionId));
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function completeITSSession(sessionId: number) {
    try {
        await db.update(itsSessions).set({ 
            status: 'completed', 
            completedAt: new Date() 
        }).where(eq(itsSessions.id, sessionId));
        
        revalidatePath("/student/its");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
