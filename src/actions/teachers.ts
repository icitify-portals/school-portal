"use server";

import { db } from "../db/db";
import { 
    staffClassAssignments, 
    staffSubjectAssignments, 
    behavioralScores, 
    reportRemarks, 
    affectiveTraits,
    schoolScheduleSettings,
    students,
    staffProfiles,
    academicSessions
} from "../db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { TeacherService } from "../services/TeacherService";
import { hasPermission, hasRole } from "@/lib/rbac";

/**
 * Fetch all students in a class for behavioral/remark entry
 */
export async function getStudentsInClass(groupId: number) {
    return await db.select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        matricNumber: students.matricNumber,
    })
    .from(students)
    .where(eq(students.groupId, groupId))
    .orderBy(students.lastName);
}

/**
 * Save behavioral scores for a batch of students or traits
 */
export async function saveBehavioralScores(data: {
    studentId: number;
    traitId: number;
    sessionId: number;
    term: '1' | '2' | '3';
    score: number;
    recordedBy: number;
}[]) {
    const allowed = await hasPermission("teachers.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("staff");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to save behavioral scores" };

    for (const record of data) {
        // Upsert logic: check if exists, then update or insert
        const [existing] = await db.select().from(behavioralScores)
            .where(and(
                eq(behavioralScores.studentId, record.studentId),
                eq(behavioralScores.traitId, record.traitId),
                eq(behavioralScores.sessionId, record.sessionId),
                eq(behavioralScores.term, record.term)
            ))
            .limit(1);

        if (existing) {
            await db.update(behavioralScores)
                .set({ score: record.score, recordedBy: record.recordedBy })
                .where(eq(behavioralScores.id, existing.id));
        } else {
            await db.insert(behavioralScores).values(record);
        }
    }
    revalidatePath("/staff/dashboard");
    return { success: true };
}

/**
 * Save report remarks and attendance
 */
export async function saveReportRemarks(data: {
    studentId: number;
    sessionId: number;
    term: '1' | '2' | '3';
    classTeacherComment?: string;
    headTeacherComment?: string;
    daysPresent?: number;
    daysAbsent?: number;
    daysOpen?: number;
    recordedBy: number;
}) {
    const allowed = await hasPermission("teachers.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("staff");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to save report remarks" };

    const [existing] = await db.select().from(reportRemarks)
        .where(and(
            eq(reportRemarks.studentId, data.studentId),
            eq(reportRemarks.sessionId, data.sessionId),
            eq(reportRemarks.term, data.term)
        ))
        .limit(1);

    if (existing) {
        await db.update(reportRemarks)
            .set(data)
            .where(eq(reportRemarks.id, existing.id));
    } else {
        await db.insert(reportRemarks).values(data);
    }
    revalidatePath("/staff/dashboard");
    return { success: true };
}

/**
 * Get K12 specific schedule settings (Total Days Open, Term Dates)
 */
export async function getSchoolSchedule(sessionId: number, term: '1' | '2' | '3', unitId?: number) {
    const whereClause = [
        eq(schoolScheduleSettings.sessionId, sessionId),
        eq(schoolScheduleSettings.term, term)
    ];
    if (unitId) whereClause.push(eq(schoolScheduleSettings.unitId, unitId));

    const [settings] = await db.select()
        .from(schoolScheduleSettings)
        .where(and(...whereClause))
        .limit(1);
    
    return settings || null;
}

/**
 * Admin: Update school schedule settings
 */
export async function updateSchoolSchedule(data: typeof schoolScheduleSettings.$inferInsert) {
    const allowed = await hasPermission("academic.timetable.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update school schedule" };

    const [existing] = await db.select().from(schoolScheduleSettings)
        .where(and(
            eq(schoolScheduleSettings.sessionId, data.sessionId),
            eq(schoolScheduleSettings.term, data.term),
            data.unitId ? eq(schoolScheduleSettings.unitId, data.unitId) : undefined
        ))
        .limit(1);

    if (existing) {
        await db.update(schoolScheduleSettings)
            .set(data)
            .where(eq(schoolScheduleSettings.id, existing.id));
    } else {
        await db.insert(schoolScheduleSettings).values(data);
    }
    return { success: true };
}

/**
 * Get all available behavioral traits
 */
export async function getAffectiveTraits() {
    return await db.select().from(affectiveTraits).where(eq(affectiveTraits.isActive, true));
}

/**
 * Fetch all necessary data for the Teacher Dashboard (K12)
 */
export async function getTeacherDashboardData(staffProfileId: number) {
    // 1. Get current active session
    const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isActive, true)).limit(1);
    if (!currentSession) return { classes: [], subjects: [] };

    // Term usually defaults to 1 if not otherwise set in a session context, but we'll assume 1 for now or fetch from a global setting
    const term = '1'; 

    const [classes, subjects] = await Promise.all([
        TeacherService.getAssignedClasses(staffProfileId, currentSession.id),
        TeacherService.getAssignedSubjects(staffProfileId, currentSession.id)
    ]);

    // Fetch stats for each
    const classWithStats = await Promise.all(classes.map(async (c) => {
        const stats = await TeacherService.getClassCompletionStats(c.id, currentSession.id, term);
        return {
            ...c,
            stats,
            percentage: Math.round((stats.attendance + stats.traits + stats.comments) / 3)
        };
    }));

    const subjectsWithStats = await Promise.all(subjects.map(async (s) => {
        const percentage = await TeacherService.getSubjectCompletionStats(s.courseId, s.groupId, currentSession.id, parseInt(term));
        return {
            ...s,
            percentage
        };
    }));

    return {
        sessionName: currentSession.name,
        sessionId: currentSession.id,
        term,
        classes: classWithStats,
        subjects: subjectsWithStats
    };
}

/**
 * Admin: Manage Trait Definitions
 */
export async function updateAffectiveTrait(data: typeof affectiveTraits.$inferInsert) {
    const allowed = await hasPermission("academic.grading.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to manage affective traits" };

    if (data.id) {
        await db.update(affectiveTraits).set(data).where(eq(affectiveTraits.id, data.id));
    } else {
        await db.insert(affectiveTraits).values(data);
    }
    return { success: true };
}
