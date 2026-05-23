import { db } from "../../src/db/db";
import { roles, permissions, rolePermissions, users } from "../../src/db/schema";
import { eq, inArray } from "drizzle-orm";

async function verify() {
    console.log("--- RBAC Verification ---");

    // Check Roles
    const allRoles = await db.select().from(roles);
    console.log("Roles in DB:", allRoles.map(r => r.name).join(", "));

    // Check Permissions
    const allPerms = await db.select().from(permissions);
    console.log("Permissions count:", allPerms.length);

    // Check healthadmin role and permissions
    const [healthRole] = await db.select().from(roles).where(eq(roles.name, "Health Administrator")).limit(1);
    if (healthRole) {
        const hPerms = await db.select({ name: permissions.name })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, healthRole.id));
        console.log("Health Admin Permissions:", hPerms.map(p => p.name).join(", "));
    }

    // Check dvc role and permissions
    const [dvcRole] = await db.select().from(roles).where(eq(roles.name, "Deputy Vice Chancellor")).limit(1);
    if (dvcRole) {
        const dPerms = await db.select({ name: permissions.name })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, dvcRole.id));
        console.log("DVC Permissions:", dPerms.map(p => p.name).join(", "));
    }

    // Check Test Accounts
    const testUsers = await db.select({ email: users.email, role: users.role })
        .from(users)
        .where(inArray(users.email, ["health@school.com", "dvc@school.com"]));
    console.log("Test Accounts:", JSON.stringify(testUsers, null, 2));

    process.exit(0);
}

verify();
