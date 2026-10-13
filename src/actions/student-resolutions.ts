"use server";

import { db } from "@/db/db";
import { students, users, systemAuditLogs } from "@/db/schema";
import { eq, and, or, like, inArray, sql, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Students who also hold an admission application and have a graduant status.
 * Historically applicants were sometimes promoted to `nd_graduant`/`hnd_graduant`
 * without ever enrolling. This tool lets an admin review each record and set the
 * correct status + graduation year, individually or in bulk.
 */

const GRADUANT_STATUSES = ['nd_graduant', 'hnd_graduant', 'nd_graduated', 'hnd_graduated'];

const VALID_STATUSES = [
    'active', 'suspended', 'withdrawn', 'pending_review', 'rusticated',
    'nd_graduant', 'hnd_graduant', 'nd_graduated', 'hnd_graduated'
];

export type ResolveAction =
    | 'update'
    | 'set_status'
    | 'set_graduation_year'
    | 'clear_graduation_year'
    | 'soft_delete'
    | 'restore';

async function ensureResolver(): Promise<
    { actorId: number; error: null } | { actorId: null; error: string }
> {
    const session = await auth();
    if (!session?.user) {
        return { actorId: null, error: "You are not signed in, or your session has expired." };
    }
    const user = await db.query.users.findFirst({
        where: eq(users.id, Number(session.user.id)),
        columns: { id: true, role: true }
    });
    const allowed = ['admin', 'superadmin', 'icitify_dev', 'registrar', 'admission_officer'];
    if (!user || !allowed.includes(user.role || '')) {
        return {
            actorId: null,
            error: `Your role "${user?.role || 'none'}" may not resolve student records. Allowed roles: ${allowed.join(', ')}.`
        };
    }
    return { actorId: user.id, error: null };
}

async function audit(actorId: number, action: string, targetId: number, details: object) {
    try {
        await db.insert(systemAuditLogs).values({
            actorId,
            action,
            targetId: String(targetId),
            details: JSON.stringify(details),
            status: 'success'
        });
    } catch (e) {
        console.error('[student-resolutions] audit write failed:', e);
    }
}

function graduantStatusSql() {
    return sql`${students.status} IN ('nd_graduant','hnd_graduant','nd_graduated','hnd_graduated')`;
}

export async function getStudentResolutionIssues(options: {
    search?: string;
    history?: 'all' | 'none' | 'some';
    status?: string;
    scope?: 'applicant_graduant' | 'graduant' | 'all';
    page?: number;
    pageSize?: number;
} = {}) {
    const authz = await ensureResolver();
    if (authz.error) return { success: false, error: authz.error, data: [], totalCount: 0 };

    const {
        search = '', history = 'all', status = 'all',
        scope = 'applicant_graduant', page = 1, pageSize = 20
    } = options;

    try {
        const conditions: any[] = [sql`${students.deletedAt} IS NULL`];

        if (scope === 'applicant_graduant') {
            conditions.push(graduantStatusSql());
            conditions.push(sql`EXISTS (SELECT 1 FROM admission_applications_v2 a WHERE a.applicant_id = ${students.userId})`);
        } else if (scope === 'graduant') {
            conditions.push(graduantStatusSql());
        }

        if (status && status !== 'all') {
            conditions.push(sql`${students.status} = ${status}`);
        }

        if (search.trim()) {
            const p = `%${search}%`;
            conditions.push(sql`(${users.name} LIKE ${p} OR ${users.email} LIKE ${p} OR ${students.matricNumber} LIKE ${p})`);
        }

        const where = and(...conditions);

        const [countRows] = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(where);
        const totalCount = Number(countRows?.count || 0);

        // "none" = never enrolled and never has a result; "some" = has either.
        let having: any = undefined;
        if (history !== 'all') {
            having = history === 'none'
                ? sql`(SELECT COUNT(*) FROM enrollments e WHERE e.student_id = ${students.id}) = 0 AND (SELECT COUNT(*) FROM student_results r WHERE r.student_id = ${students.id}) = 0`
                : sql`EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = ${students.id}) OR EXISTS (SELECT 1 FROM student_results r WHERE r.student_id = ${students.id})`;
        }

        const offset = (page - 1) * pageSize;
        const rows = await db.select({
            id: students.id,
            userId: students.userId,
            matricNumber: students.matricNumber,
            status: students.status,
            currentLevel: students.currentLevel,
            programmeType: students.programmeType,
            admissionYear: students.admissionYear,
            graduatedAt: students.graduatedAt,
            name: users.name,
            email: users.email,
            enrollments: sql<number>`(SELECT COUNT(*) FROM enrollments e WHERE e.student_id = ${students.id})`,
            results: sql<number>`(SELECT COUNT(*) FROM student_results r WHERE r.student_id = ${students.id})`,
            appId: sql<number>`(SELECT a.id FROM admission_applications_v2 a WHERE a.applicant_id = ${students.userId} ORDER BY a.id DESC LIMIT 1)`,
            appStatus: sql<string>`(SELECT a.status FROM admission_applications_v2 a WHERE a.applicant_id = ${students.userId} ORDER BY a.id DESC LIMIT 1)`
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(having ? and(where, having) : where)
            .orderBy(sql`${students.id}`)
            .limit(pageSize)
            .offset(offset);

        return {
            success: true,
            data: rows.map((r) => ({
                ...r,
                graduatedYear: r.graduatedAt ? new Date(r.graduatedAt).getUTCFullYear() : null
            })),
            totalCount
        };
    } catch (e: any) {
        console.error('Failed to fetch resolution issues:', e);
        return { success: false, error: e?.message || 'Could not read student records.', data: [], totalCount: 0 };
    }
}

export async function resolveStudentIssues(input: {
    ids: number[];
    action: ResolveAction;
    status?: string;
    graduationYear?: number | null;
    note?: string;
}) {
    const authz = await ensureResolver();
    if (authz.error) return { success: false, error: authz.error };
    const actorId = authz.actorId!;

    if (!Array.isArray(input.ids) || input.ids.length === 0) {
        return { success: false, error: 'No records selected' };
    }

    if ((input.action === 'set_status' || input.action === 'update') && (!input.status || !VALID_STATUSES.includes(input.status))) {
        return { success: false, error: 'A valid status is required.' };
    }

    const idList = input.ids.map((i) => Number(i)).filter((i) => !isNaN(i));
    if (idList.length === 0) return { success: false, error: 'No records selected' };

    try {
        if (input.action === 'soft_delete') {
            await db.update(students)
                .set({ deletedAt: new Date(), status: 'withdrawn' })
                .where(inArray(students.id, idList));
        } else if (input.action === 'restore') {
            await db.update(students)
                .set({ deletedAt: null })
                .where(inArray(students.id, idList));
        } else {
            const set: Record<string, any> = {};
            if (input.action === 'set_status' || input.action === 'update') set.status = input.status;

            if (input.action === 'clear_graduation_year') {
                set.graduatedAt = null;
            } else if (input.action === 'set_graduation_year' || input.action === 'update') {
                if (input.graduationYear === null || input.graduationYear === undefined) {
                    set.graduatedAt = null;
                } else {
                    const y = Number(input.graduationYear);
                    if (isNaN(y) || y < 1900 || y > 2200) {
                        return { success: false, error: 'Graduation year must be between 1900 and 2200.' };
                    }
                    set.graduatedAt = new Date(Date.UTC(y, 6, 31));
                }
            }

            await db.update(students).set(set).where(inArray(students.id, idList));
        }

        await audit(actorId, `STUDENT_RESOLVE_${input.action.toUpperCase()}`, idList[0], {
            ids: idList,
            count: idList.length,
            status: input.status ?? null,
            graduationYear: input.graduationYear ?? null,
            note: input.note ?? null
        });

        revalidatePath('/admin/student-resolutions');
        revalidatePath('/admin/students');
        return { success: true, message: `Resolved ${idList.length} record(s).` };
    } catch (e: any) {
        console.error('Failed to resolve student issues:', e);
        return { success: false, error: e?.message || 'Action failed.' };
    }
}

export async function getStudentResolutionHistory(limit = 50) {
    const authz = await ensureResolver();
    if (authz.error) return { success: false, error: authz.error, data: [] };

    try {
        const rows = await db.select().from(systemAuditLogs)
            .where(sql`${systemAuditLogs.action} LIKE 'STUDENT_RESOLVE%'`)
            .orderBy(desc(systemAuditLogs.id))
            .limit(limit);
        return { success: true, data: rows };
    } catch (e: any) {
        return { success: false, error: e?.message || 'Could not read history.', data: [] };
    }
}
