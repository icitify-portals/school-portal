#!/usr/bin/env node

import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";

async function runMigrationForDb(dbName: string): Promise<boolean> {
    console.log(`\n--------------------------------------------------`);
    console.log(`>>> RUNNING MIGRATION FOR DATABASE: [ ${dbName} ]`);
    console.log(`--------------------------------------------------`);

    const parsedUrl = new URL(baseUri);
    parsedUrl.pathname = `/${dbName}`;

    let connection;
    try {
        connection = await mysql.createConnection({
            uri: parsedUrl.toString(),
            multipleStatements: true, // Required for running multi-line Drizzle migration scripts
        });

        const client = drizzle(connection);

        await migrate(client, {
            migrationsFolder: path.join(process.cwd(), "./drizzle"),
        });

        console.log(`✔ [SUCCESS] Database [ ${dbName} ] is fully up to date.`);
        return true;
    } catch (error: any) {
        console.error(`❌ [FAILURE] Failed to migrate database [ ${dbName} ]:`, error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function main() {
    console.log("==================================================");
    console.log("MULTI-TENANT DATABASE MIGRATION ENGINE");
    console.log("==================================================");

    // Step 1: Migrate Master database first to guarantee tenant_nodes exists
    const masterDbName = "school_portal";
    const masterSuccess = await runMigrationForDb(masterDbName);
    if (!masterSuccess) {
        console.error("❌ Master database migration failed. Aborting tenant migrations.");
        process.exit(1);
    }

    // Step 2: Fetch tenant list from master database
    const activeTenants: string[] = [];
    let masterConnection;
    try {
        masterConnection = await mysql.createConnection({
            uri: baseUri,
        });

        const [rows]: any = await masterConnection.execute(
            "SELECT db_name FROM tenant_nodes WHERE is_active = 1"
        );

        if (rows && rows.length > 0) {
            rows.forEach((row: any) => {
                activeTenants.push(row.db_name);
            });
        }
    } catch (e: any) {
        console.warn("ℹ Note: tenant_nodes table query skipped or empty. Using default development partitions.");
    } finally {
        if (masterConnection) {
            await masterConnection.end();
        }
    }

    // Include development tenants if none are discovered dynamically
    const devTenants = ["portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];
    devTenants.forEach(tenant => {
        if (!activeTenants.includes(tenant)) {
            activeTenants.push(tenant);
        }
    });

    console.log(`\nDiscovered ${activeTenants.length} target database partitions to migrate...`);

    // Step 3: Run migrations for all discovered partitions sequentially
    let successCount = 0;
    for (const tenantDb of activeTenants) {
        const success = await runMigrationForDb(tenantDb);
        if (success) successCount++;
    }

    console.log("\n==================================================");
    console.log("MIGRATION COMPLETED");
    console.log(`Successfully migrated ${successCount + 1}/${activeTenants.length + 1} databases (including master).`);
    console.log("==================================================");

    process.exit(0);
}

main().catch((err) => {
    console.error("Critical Migration Engine Error:", err);
    process.exit(1);
});
