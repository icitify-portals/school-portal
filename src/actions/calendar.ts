"use server";

import { db } from "@/db/db";
import { 
    academicCalendarEvents, 
    academicCalendarMilestones,
    academicSessions,
    institutionalUnits,
    users
} from "@/db/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getCalendarEvents(filters: {
    unitId?: number;
    audience?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    const conditions = [];
    
    if (filters.unitId) {
        conditions.push(sql`(${academicCalendarEvents.unitId} = ${filters.unitId} OR ${academicCalendarEvents.unitId} IS NULL)`);
    }
    
    if (filters.audience) {
        conditions.push(eq(academicCalendarEvents.targetAudience, filters.audience as any));
    }

    if (filters.startDate) {
        conditions.push(gte(academicCalendarEvents.startDate, filters.startDate));
    }

    if (filters.endDate) {
        conditions.push(lte(academicCalendarEvents.endDate, filters.endDate));
    }

    const rows = await db
        .select({
            id: academicCalendarEvents.id,
            title: academicCalendarEvents.title,
            description: academicCalendarEvents.description,
            startDate: academicCalendarEvents.startDate,
            endDate: academicCalendarEvents.endDate,
            type: academicCalendarEvents.type,
            targetAudience: academicCalendarEvents.targetAudience,
            unitId: academicCalendarEvents.unitId,
            isPublic: academicCalendarEvents.isPublic,
            color: academicCalendarEvents.color,
            createdBy: academicCalendarEvents.createdBy,
            createdAt: academicCalendarEvents.createdAt,
            updatedAt: academicCalendarEvents.updatedAt,
            unit: {
                id: institutionalUnits.id,
                name: institutionalUnits.name,
                code: institutionalUnits.code,
                slug: institutionalUnits.slug,
                academicTier: institutionalUnits.academicTier,
            },
            creator: {
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
            }
        })
        .from(academicCalendarEvents)
        .leftJoin(institutionalUnits, eq(academicCalendarEvents.unitId, institutionalUnits.id))
        .leftJoin(users, eq(academicCalendarEvents.createdBy, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(academicCalendarEvents.startDate));

    return rows.map(row => ({
        ...row,
        unit: row.unit?.id ? row.unit : null,
        creator: row.creator?.id ? row.creator : null,
    }));
}

export async function createCalendarEvent(data: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    type: string;
    targetAudience: string;
    unitId?: number;
    isPublic: boolean;
    color?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = parseInt(session.user.id);

    await db.insert(academicCalendarEvents).values({
        ...data,
        type: data.type as any,
        targetAudience: data.targetAudience as any,
        createdBy: userId
    });

    revalidatePath("/admin/calendar");
}

export async function getUpcomingEvents(limit: number = 5) {
    const now = new Date();
    
    const rows = await db
        .select({
            id: academicCalendarEvents.id,
            title: academicCalendarEvents.title,
            description: academicCalendarEvents.description,
            startDate: academicCalendarEvents.startDate,
            endDate: academicCalendarEvents.endDate,
            type: academicCalendarEvents.type,
            targetAudience: academicCalendarEvents.targetAudience,
            unitId: academicCalendarEvents.unitId,
            isPublic: academicCalendarEvents.isPublic,
            color: academicCalendarEvents.color,
            createdBy: academicCalendarEvents.createdBy,
            createdAt: academicCalendarEvents.createdAt,
            updatedAt: academicCalendarEvents.updatedAt,
            unit: {
                id: institutionalUnits.id,
                name: institutionalUnits.name,
                code: institutionalUnits.code,
                slug: institutionalUnits.slug,
                academicTier: institutionalUnits.academicTier,
            }
        })
        .from(academicCalendarEvents)
        .leftJoin(institutionalUnits, eq(academicCalendarEvents.unitId, institutionalUnits.id))
        .where(gte(academicCalendarEvents.endDate, now))
        .limit(limit)
        .orderBy(academicCalendarEvents.startDate);

    return rows.map(row => ({
        ...row,
        unit: row.unit?.id ? row.unit : null,
    }));
}

export async function syncAcademicMilestones(sessionId: number) {
    return { success: true };
}
