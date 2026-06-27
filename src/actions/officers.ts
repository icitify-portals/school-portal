"use server";

import { db } from "@/db/db";
import { staffProfiles, userRoles, roles, users as usersTable, institutionalUnits } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateOfficerSignature(userId: number, signatureUrl: string, isDigital: boolean) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    // Check if user is updating their own signature OR is an admin
    const isAdmin = (session.user as any)?.role === "superadmin" || (session.user as any)?.role === "admin";
    if (!isAdmin && parseInt(session.user?.id || "0") !== userId) {
        return { success: false, error: "Permission denied" };
    }

    try {
        await db.update(staffProfiles)
            .set({ 
                signatureUrl, 
                isSignatureDigital: isDigital 
            })
            .where(eq(staffProfiles.userId, userId));

        revalidatePath("/admin/settings/officers");
        revalidatePath("/profile");
        
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function assignOfficerRole(userId: number, roleId: number, unitId?: number) {
    const session = await auth();
    if ((session?.user as any)?.role !== "superadmin" && (session?.user as any)?.role !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Check if assignment already exists
        const [existing] = await db.select()
            .from(userRoles)
            .where(and(
                eq(userRoles.userId, userId),
                eq(userRoles.roleId, roleId),
                unitId ? eq(userRoles.unitId, unitId) : sql`${userRoles.unitId} IS NULL`
            ))
            .limit(1);

        if (existing) {
            return { success: false, error: "Assignment already exists" };
        }

        await db.insert(userRoles).values({
            userId,
            roleId,
            unitId: unitId || null
        });

        revalidatePath("/admin/settings/officers");
        revalidatePath("/admin/settings/cms-managers");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeOfficerRole(assignmentId: number) {
    const session = await auth();
    if ((session?.user as any)?.role !== "superadmin" && (session?.user as any)?.role !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await db.delete(userRoles).where(eq(userRoles.id, assignmentId));
        revalidatePath("/admin/settings/officers");
        revalidatePath("/admin/settings/cms-managers");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getPrincipalOfficers() {
    try {
        const results = await db.select({
            assignmentId: userRoles.id,
            user: usersTable,
            role: roles,
            unit: institutionalUnits,
            profile: staffProfiles
        })
        .from(userRoles)
        .innerJoin(usersTable, eq(userRoles.userId, usersTable.id))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .leftJoin(institutionalUnits, eq(userRoles.unitId, institutionalUnits.id))
        .leftJoin(staffProfiles, eq(usersTable.id, staffProfiles.userId))
        .where(sql`${roles.name} IN ('Bursar', 'Principal', 'Headteacher', 'Registrar', 'VP Academics', 'Stakeholder')`);

        return { success: true, officers: results };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getStaffUsers() {
    try {
        const staff = await db.select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: usersTable.role
        })
        .from(usersTable)
        .where(sql`${usersTable.role} IN ('staff', 'admin', 'superadmin')`);

        return staff;
    } catch (error) {
        console.error("Error fetching staff users:", error);
        return [];
    }
}

export async function getAvailableRoles() {
    try {
        return await db.select().from(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        return [];
    }
}

export async function getInstitutionalUnits() {
    try {
        return await db.select().from(institutionalUnits);
    } catch (error) {
        console.error("Error fetching units:", error);
        return [];
    }
}

export async function getCmsManagers() {
    try {
        const results = await db.select({
            assignmentId: userRoles.id,
            user: usersTable,
            role: roles,
            profile: staffProfiles
        })
        .from(userRoles)
        .innerJoin(usersTable, eq(userRoles.userId, usersTable.id))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .leftJoin(staffProfiles, eq(usersTable.id, staffProfiles.userId))
        .where(eq(roles.name, 'CMS Manager'));

        return { success: true, managers: results };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
