"use server";

import { db } from "@/db/db";
import { examTimetableSubmissions, examTimetableSlots, examInvigilators, courses, venues, staffProfiles, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ExamTimetableAutoScheduler } from "@/services/ExamTimetableAutoScheduler";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function generateAutoExamTimetable(deptId: number, sessionId: number, semester: '1' | '2', preserveExisting: boolean = true) {
    try {
        const allowed = await hasPermission("academic.timetable.exams.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to generate exam timetable" };

        const result = await ExamTimetableAutoScheduler.generate(deptId, sessionId, semester, preserveExisting);
        revalidatePath("/admin/academics/exams");
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getExamTimetableSubmissions(deptId: number, sessionId: number, semester: '1' | '2') {
    try {
        const subs = await db.select().from(examTimetableSubmissions).where(and(
            eq(examTimetableSubmissions.deptId, deptId),
            eq(examTimetableSubmissions.sessionId, sessionId),
            eq(examTimetableSubmissions.semester, semester)
        ));
        return { success: true, data: subs[0] || null };
    } catch (error) {
        return { success: false, error: "Failed to fetch exam submissions" };
    }
}

export async function submitExamTimetableForApproval(deptId: number, sessionId: number, semester: '1' | '2') {
    try {
        const allowed = await hasPermission("academic.timetable.exams.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to submit exam timetable" };

        let subs = await db.select().from(examTimetableSubmissions).where(and(
            eq(examTimetableSubmissions.deptId, deptId),
            eq(examTimetableSubmissions.sessionId, sessionId),
            eq(examTimetableSubmissions.semester, semester)
        ));
        if (subs.length === 0) {
            await db.insert(examTimetableSubmissions).values({ deptId, sessionId, semester, status: 'pending_approval' });
        } else {
            await db.update(examTimetableSubmissions).set({ status: 'pending_approval' }).where(eq(examTimetableSubmissions.id, subs[0].id));
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: "Submission failed" };
    }
}

export async function saveExamSlot(data: { courseId: number; examDate: string; startTime: string; endTime: string; venueId: number; invigilatorIds: number[] }) {
    try {
        const allowed = await hasPermission("academic.timetable.exams.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to save exam slot" };

        const [result] = await db.insert(examTimetableSlots).values({
            courseId: data.courseId,
            examDate: new Date(data.examDate),
            startTime: data.startTime,
            endTime: data.endTime,
            venueId: data.venueId
        });
        const slotId = (result as any).insertId;
        
        if (data.invigilatorIds && data.invigilatorIds.length > 0) {
            const invigilatorData = data.invigilatorIds.map((staffId, index) => ({
                examSlotId: slotId,
                staffId: staffId,
                role: index === 0 ? 'chief' as const : 'assistant' as const
            }));
            await db.insert(examInvigilators).values(invigilatorData);
        }
        revalidatePath("/admin/academics/exams");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
