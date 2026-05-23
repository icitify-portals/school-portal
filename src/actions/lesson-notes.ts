"use server";

import { db } from "@/db/db";
import { 
    lessonNotes, 
    lessonNoteApprovers, 
    institutionalUnits, 
    courses, 
    users,
    departments,
    courseLessons,
    academicSessions,
    staffProfiles
} from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveLessonNote(data: any) {
    try {
        if (data.id) {
            await db.update(lessonNotes).set({
                title: data.title,
                courseId: data.courseId,
                weekNumber: data.weekNumber,
                sessionId: data.sessionId,
                termId: data.termId,
                objectives: data.objectives,
                contentBody: data.contentBody,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
                updatedAt: new Date()
            }).where(eq(lessonNotes.id, data.id));
            return { success: true, id: data.id };
        } else {
            const [res] = await db.insert(lessonNotes).values({
                teacherId: data.teacherId,
                courseId: data.courseId,
                sessionId: data.sessionId,
                termId: data.termId || 1,
                weekNumber: data.weekNumber || 1,
                title: data.title,
                objectives: data.objectives,
                contentBody: data.contentBody,
                status: 'draft',
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
            } as any);
            return { success: true, id: res.insertId };
        }
    } catch (error) {
        console.error("Save Lesson Note Error:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getStaffTier(staffId: number) {
    try {
        const [result] = await db.select({ tier: institutionalUnits.academicTier })
            .from(staffProfiles)
            .innerJoin(institutionalUnits, eq(staffProfiles.unitId, institutionalUnits.id))
            .where(eq(staffProfiles.id, staffId))
            .limit(1);
        return result?.tier || 'tertiary';
    } catch {
        return 'tertiary';
    }
}

export async function submitLessonNote(id: number, forcedTier?: 'k12' | 'tertiary') {
    try {
        // 1. Determine Tier
        let tier = forcedTier;
        if (!tier) {
            const [note] = await db.select().from(lessonNotes).where(eq(lessonNotes.id, id)).limit(1);
            if (note) {
                tier = await getStaffTier(note.teacherId);
            }
        }

        // 2. Apply logic: Tertiary is instant approval, K12 is pending
        const status = tier === 'k12' ? 'pending' : 'approved';
        const isPublished = tier !== 'k12';
        
        await db.update(lessonNotes).set({
            status,
            isPublished
        }).where(eq(lessonNotes.id, id));
        
        revalidatePath(`/staff/notes`);
        return { success: true, status, tier };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function reviewLessonNote(id: number, supervisorId: number, status: 'approved' | 'rejected', feedback?: string) {
    try {
        await db.update(lessonNotes).set({
            status,
            supervisorId,
            supervisorFeedback: feedback,
            isPublished: status === 'approved'
        }).where(eq(lessonNotes.id, id));
        
        revalidatePath(`/staff/lesson-notes`);
        revalidatePath(`/admin/academic/approvals`);
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getLessonNoteDetails(id: number) {
    try {
        const [note] = await db.select()
            .from(lessonNotes)
            .where(eq(lessonNotes.id, id))
            .limit(1);
        return note;
    } catch (error) {
        console.error("Get Lesson Note Details Error:", error);
        return null;
    }
}

export async function listTeacherLessonNotes(teacherId: number, sessionId: number) {
    try {
        return await db.select()
            .from(lessonNotes)
            .where(and(
                eq(lessonNotes.teacherId, teacherId),
                eq(lessonNotes.sessionId, sessionId)
            ))
            .orderBy(desc(lessonNotes.createdAt));
    } catch (error) {
        return [];
    }
}

export async function listPendingApprovals(supervisorId: number) {
    try {
        // Simple implementation: supervisor sees notes assigned in lessonNoteApprovers
        // or notes in their departments. For now, let's just list all pending notes for this POC
        // In reality, we'd filter by assignments.
        return await db.select({
            id: lessonNotes.id,
            title: lessonNotes.title,
            teacherName: users.name,
            courseName: courses.name,
            week: lessonNotes.weekNumber,
            status: lessonNotes.status,
            createdAt: lessonNotes.createdAt
        })
        .from(lessonNotes)
        .innerJoin(users, eq(lessonNotes.teacherId, users.id))
        .innerJoin(courses, eq(lessonNotes.courseId, courses.id))
        .where(eq(lessonNotes.status, 'pending'))
        .orderBy(desc(lessonNotes.createdAt));
    } catch (error) {
        console.error("List Pending Approvals Error:", error);
        return [];
    }
}
export async function getApprovedNotesForCourse(courseId: number) {
    try {
        return await db.select({
            id: lessonNotes.id,
            title: lessonNotes.title,
            week: lessonNotes.weekNumber,
            content: lessonNotes.contentBody,
            objectives: lessonNotes.objectives,
            updatedAt: lessonNotes.updatedAt
        })
        .from(lessonNotes)
        .where(and(
            eq(lessonNotes.courseId, courseId),
            eq(lessonNotes.status, 'approved'),
            eq(lessonNotes.isPublished, true)
        ))
        .orderBy(lessonNotes.weekNumber);
    } catch (error) {
        return [];
    }
}

export const createLessonNote = saveLessonNote;
