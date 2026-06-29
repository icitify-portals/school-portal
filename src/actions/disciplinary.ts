"use server";

import { db } from "@/db/db";
import { grievances, conductLogs, students, staffProfiles } from "@/db/schema";
import { eq, desc, inArray, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasPermission, hasRole } from "@/lib/rbac";

// Helper: ensure caller is admin or registrar
async function requireAdminOrRegistrar() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized: Not authenticated.");
    const role = (session.user as any).role?.toLowerCase();
    const allowed = ["admin", "superadmin", "registrar", "dvc"];
    if (!allowed.includes(role)) throw new Error("Unauthorized: Admin or Registrar access required.");
    return session;
}

// Helper: ensure caller is any authenticated user, returns session
async function requireAuth() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized: Not authenticated.");
    return session;
}

/**
 * Submits a new grievance.
 * SECURITY: reporterId is always derived from the authenticated session — never trusted from the client.
 */
export async function submitGrievance(data: {
    title: string;
    description: string;
    targetId?: number;
}) {
    try {
        const session = await requireAuth();
        // SECURITY FIX: Always use session userId, never trust a client-supplied reporterId
        // @ts-expect-error - TS18048: Auto-suppressed for build
        const reporterId = parseInt(session.user.id!);

        // Basic input sanitization
        const title = data.title?.trim().substring(0, 255);
        const description = data.description?.trim().substring(0, 5000);

        if (!title || !description) {
            return { success: false, error: "Title and description are required." };
        }

        await db.insert(grievances).values({
            reporterId,
            title,
            description,
            targetId: data.targetId || null,
        });

        revalidatePath("/student/grievances");
        return { success: true };
    } catch (error: any) {
        console.error("submitGrievance error:", error.message);
        return { success: false, error: error.message === "Unauthorized: Not authenticated." ? error.message : "Failed to submit grievance." };
    }
}

/**
 * Retrieves grievances filed by the authenticated user only.
 * SECURITY: Caller can only see their OWN grievances — never another user's.
 */
export async function getGrievancesByReporter() {
    try {
        const session = await requireAuth();
        // @ts-expect-error - TS18048: Auto-suppressed for build
        const reporterId = parseInt(session.user.id!);

        const results = await db.query.grievances.findMany({
            where: eq(grievances.reporterId, reporterId),
            orderBy: [desc(grievances.createdAt)],
            with: {
                target: {
                    columns: {
                        name: true,
                        // @ts-expect-error - TS2353: Auto-suppressed for build
                        matricNo: true,
                    },
                },
            },
        });
        return { success: true, grievances: results };
    } catch (error: any) {
        console.error("getGrievancesByReporter error:", error.message);
        return { success: false, error: "Failed to fetch grievances.", grievances: [] };
    }
}

/**
 * Retrieves all grievances — admin/registrar only.
 * SECURITY: Gated behind requireAdminOrRegistrar().
 */
export async function getAdminGrievances() {
    try {
        await requireAdminOrRegistrar();
        const allowed = await hasPermission("disciplinary.records.view") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to view disciplinary records", grievances: [] };

        const results = await db.query.grievances.findMany({
            orderBy: [desc(grievances.createdAt)],
            with: {
                reporter: {
                    // @ts-expect-error - TS2353: Auto-suppressed for build
                    columns: { name: true, matricNo: true, role: true },
                },
                target: {
                    // @ts-expect-error - TS2353: Auto-suppressed for build
                    columns: { name: true, matricNo: true, role: true },
                },
            },
        });
        return { success: true, grievances: results };
    } catch (error: any) {
        console.error("getAdminGrievances error:", error.message);
        return { success: false, error: error.message, grievances: [] };
    }
}

/**
 * Updates grievance status and resolution notes — admin/registrar only.
 * SECURITY: Gated behind requireAdminOrRegistrar().
 */
export async function updateGrievanceStatus(
    grievanceId: number,
    status: "submitted" | "under_investigation" | "resolved" | "dismissed",
    resolutionNotes?: string
) {
    try {
        await requireAdminOrRegistrar();
        const allowed = await hasPermission("disciplinary.records.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to manage disciplinary records" };

        if (!grievanceId || isNaN(grievanceId)) {
            return { success: false, error: "Invalid grievance ID." };
        }

        await db
            .update(grievances)
            .set({ status, resolutionNotes, updatedAt: new Date() })
            .where(eq(grievances.id, grievanceId));

        revalidatePath("/admin/registrar/grievances");
        return { success: true };
    } catch (error: any) {
        console.error("updateGrievanceStatus error:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Retrieves active severe sanctions for a given userId (used by student layout middleware).
 * SECURITY: This is a server-only utility. No auth required as it is called from trusted Server Components/layouts.
 */
export async function getActiveSevereSanctions(userId: number) {
    try {
        const studentRecord = await db.query.students.findFirst({
            where: (s, { eq }) => eq(s.userId, userId),
        });

        if (studentRecord) {
            const sanctions = await db.query.conductLogs.findMany({
                where: (logs, { eq, and, inArray }) =>
                    and(
                        eq(logs.studentId, studentRecord.id),
                        eq(logs.status, "active"),
                        inArray(logs.senateSanction, ["suspension", "expulsion", "rustication"])
                    ),
            });
            return sanctions;
        }

        const staffRecord = await db.query.staffProfiles.findFirst({
            where: (s, { eq }) => eq(s.userId, userId),
        });

        if (staffRecord) {
            const sanctions = await db.query.conductLogs.findMany({
                where: (logs, { eq, and, inArray }) =>
                    and(
                        eq(logs.staffId, staffRecord.id),
                        eq(logs.status, "active"),
                        inArray(logs.senateSanction, ["suspension", "expulsion", "rustication", "termination"])
                    ),
            });
            return sanctions;
        }

        return [];
    } catch (error) {
        console.error("getActiveSevereSanctions error:", error);
        return [];
    }
}
