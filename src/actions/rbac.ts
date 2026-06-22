"use strict";
"use server";

import { db } from "@/db/db";
import { roles, permissions, rolePermissions, userRoles, users, systemAuditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

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
        const session = await auth();
        const actorRole = (session?.user as any)?.role?.toLowerCase() || "";
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;
        if (!['superadmin', 'admin', 'dvc', 'bursar', 'registrar'].includes(actorRole)) {
            return { success: false, error: "Unauthorized: Only superadmin, vice chancellor, bursar, and registrar can edit." };
        }

        await db.insert(userRoles).values({ userId, roleId });

        if (actorId) {
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'ASSIGN_ROLE_TO_USER',
                targetId: userId.toString(),
                details: JSON.stringify({ roleId, timestamp: new Date() }),
                status: 'success'
            });
        }

        revalidatePath("/admin/rbac");
        return { success: true };
    } catch (error) {
        console.error("Failed to assign role:", error);
        return { success: false, error: "User already has this role" };
    }
}

export async function removeRoleFromUser(userId: number, roleId: number) {
    try {
        const session = await auth();
        const actorRole = (session?.user as any)?.role?.toLowerCase() || "";
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;
        if (!['superadmin', 'admin', 'dvc', 'bursar', 'registrar'].includes(actorRole)) {
            return { success: false, error: "Unauthorized: Only superadmin, vice chancellor, bursar, and registrar can edit." };
        }

        await db.delete(userRoles).where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.roleId, roleId)
            )
        );

        if (actorId) {
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'REMOVE_ROLE_FROM_USER',
                targetId: userId.toString(),
                details: JSON.stringify({ roleId, timestamp: new Date() }),
                status: 'success'
            });
        }

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
        // First-class School Administrative Roles
        { name: "Bursar", description: "Chief Financial Officer of the School/Bursary" },
        { name: "Registrar", description: "Custodian of Admissions and Student Academic Records" },
        { name: "Librarian", description: "Manager of the Library Resources Catalog and Journal Portal" },
        // OJS Specific Granular Roles
        { name: "Journal Manager", description: "Manages journal configurations, privacy statements, and APC fees" },
        { name: "Journal Editor", description: "Full control over submissions, peer reviews, copyediting, and production" },
        { name: "Section Editor", description: "Manages submission, peer review, and copyediting for a specific section" },
        { name: "Production Editor", description: "Manages copyediting and publication stage of journal galleys" },
        { name: "Reviewer", description: "Conducts blind peer-reviews and submits recommendations" },
        { name: "Author", description: "Submits manuscripts and uploads revision files" },
        { name: "Subscription Manager", description: "Manages journal reader subscriptions" },
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
        // Administrative Roles Permissions
        { name: "finance.manage", description: "Manage billing, payment gateways, and tuition fees", category: "Finance" },
        { name: "finance.view", description: "View bursary transactions and payment stats", category: "Finance" },
        { name: "admission.manage", description: "Manage applicant document builders and admissions", category: "Admission" },
        { name: "academic.manage", description: "Manage cohorts, programs, and classroom structures", category: "Academic" },
        { name: "library.manage", description: "Manage library catalog, circulation, and overdue books fines", category: "Library" },
        // OJS-Inspired Granular Permissions
        { name: "journal.manage", description: "Manage journal configurations, privacy statements, and APC fees", category: "Journal" },
        { name: "journal.edit", description: "Edit issues and manage manuscript submission pipelines", category: "Journal" },
        { name: "journal.submit", description: "Submit articles and manuscripts as author", category: "Journal" },
        { name: "journal.review", description: "Review manuscripts and submit peer review recommendations", category: "Journal" },
        { name: "journal.copyedit", description: "Copyedit manuscripts and format galley indexes", category: "Journal" },
        { name: "journal.production", description: "Publish journal issues and galleys to public records", category: "Journal" },
        { name: "journal.subscribe", description: "Manage user journal reading subscriptions", category: "Journal" },
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

        // 3. Helper to assign list of permission names to a specific role
        const assignPermissionsToRole = async (roleName: string, permNames: string[]) => {
            const [roleRecord] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
            if (roleRecord) {
                const matchedPerms = await db.select().from(permissions);
                for (const perm of matchedPerms) {
                    if (permNames.includes(perm.name)) {
                        const existing = await db.select().from(rolePermissions).where(
                            and(eq(rolePermissions.roleId, roleRecord.id), eq(rolePermissions.permissionId, perm.id))
                        ).limit(1);
                        if (existing.length === 0) {
                            await db.insert(rolePermissions).values({ roleId: roleRecord.id, permissionId: perm.id });
                        }
                    }
                }
            }
        };

        // 4. Bind Health Admin Permissions
        await assignPermissionsToRole("Health Administrator", ["health.view", "health.verify", "health.record_vitals", "health.manage_status"]);

        // 5. Bind DVC Permissions
        await assignPermissionsToRole("Deputy Vice Chancellor", ["system.dashboard.view", "finance.summary.view", "academic.stats.view"]);

        // 6. Bind first-class School Admin Roles Permissions
        await assignPermissionsToRole("Bursar", ["finance.manage", "finance.view", "finance.summary.view"]);
        await assignPermissionsToRole("Registrar", ["admission.manage", "academic.manage", "academic.stats.view"]);
        await assignPermissionsToRole("Librarian", ["library.manage", "journal.manage", "journal.edit", "journal.submit"]);

        // 7. Bind OJS granular permissions
        await assignPermissionsToRole("Journal Manager", ["journal.manage", "journal.subscribe"]);
        await assignPermissionsToRole("Journal Editor", ["journal.manage", "journal.edit", "journal.submit", "journal.review", "journal.copyedit", "journal.production"]);
        await assignPermissionsToRole("Section Editor", ["journal.edit", "journal.submit", "journal.review", "journal.copyedit"]);
        await assignPermissionsToRole("Production Editor", ["journal.copyedit", "journal.production"]);
        await assignPermissionsToRole("Reviewer", ["journal.review"]);
        await assignPermissionsToRole("Author", ["journal.submit"]);
        await assignPermissionsToRole("Subscription Manager", ["journal.subscribe"]);

        revalidatePath("/admin/rbac");
        return { success: true };
    } catch (error) {
        console.error("Failed to initialize roles and permissions:", error);
        return { success: false, error: "Initialization failed" };
    }
}
