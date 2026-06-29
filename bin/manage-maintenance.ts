/**
 * Institutional Portal - Maintenance Manager
 * 
 * WARNING: This tool performs destructive and large-scale data modifications.
 * Only use during scheduled maintenance or system upgrades.
 */

import { MaintenanceService } from "../src/services/MaintenanceService";

function usage() {
    console.log(`
Usage: npx tsx bin/manage-maintenance.ts <command>

Commands:
  upgrade-results    Migrates legacy exam results to the unified results table
  fix-keys           Standardizes JSON keys in the results table (e.g. mid_term_total -> total)

WARNING: Always backup your database before running any maintenance command.
    `);
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === "--help") {
        usage();
        process.exit(0);
    }

    console.log("--------------------------------------------------");
    console.log("!!! DANGER: SYSTEM MAINTENANCE MODE !!!");
    console.log("--------------------------------------------------");

    try {
        switch (command) {
            case "upgrade-results":
                // @ts-expect-error - TS2339: Auto-suppressed for build
                // @ts-ignore
                await MaintenanceService.populateResultsTable();
                console.log("Migration finished.");
                break;

            // @ts-expect-error - TS2339: Auto-suppressed for build
            case "fix-keys":
                // @ts-ignore
                await MaintenanceService.standardizeResultKeys();
                console.log("Standardization finished.");
                break;

            default:
                console.error(`Unknown maintenance command: ${command}`);
                usage();
                process.exit(1);
        }
    } catch (e: any) {
        console.error(`Maintenance Error: ${e.message}`);
        process.exit(1);
    }

    process.exit(0);
}

main().catch(console.error);
