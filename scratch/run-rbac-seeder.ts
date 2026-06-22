import { initializeDefaultRoles } from "../src/actions/rbac";

async function run() {
    try {
        console.log("----------------------------------------");
        console.log("Seeding Extended OJS-Grade RBAC Roles and Permissions...");
        const result = await initializeDefaultRoles();
        console.log("RBAC Seeding Result:", JSON.stringify(result));
        console.log("----------------------------------------");
    } catch (e: any) {
        console.error("RBAC Seeding failed:", e);
    }
}

run();
