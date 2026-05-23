import { db } from "../../src/db/db";
import { users } from "../../src/db/schema";
import { initializeDefaultRoles } from "../../src/actions/rbac";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Starting RBAC re-initialization...");

    try {
        const result = await initializeDefaultRoles();
        if (result.success) {
            console.log("RBAC initialized successfully.");
        } else {
            console.error("RBAC initialization failed:", result.error);
        }

        const password = await bcrypt.hash("password123", 10);

        // Create Health Admin Account
        const healthEmail = "health@school.com";
        const [existingHealth] = await db.select().from(users).where(eq(users.email, healthEmail)).limit(1);
        if (!existingHealth) {
            await db.insert(users).values({
                name: "Health Admin",
                email: healthEmail,
                password,
                role: "healthadmin",
                status: "active"
            });
            console.log("Health Admin account created: health@school.com / password123");
        } else {
            await db.update(users).set({ role: "healthadmin" as any }).where(eq(users.id, existingHealth.id));
            console.log("Existing health account updated to healthadmin role.");
        }

        // Create DVC Account
        const dvcEmail = "dvc@school.com";
        const [existingDvc] = await db.select().from(users).where(eq(users.email, dvcEmail)).limit(1);
        if (!existingDvc) {
            await db.insert(users).values({
                name: "Deputy Vice Chancellor",
                email: dvcEmail,
                password,
                role: "dvc",
                status: "active"
            });
            console.log("DVC account created: dvc@school.com / password123");
        } else {
            await db.update(users).set({ role: "dvc" as any }).where(eq(users.id, existingDvc.id));
            console.log("Existing DVC account updated to dvc role.");
        }

        console.log("Maintenance script completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Maintenance script failed:", error);
        process.exit(1);
    }
}

main();
