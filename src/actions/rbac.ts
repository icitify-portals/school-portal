"use strict";
"use server";

import { db } from "@/db/db";
import { roles, permissions, rolePermissions, userRoles, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- Role Management ---
export async function getAllRoles() {
    try {
        const allRoles = await db.select().from(roles);
        const rolePerms = await db
            .select({
                roleId: rolePermissions.roleId,
                permissionId: rolePermissions.permissionId,
                permission: permissions,
            })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

        return allRoles.map(role => ({
            ...role,
            permissions: rolePerms.filter(rp => rp.roleId === role.id)
        }));
    } catch (error) {
        console.error("Failed to fetch roles:", error);
        return [];
    }
}

export async function createRole(name: string, description: string) {
    try {
        const [result] = await db.insert(roles).values({ name, description });
        revalidatePath("/admin/rbac");
        return { success: true, id: result.insertId };
    } catch (error) {
        console.error("Failed to create role:", error);
        return { success: false, error: "Role name must be unique" };
    }
}

export async function updateRole(id: number, data: Partial<{ name: string, description: string }>) {
    try {
        await db.update(roles).set(data).where(eq(roles.id, id));
        revalidatePath("/admin/rbac");
        return { success: true };
    } catch (error) {
        console.error("Failed to update role:", error);
        return { success: false, error: "Role update failed" };
    }
}

// --- Permission Management ---
export async function getAllPermissions() {
    return await db.select().from(permissions);
}

export async function createPermission(data: { name: string, description?: string, category: string }) {
    try {
        await db.insert(permissions).values(data);
        revalidatePath("/admin/rbac");
        return { success: true };
    } catch (error) {
        console.error("Failed to create permission:", error);
        return { success: false, error: "Permission already exists" };
    }
}

export async function addPermissionToRole(roleId: number, permissionId: number) {
    try {
        await db.insert(rolePermissions).values({ roleId, permissionId });
        revalidatePath("/admin/rbac");
        return { success: true };
    } catch (error) {
        console.error("Failed to add permission to role:", error);
        return { success: false, error: "Permission already assigned to this role" };
    }
}

export async function removePermissionFromRole(roleId: number, permissionId: number) {
    try {
        await db.delete(rolePermissions).where(
            and(
                eq(rolePermissions.roleId, roleId),
                eq(rolePermissions.permissionId, permissionId)
            )
        );
        revalidatePath("/admin/rbac");
        return { success: true };
    } catch (error) {
        console.error("Failed to remove permission:", error);
        return { success: false, error: "Failed to remove permission" };
    }
}

// --- User Role Assignment ---
export async function getUsers() {
    try {
        return await db.select().from(users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
    }
}

export async function getUsersWithRoles() {
    try {
        const allUsers = await db.select().from(users);
        const uRoles = await db
            .select({
                userId: userRoles.userId,
                roleId: userRoles.roleId,
                role: roles,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id));

        return allUsers.map(user => ({
            ...user,
            roles: uRoles.filter(ur => ur.userId === user.id)
        }));
    } catch (error) {
        console.error("Failed to fetch users with roles:", error);
        return [];
    }
}

export async function assignRoleToUser(userId: number, roleId: number) {
    try {
        await db.insert(userRoles).values({ userId, roleId });
        revalidatePath("/admin/rbac");
        return { success: true };
    } catch (error) {
        console.error("Failed to assign role:", error);
        return { success: false, error: "User already has this role" };
    }
}

export async function removeRoleFromUser(userId: number, roleId: number) {
    try {
        await db.delete(userRoles).where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.roleId, roleId)
            )
        );
        revalidatePath("/admin/rbac");
        return { success: true };
    } catch (error) {
        console.error("Failed to remove role:", error);
        return { success: false, error: "Failed to remove role" };
    }
}

export async function initializeDefaultRoles() {
    const defaultRoles = [
        { name: "Administrator", description: "Full system access" },
        { name: "Manager", description: "Administrative access to specific modules" },
        { name: "Teacher", description: "Course and content management" },
        { name: "Non-editing teacher", description: "Grading and student monitoring only" },
        { name: "Student", description: "Course participation and learning" },
        { name: "Health Administrator", description: "Management of student medical records and clearances" },
        { name: "Deputy Vice Chancellor", description: "High-level institutional monitoring and oversight" },
    ];

    const defaultPermissions = [
        // Health Permissions
        { name: "health.view", description: "View student health records", category: "Health" },
        { name: "health.verify", description: "Verify uploaded health reports", category: "Health" },
        { name: "health.record_vitals", description: "Record student vital signs", category: "Health" },
        { name: "health.manage_status", description: "Update student health clearance status", category: "Health" },
        // DVC / Monitoring Permissions
        { name: "system.dashboard.view", description: "View institutional dashboard", category: "System" },
        { name: "finance.summary.view", description: "View financial summaries", category: "Finance" },
        { name: "academic.stats.view", description: "View academic statistics", category: "Academic" },
    ];

    try {
        // 1. Seed Roles
        for (const role of defaultRoles) {
            const existing = await db.select().from(roles).where(eq(roles.name, role.name)).limit(1);
            if (existing.length === 0) {
                await db.insert(roles).values(role);
            }
        }

        // 2. Seed Permissions
        for (const perm of defaultPermissions) {
            const existing = await db.select().from(permissions).where(eq(permissions.name, perm.name)).limit(1);
            if (existing.length === 0) {
                await db.insert(permissions).values(perm);
            }
        }

        // 3. Assign Health Admin Permissions
        const [healthRole] = await db.select().from(roles).where(eq(roles.name, "Health Administrator")).limit(1);
        if (healthRole) {
            const healthPerms = await db.select().from(permissions).where(eq(permissions.category, "Health"));
            for (const perm of healthPerms) {
                const existing = await db.select().from(rolePermissions).where(
                    and(eq(rolePermissions.roleId, healthRole.id), eq(rolePermissions.permissionId, perm.id))
                ).limit(1);
                if (existing.length === 0) {
                    await db.insert(rolePermissions).values({ roleId: healthRole.id, permissionId: perm.id });
                }
            }
        }

        // 4. Assign DVC Permissions
        const [dvcRole] = await db.select().from(roles).where(eq(roles.name, "Deputy Vice Chancellor")).limit(1);
        if (dvcRole) {
            const dvcPermNames = ["system.dashboard.view", "finance.summary.view", "academic.stats.view"];
            const dvcPerms = await db.select().from(permissions);
            for (const perm of dvcPerms) {
                if (dvcPermNames.includes(perm.name)) {
                    const existing = await db.select().from(rolePermissions).where(
                        and(eq(rolePermissions.roleId, dvcRole.id), eq(rolePermissions.permissionId, perm.id))
                    ).limit(1);
                    if (existing.length === 0) {
                        await db.insert(rolePermissions).values({ roleId: dvcRole.id, permissionId: perm.id });
                    }
                }
            }
        }

        revalidatePath("/admin/rbac");
        return { success: true };
    } catch (error) {
        console.error("Failed to initialize roles and permissions:", error);
        return { success: false, error: "Initialization failed" };
    }
}
