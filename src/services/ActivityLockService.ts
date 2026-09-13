import { db } from "@/db/db";
import { activityLocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache, revalidateTag } from "next/cache";

/**
 * Activity Lock Service — flexible portal-wide lock/schedule primitive.
 *
 * Every controllable activity (e.g. "school_fee_payment", "course_registration")
 * can have zero or more locks. Locks carry a scope (global | programme_level |
 * department | applicant) and an optional time window:
 *
 *   - opensAt  : "locked until" — enforced while now < opensAt, auto-releases at opensAt.
 *   - closesAt : "lock expires" — enforced while now <= closesAt, auto-releases after.
 *   - neither  : enforced whenever isLocked is true.
 *   - both set : opensAt governs (equivalent to a "locked until" window).
 *
 * Windows are evaluated at read time, so no cron is required — "ND 2 can't
 * register until Monday 10am" just starts working the moment the clock passes
 * opensAt.
 *
 * Matching semantics: when multiple locks exist for the same activity, the most
 * specific matching scope wins (programme_level > department > applicant >
 * global), so admins can carve out exceptions. Levels are normalized across the
 * legacy 100/200/300/400 encoding. Default state is always OPEN (no lock rows).
 */

export const ACTIVITIES = {
    SCHOOL_FEE_PAYMENT: 'school_fee_payment',
    APPLICATION_SUBMISSION: 'application_submission',
    APPLICATION_PAYMENT: 'application_payment',
    ACCEPTANCE_FEE_PAYMENT: 'acceptance_fee_payment',
    COURSE_REGISTRATION: 'course_registration',
    ADD_DROP: 'add_drop',
} as const;

export type ActivityKey = typeof ACTIVITIES[keyof typeof ACTIVITIES];

export const ACTIVITY_LABELS: Record<string, string> = {
    [ACTIVITIES.SCHOOL_FEE_PAYMENT]: 'School Fee Payments',
    [ACTIVITIES.APPLICATION_SUBMISSION]: 'Application Form Submission',
    [ACTIVITIES.APPLICATION_PAYMENT]: 'Application Fee Payments',
    [ACTIVITIES.ACCEPTANCE_FEE_PAYMENT]: 'Acceptance Fee Payments',
    [ACTIVITIES.COURSE_REGISTRATION]: 'Course Registration',
    [ACTIVITIES.ADD_DROP]: 'Add/Drop',
};

export const ACTIVITY_SCOPES = ['global', 'programme_level', 'department', 'applicant'] as const;
export type ActivityScope = typeof ACTIVITY_SCOPES[number];

export interface ActivityLockContext {
    programmeType?: 'ND' | 'HND' | string | null;
    level?: number | string | null; // currentLevel (legacy 100/200/300/400 tolerated)
    departmentId?: number | null;
    applicantOnly?: boolean; // true for applicant-scoped flows (no student context)
}

export type ActivityLockRow = typeof activityLocks.$inferSelect;

/** Build a lock context from a students row (programmeType + academic level + department). */
export function buildStudentLockContext(student: {
    programmeType?: string | null;
    currentLevel?: number | null;
    deptId?: number | null;
}): ActivityLockContext {
    return {
        programmeType: student.programmeType || null,
        level: student.currentLevel ?? null,
        departmentId: student.deptId ?? null,
    };
}

/** Normalize legacy 100/200/300/400/500 level encoding to 1/2/3. */
export function normalizeLevel(level?: number | string | null): number | null {
    if (level === undefined || level === null || level === '') return null;
    const n = typeof level === 'string' ? parseInt(level) : level;
    if (isNaN(n)) return null;
    if (n === 100) return 1; // ND 1
    if (n === 200) return 2; // ND 2
    if (n === 300) return 1; // HND 1
    if (n === 400) return 2; // HND 2
    if (n === 500) return 3; // HND 3
    return n;
}

const SCOPE_SPECIFICITY: Record<ActivityScope, number> = {
    programme_level: 3,
    department: 2,
    applicant: 1,
    global: 0,
};

function lockMatchesScope(lock: ActivityLockRow, ctx: ActivityLockContext): boolean {
    switch (lock.scope) {
        case 'global':
            return true;
        case 'applicant':
            return !!ctx.applicantOnly;
        case 'programme_level': {
            if (!ctx.programmeType || ctx.level === undefined || ctx.level === null) return false;
            if (lock.programmeType && lock.programmeType.toLowerCase() !== String(ctx.programmeType).toLowerCase()) return false;
            const lockLevel = normalizeLevel(lock.level);
            const ctxLevel = normalizeLevel(ctx.level);
            if (!lockLevel || !ctxLevel) return false;
            return lockLevel === ctxLevel;
        }
        case 'department':
            return !!ctx.departmentId && lock.departmentId === ctx.departmentId;
        default:
            return false;
    }
}

function lockIsEnforced(lock: ActivityLockRow, now: Date = new Date()): { enforced: boolean; resumeAt: string | null } {
    if (!lock.isLocked) return { enforced: false, resumeAt: null };

    const opensAt = lock.opensAt ? new Date(lock.opensAt) : null;
    const closesAt = lock.closesAt ? new Date(lock.closesAt) : null;

    if (opensAt) {
        // "locked until" — enforced while now < opensAt.
        const enforced = now < opensAt;
        return { enforced, resumeAt: enforced ? opensAt.toISOString() : null };
    }
    if (closesAt) {
        // "lock expires" — enforced while now <= closesAt.
        return { enforced: now <= closesAt, resumeAt: null };
    }
    return { enforced: true, resumeAt: null };
}

