#!/usr/bin/env node

import { ClassService } from "../src/services/ClassService";

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log(`
Usage: manage-academics <command> [options]

Commands:
  class-subjects <session_id> <branch_id>   List subjects taught in each class
        `);
        process.exit(0);
    }

    switch (command) {
        case "class-subjects":
            const sessionId = parseInt(args[1]);
            const branchId = parseInt(args[2]);
            if (!sessionId || !branchId) {
                console.log("Usage: manage-academics class-subjects <session_id> <branch_id>");
                process.exit(1);
            }
            console.log(`Generating academic structure report for Branch ${branchId} [Session ${sessionId}]...`);
            const report = await ClassService.getBranchSubjectsReport(branchId, sessionId);
            console.log(JSON.stringify(report, null, 2));
            break;
        default:
            console.log(`Unknown command: ${command}`);
    }
}

main().catch(console.error);
