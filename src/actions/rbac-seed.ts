"use server";

import { db } from "@/db/db";
import { roles, permissions, rolePermissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export async function seedPrincipalRoles() {
    const session = await auth();
    if ((session?.user as any)?.role !== "superadmin" && (session?.user as any)?.role !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Define Permissions
        const officerPermissions = [
            { name: "finance.view_summary", category: "Bursary", description: "View financial summary reports" },
            { name: "finance.view_detailed", category: "Bursary", description: "View individual student payment records" },
            { name: "finance.sign_receipt", category: "Bursary", description: "Authorize and sign receipts" },
            { name: "academic.sign_report", category: "Academic", description: "Sign student report cards/result slips" },
            { name: "academic.sign_transcript", category: "Academic", description: "Sign official transcripts" },
            { name: "officers.manage", category: "System", description: "Assign and manage Principal Officers" },
        ];

        for (const perm of officerPermissions) {
            const [existing] = await db.select().from(permissions).where(eq(permissions.name, perm.name)).limit(1);
            if (!existing) {
                await db.insert(permissions).values(perm);
            }
        }

        // 2. Define Roles
        const officerRoles = [
            { name: "Bursar", description: "Chief Financial Officer of the School/Branch", permissions: ["finance.view_summary", "finance.view_detailed", "finance.sign_receipt"] },
            { name: "Principal", description: "Head of School Operations and Academic Oversight", permissions: ["academic.sign_report", "finance.view_summary", "officers.manage"] },
            { name: "Headteacher", description: "Primary School Head of Operations", permissions: ["academic.sign_report", "finance.view_summary"] },
            { name: "Registrar", description: "Custodian of Academic Records", permissions: ["academic.sign_transcript", "officers.manage"] },
            { name: "VP Academics", description: "Vice Principal (Academic Affairs)", permissions: ["academic.sign_report", "academic.sign_transcript"] },
            { name: "Stakeholder", description: "External auditor or observer with limited view access", permissions: ["finance.view_summary"] },
        ];

        for (const roleDef of officerRoles) {
            let roleId: number;
            const [existingRole] = await db.select().from(roles).where(eq(roles.name, roleDef.name)).limit(1);
            
            if (!existingRole) {
                const [newRole] = await db.insert(roles).values({
                    name: roleDef.name,
                    description: roleDef.description
                });
                roleId = newRole.insertId;
            } else {
                roleId = existingRole.id;
            }

            // Bind Permissions to Role
            for (const permName of roleDef.permissions) {
                const [perm] = await db.select().from(permissions).where(eq(permissions.name, permName)).limit(1);
                if (perm) {
                    const [existingRP] = await db.select().from(rolePermissions).where(and(
                        eq(rolePermissions.roleId, roleId),
                        eq(rolePermissions.permissionId, perm.id)
                    )).limit(1);
                    
                    if (!existingRP) {
                        await db.insert(rolePermissions).values({
                            roleId,
                            permissionId: perm.id
                        });
                    }
                }
            }
        }

        return { success: true, message: "Principal roles and permissions seeded successfully" };
    } catch (error: any) {
        console.error("Seeding error:", error);
        return { success: false, error: error.message };
    }
}

