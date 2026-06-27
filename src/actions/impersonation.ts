"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function impersonateUser(targetUserId: number) {
    try {
        const session = await auth();
        const actorRole = (session?.user as any)?.role?.toLowerCase() || "";

        const allowedRoles = ['superadmin', 'admin', 'dvc', 'bursar', 'registrar'];
        if (!session?.user || !allowedRoles.includes(actorRole) || !session.user.id) {
            return { error: "Unauthorized. Admin access required." };
        }

        // Prevent self-impersonation
        if (parseInt(session.user.id) === targetUserId) {
            return { error: "You cannot impersonate yourself." };
        }

        // Fetch target user data
        const { db } = await import("@/db/db");
        const { users, systemAuditLogs } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

        if (!targetUser) return { error: "Target user not found." };

        // SECURITY FIX: Prevent privilege escalation via impersonation.
        // Only superadmin can impersonate admin-level users.
        // Non-superadmins (bursar, registrar) can only impersonate students and staff.
        const highPrivilegeRoles = ['admin', 'superadmin', 'dvc', 'registrar', 'bursar', 'librarian', 'dean', 'hod'];
        if (actorRole !== 'superadmin' && highPrivilegeRoles.includes(targetUser.role?.toLowerCase() || '')) {
            return { error: "Unauthorized: You cannot impersonate a user with equal or higher privilege level." };
        }


        // Log impersonation to systemAuditLogs
        await db.insert(systemAuditLogs).values({
            actorId: parseInt(session.user.id),
            action: 'IMPERSONATE_USER',
            targetId: targetUserId.toString(),
            details: JSON.stringify({ targetUserEmail: targetUser.email, targetUserName: targetUser.name, timestamp: new Date() }),
            status: 'success'
        });

        const cookieStore = await cookies();

        // Set impersonated ID and Role
        cookieStore.set("impersonated_id", targetUserId.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        cookieStore.set("impersonated_role", targetUser.role || 'student', {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        // Store original ID to allow return
        cookieStore.set("original_admin_id", session.user.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Impersonation Error:", error);
        return { error: "Failed to start impersonation." };
    }
}

export async function stopImpersonating() {
    try {
        // SECURITY FIX M-1: Verify the caller has an active session before
        // modifying cookies. Prevents unauthenticated stop requests.
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized." };
        }

        const cookieStore = await cookies();
        cookieStore.delete("impersonated_id");
        cookieStore.delete("impersonated_role");
        cookieStore.delete("original_admin_id");

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { error: "Failed to stop impersonation." };
    }
}
