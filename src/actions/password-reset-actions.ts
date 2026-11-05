"use server";

import { db } from "@/db/db";
import { users, systemAuditLogs } from "@/db/schema";
import { eq, or, and, like, desc, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

// Roles allowed to use the central password reset dashboard.
const RESET_ADMIN_ROLES = ["superadmin", "icitify_dev", "admin", "rector", "registrar", "ict_manager", "ictmanager"];
// Accounts that only a super-admin may reset.
const PROTECTED_TARGET_ROLES = ["superadmin", "icitify_dev"];
const DEFAULT_PASSWORD = "welcome123";

async function requireResetAdmin() {
    const session = await auth();
    const role = ((session?.user as any)?.role || "").toLowerCase();
    const id = session?.user?.id ? parseInt(session.user.id as any) : null;
    if (!id || !RESET_ADMIN_ROLES.includes(role)) {
        throw new Error("Unauthorized: only Admin, Rector or Registrar can reset passwords.");
    }
    return { actorId: id, actorRole: role };
}

export async function searchUsersForReset(query: string, role?: string) {
    try {
        await requireResetAdmin();
        const q = (query || "").trim();
        if (q.length < 2 && !role) return { success: true, data: [] };

        const conds: any[] = [];
        if (q) {
            const p = `%${q}%`;
            conds.push(or(
                like(users.name, p),
                like(users.email, p),
                sql`EXISTS (SELECT 1 FROM students s WHERE s.user_id = ${users.id} AND (s.matric_number LIKE ${p} OR s.admission_number LIKE ${p}))`
            ));
        }
        if (role && role !== "all") conds.push(eq(users.role, role as any));

        const data = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            status: users.status,
            requiresPasswordChange: users.requiresPasswordChange,
            matricNumber: sql<string | null>`(SELECT s.matric_number FROM students s WHERE s.user_id = ${users.id} LIMIT 1)`,
        })
        .from(users)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(users.name)
        .limit(50);

        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}

/** Reset one or many users to the default password (forces a change at next login). */
export async function resetPasswordsCentral(userIds: number[], customPassword?: string) {
    try {
        const { actorId, actorRole } = await requireResetAdmin();
        const ids = Array.from(new Set(userIds)).filter(Boolean);
        if (!ids.length) return { success: false, error: "No users selected." };
        if (ids.length > 200) return { success: false, error: "Maximum 200 users per batch." };
        if (customPassword !== undefined && customPassword !== "" && customPassword.length < 6) {
            return { success: false, error: "Custom password must be at least 6 characters." };
        }

        const targets = await db.select({ id: users.id, role: users.role }).from(users).where(inArray(users.id, ids));
        const allowed = targets.filter((t) => {
            if (t.id === actorId) return false; // no self-reset here; use Change Password
            const r = (t.role || "").toString().toLowerCase();
            if (PROTECTED_TARGET_ROLES.includes(r) && !PROTECTED_TARGET_ROLES.includes(actorRole)) return false;
            return true;
        });
        const skipped = ids.length - allowed.length;
        if (!allowed.length) return { success: false, error: "None of the selected accounts can be reset by you." };

        const hash = await bcrypt.hash(customPassword || DEFAULT_PASSWORD, 10);
        const allowedIds = allowed.map((a) => a.id);

        await db.update(users).set({
            password: hash,
            requiresPasswordChange: true,
            failedLoginAttempts: 0,
            lockoutUntil: null,
        }).where(inArray(users.id, allowedIds));

        await db.insert(systemAuditLogs).values(allowed.map((a) => ({
            actorId,
            action: "RESET_PASSWORD",
            targetId: a.id.toString(),
            details: JSON.stringify({ userId: a.id, actorRole, via: "central_dashboard", bulk: allowed.length > 1, timestamp: new Date() }),
            status: "success" as const,
        })));

        revalidatePath("/admin/security/password-reset");
        return {
            success: true,
            message: `${allowed.length} password(s) reset. Users must change it at next login.${skipped ? ` ${skipped} skipped (not permitted).` : ""}`,
        };
    } catch (error) {
        return { success: false, error: (error as Error).message || "Failed to reset passwords." };
    }
}

export async function getRecentPasswordResets(limit = 20) {
    try {
        await requireResetAdmin();
        const rows = await db.select({
            id: systemAuditLogs.id,
            createdAt: systemAuditLogs.createdAt,
            targetId: systemAuditLogs.targetId,
            actorName: sql<string>`(SELECT name FROM users WHERE id = ${systemAuditLogs.actorId})`,
            targetName: sql<string>`(SELECT name FROM users WHERE id = CAST(${systemAuditLogs.targetId} AS UNSIGNED))`,
            targetEmail: sql<string>`(SELECT email FROM users WHERE id = CAST(${systemAuditLogs.targetId} AS UNSIGNED))`,
        })
        .from(systemAuditLogs)
        .where(eq(systemAuditLogs.action, "RESET_PASSWORD"))
        .orderBy(desc(systemAuditLogs.createdAt))
        .limit(limit);
        return { success: true, data: rows };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}