const internalGetLocks = unstable_cache(
    async (): Promise<ActivityLockRow[]> => {
        try {
            const rows = await db.select().from(activityLocks).orderBy(activityLocks.activity, activityLocks.id);
            return rows as ActivityLockRow[];
        } catch (error: any) {
            if (error?.digest?.includes("DYNAMIC_SERVER_USAGE") || error?.name === "DynamicServerError") throw error;
            console.error("[ActivityLockService] Failed to fetch activity locks:", error);
            return [];
        }
    },
    ['activity-locks'],
    { tags: ['activity-locks'], revalidate: 60 }
);

/** All lock rows (cached 60s, invalidated on any write). */
export async function getActivityLocks(): Promise<ActivityLockRow[]> {
    return internalGetLocks();
}

export interface ActivityUnlockResult {
    unlocked: boolean;
    lock?: ActivityLockRow;
    message?: string | null;
    resumeAt?: string | null;
}

/**
 * True when the given activity is allowed for the context. Defaults to open.
 * If locked, `message` (from the lock row) and `resumeAt` (auto-open time) are
 * provided for user-facing blocks.
 */
export async function isActivityUnlocked(activity: string, ctx: ActivityLockContext = {}): Promise<ActivityUnlockResult> {
    const locks = await internalGetLocks();
    const matching = locks.filter(l => l.activity === activity && lockMatchesScope(l, ctx));
    if (matching.length === 0) return { unlocked: true };

    matching.sort((a, b) => SCOPE_SPECIFICITY[b.scope as ActivityScope] - SCOPE_SPECIFICITY[a.scope as ActivityScope]);
    const effective = matching[0];
    const { enforced, resumeAt } = lockIsEnforced(effective);

    if (!enforced) return { unlocked: true, lock: effective };
    return { unlocked: false, lock: effective, message: effective.message || null, resumeAt };
}

export const DEFAULT_LOCK_MESSAGES: Record<string, string> = {
    [ACTIVITIES.SCHOOL_FEE_PAYMENT]: 'School fee payments are currently closed. Please try again later.',
    [ACTIVITIES.COURSE_REGISTRATION]: 'Course registration is currently closed for your level.',
    [ACTIVITIES.ADD_DROP]: 'Add/Drop is currently closed.',
};

/**
 * Guard helper for server-side choke points (payment engines, registration
 * actions). Returns success:false with a user-safe error when the activity is
 * locked for the given context.
 */
export async function assertActivityUnlocked(activity: string, ctx: ActivityLockContext = {}): Promise<{ success: boolean; error?: string; resumeAt?: string | null }> {
    const result = await isActivityUnlocked(activity, ctx);
    if (result.unlocked) return { success: true };
    const error = result.message || DEFAULT_LOCK_MESSAGES[activity] || 'This action is currently locked on the portal.';
    return { success: false, error, resumeAt: result.resumeAt || null };
}

// ---- Management (used by admin server actions) ----

export interface ActivityLockInput {
    activity: string;
    scope: ActivityScope;
    programmeType?: 'ND' | 'HND' | null;
    level?: number | null;
    departmentId?: number | null;
    isLocked: boolean;
    opensAt?: string | Date | null;
    closesAt?: string | Date | null;
    message?: string | null;
    createdBy?: number | null;
}

export async function createActivityLock(data: ActivityLockInput): Promise<ActivityLockRow> {
    const [row] = await db.insert(activityLocks).values({
        activity: data.activity,
        scope: data.scope,
        programmeType: data.programmeType || null,
        level: data.level ?? null,
        departmentId: data.departmentId ?? null,
        isLocked: data.isLocked,
        opensAt: data.opensAt ? new Date(data.opensAt) : null,
        closesAt: data.closesAt ? new Date(data.closesAt) : null,
        message: data.message || null,
        createdBy: data.createdBy ?? null,
    });
    revalidateTag('activity-locks', 'default');
    const created = await db.select().from(activityLocks).where(eq(activityLocks.id, Number(row.insertId))).limit(1);
    return created[0];
}

export async function updateActivityLock(id: number, data: Partial<ActivityLockInput>): Promise<ActivityLockRow | null> {
    await db.update(activityLocks).set({
        ...(data.activity !== undefined ? { activity: data.activity } : {}),
        ...(data.scope !== undefined ? { scope: data.scope } : {}),
        ...(data.programmeType !== undefined ? { programmeType: data.programmeType || null } : {}),
        ...(data.level !== undefined ? { level: data.level ?? null } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId ?? null } : {}),
        ...(data.isLocked !== undefined ? { isLocked: data.isLocked } : {}),
        ...(data.opensAt !== undefined ? { opensAt: data.opensAt ? new Date(data.opensAt) : null } : {}),
        ...(data.closesAt !== undefined ? { closesAt: data.closesAt ? new Date(data.closesAt) : null } : {}),
        ...(data.message !== undefined ? { message: data.message || null } : {}),
        ...(data.createdBy !== undefined ? { createdBy: data.createdBy ?? null } : {}),
    }).where(eq(activityLocks.id, id));
    revalidateTag('activity-locks', 'default');
    const [updated] = await db.select().from(activityLocks).where(eq(activityLocks.id, id)).limit(1);
    return updated || null;
}

export async function deleteActivityLock(id: number): Promise<boolean> {
    const res = await db.delete(activityLocks).where(eq(activityLocks.id, id));
    revalidateTag('activity-locks', 'default');
    return !!res[0].affectedRows;
}