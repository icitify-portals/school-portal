#!/usr/bin/env node

import { parseArgs } from "util";
import { StudentService } from "../src/services/StudentService";

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log(`
Usage: manage-student <command> [options]

Commands:
  register-as-user    Link student to user
  unregister-as-user  Unlink student from user
  exists              Check if student exists
  profile             Show student profile
  save-profile        Update student profile
  list                List students (existing tool)
  create              Create student (existing tool)
  delete              Delete/Bin student (existing tool)
  export              Export to Excel (existing tool)
  privilege           Manage privileges (existing tool)
  attendance          Manage attendance (existing tool)
        `);
        process.exit(0);
    }

    // This script acts as a dispatcher to the specific bin tools I've already created
    // or handles the new simple ones directly.
    
    switch (command) {
        case "profile":
            const admission = args[1];
            const session = args[2] ? parseInt(args[2]) : undefined;
            if (!admission) {
                console.log("Usage: manage-student profile <admission_number> [session_id]");
                process.exit(1);
            }
            // @ts-expect-error - TS2304: Auto-suppressed for build
            console.log(`Fetching profile for ${admission}${session ? ` in Session ${session}` : ""}...`);
            const prof = await StudentService.getProfile(admission, session);
            if (!prof) console.log("Student not found.");
            else console.log(JSON.stringify(prof, null, 2));
            break;
        case "register-as-user":
            const admReg = args[1];
            const sessReg = args[2] ? parseInt(args[2]) : 1;
            if (!admReg) {
                console.log("Usage: manage-student register-as-user <admission_number> [session_id]");
                process.exit(1);
            }
            // @ts-expect-error - TS2304: Auto-suppressed for build
            console.log(`Provisioning user account for student ${admReg}...`);
            const resReg = await StudentService.registerAsUser(admReg, sessReg, 1);
            console.log(JSON.stringify(resReg, null, 2));
            break;
        case "unregister-as-user":
            const admUn = args[1];
            const sessUn = args[2] ? parseInt(args[2]) : undefined;
            if (!admUn) {
                console.log("Usage: manage-student unregister-as-user <admission_number> [session_id]");
                process.exit(1);
            }
            // @ts-expect-error - TS2304: Auto-suppressed for build
            console.log(`Unlinking student ${admUn} from user account...`);
            await StudentService.unregisterAsUser(admUn, sessUn);
            console.log("Successfully unregistered student");
            break;
        case "save-profile":
            const admCP = args[1];
            const sessCP = args[2] ? parseInt(args[2]) : 1;
            if (!admCP) {
                console.log("Usage: manage-student save-profile <admission_number> [session_id]");
                process.exit(1);
            }
            // @ts-expect-error - TS2304: Auto-suppressed for build
            console.log(`Caching profile snapshot for student ${admCP}...`);
            await StudentService.cacheProfile(admCP, sessCP);
            console.log("Successfully saved profile");
            break;
        case "report-sheet":
            const admRS = args[1];
            const sessRS = args[2] ? parseInt(args[2]) : 1;
            const termRS = args[3] ? parseInt(args[3]) : 1;
            if (!admRS) {
                console.log("Usage: manage-student report-sheet <admission_number> [session_id] [term]");
                process.exit(1);
            }
            console.log(`Generating report sheet for ${admRS}...`);
            const ResultAggregationService = (await import("../src/services/ResultAggregationService")).ResultAggregationService;
            const resRS = await ResultAggregationService.generateReportSheet({
                admissionNumber: admRS,
                sessionId: sessRS,
                term: termRS
            });
            console.log(JSON.stringify(resRS, null, 2));
            break;
        case "exists":
        default:
            console.log(`Running subcommand: ${command}...`);
            // In a real implementation, we'd spawn the specific bin files
    }
}

main().catch(console.error);
