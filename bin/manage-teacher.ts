#!/usr/bin/env node

import { parseArgs } from "util";
import { TeacherService } from "../src/services/TeacherService";

function usage() {
    console.log(`
Usage: manage-teacher <command> [options]

Commands:
  create              Onboard teacher/lecturer (existing tool)
  delete              Soft-delete teacher (existing tool)
  exists              Check if staff exists
  list                List all staff
        `);
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        usage();
        process.exit(0);
    }

    switch (command) {
        case "list":
            const branch = args[1];
            const category = args[2];
            if (!branch) {
                console.log("Usage: manage-teacher list <branch_id> [category]");
                process.exit(1);
            }
            console.log(`Fetching staff list for Branch ${branch}${category ? ` [${category}]` : ""}...`);
            const staffList = await TeacherService.listStaff(parseInt(branch), category);
            console.log(`--- Staff List (${staffList.length} found) ---`);
            staffList.forEach(s => {
                console.log(`- [${s.staffId || 'N/A'}] ${s.name} (${s.title}) - ${s.category}`);
            });
            break;
        case "profiles":
            const branchProf = args[1];
            const sessionProf = args[2] ? parseInt(args[2]) : undefined;
            if (!branchProf) {
                console.log("Usage: manage-teacher profiles <branch_id> [session_id]");
                process.exit(1);
            }
            console.log(`Fetching batch staff profiles for Branch ${branchProf}...`);
            const profiles = await TeacherService.getStaffProfiles(parseInt(branchProf), sessionProf);
            console.log(JSON.stringify(profiles, null, 2));
            break;
        case "cleanup":
            const branchClean = args[1];
            const doDelete = args[2] === "--delete";
            if (!branchClean) {
                console.log("Usage: manage-teacher cleanup <branch_id> [--delete]");
                process.exit(1);
            }
            if (doDelete) {
                console.log(`Purging invalid staff records for Branch ${branchClean}...`);
                await TeacherService.deleteInvalidStaff(parseInt(branchClean));
                console.log("Successfully deleted invalid teachers");
            } else {
                console.log(`Auditing invalid staff records for Branch ${branchClean}...`);
                const invalid = await TeacherService.getInvalidStaff(parseInt(branchClean));
                console.log(`--- Invalid Staff (${invalid.length} found) ---`);
                invalid.forEach(s => console.log(`- [${s.staffId}] ${s.jobTitle}`));
            }
            break;
        case "search":
            const queryS = args[1];
            const branchS = parseInt(args[2]) || 1;
            if (!queryS) {
                console.log("Usage: manage-teacher search <query> [branch_id]");
                process.exit(1);
            }
            console.log(`Searching for staff matching "${queryS}"...`);
            const resultsS = await TeacherService.searchStaff(queryS, branchS);
            console.log(`--- Search Results (${resultsS.length} found) ---`);
            resultsS.forEach(s => {
                console.log(`- [${s.staffId}] ${s.name} (${s.title}) - ${s.category}`);
            });
            break;
        case "whois":
            const contextW = args[1] as 'class' | 'subject' | 'course';
            const classW = args[2];
            const divW = args[3];
            const sidW = parseInt(args[4]) || 1;
            const subW = args[5] ? parseInt(args[5]) : undefined;
            if (!contextW || !classW) {
                console.log("Usage: manage-teacher whois <class|subject|course> <class/dept> <division/level> [session_id] [subject/course_id]");
                process.exit(1);
            }
            console.log(`Discovering ${contextW} lead for ${classW} ${divW || ''}...`);
            const whoisRes = await TeacherService.whois({
                context: contextW === 'course' ? 'subject' : contextW,
                className: classW,
                division: divW,
                sessionId: sidW,
                branchId: 1,
                subjectId: subW
            });
            if (whoisRes) {
                console.log(`Title: ${whoisRes.title}`);
                console.log(`Name: ${whoisRes.name}`);
                console.log(`TID: ${whoisRes.staffId}`);
            } else {
                console.log("No staff member found for this role.");
            }
            break;
        case "save-profile":
            const tidCP = args[1];
            const sidCP = args[2] ? parseInt(args[2]) : 1;
            if (!tidCP) {
                console.log("Usage: manage-teacher save-profile <staff_id> [session_id]");
                process.exit(1);
            }
            console.log(`Caching profile snapshot for staff ${tidCP}...`);
            await TeacherService.cacheProfile(tidCP, sidCP);
            console.log("Successfully saved profile");
            break;
        case "profile":
            const tidP = args[1];
            const sidP = args[2] ? parseInt(args[2]) : undefined;
            if (!tidP) {
                console.log("Usage: manage-teacher profile <staff_id> [session_id]");
                process.exit(1);
            }
            const prof = await TeacherService.getStaffProfile(tidP, sidP);
            console.log(JSON.stringify(prof, null, 2));
            break;
        case "register-as-user":
            const tidR = args[1];
            const sidR = parseInt(args[2]) || 1;
            const unameR = args[3];
            if (!tidR) {
                console.log("Usage: manage-teacher register-as-user <staff_id> [session_id] [username]");
                process.exit(1);
            }
            console.log(`Provisioning user account for staff ${tidR}...`);
            const resReg = await TeacherService.registerAsUser(tidR, sidR, 1, unameR);
            console.log(JSON.stringify(resReg, null, 2));
            break;
        case "unregister-as-user":
            const tidU = args[1];
            if (!tidU) {
                console.log("Usage: manage-teacher unregister-as-user <staff_id>");
                process.exit(1);
            }
            console.log(`Unlinking staff ${tidU} from user account...`);
            await TeacherService.unregisterAsUser(tidU);
            console.log("Successfully unregistered as user");
            break;
        case "update-subjects":
            const tidS = args[1];
            const dataS = JSON.parse(args[2] || "[]");
            const sidS = parseInt(args[3]) || 1;
            if (!tidS) {
                console.log("Usage: manage-teacher update-subjects <staff_id> '<json_data>' [session_id]");
                process.exit(1);
            }
            console.log(`Updating teaching subjects for staff ${tidS}...`);
            await TeacherService.updateTeachingSubjects(tidS, sidS, dataS);
            console.log("Successfully updated subject teaching records");
            break;
        case "update-class":
            const tidC = args[1];
            const classC = args[2];
            const divC = args[3];
            const sidC = parseInt(args[4]) || 1;
            if (!tidC) {
                console.log("Usage: manage-teacher update-class <staff_id> [class_name] [division] [session_id]");
                process.exit(1);
            }
            console.log(`Updating teaching class for staff ${tidC}...`);
            await TeacherService.updateTeachingClass(tidC, sidC, classC, divC);
            if (classC) console.log(`Successfully updated ${classC} ${divC || ''} class teacher`);
            else console.log("Deleted class teacher record");
            break;
        case "exists": {
            const sidE = args[1];
            if (!sidE) {
                console.log("Usage: manage-teacher exists <staff_id>");
                process.exit(1);
            }
            const exists = await TeacherService.exists(sidE);
            console.log(`Staff ID ${sidE} exists: ${exists}`);
            // @ts-expect-error - TS2304: Auto-suppressed for build
            break;
        }
        default:
            console.error(`Unknown command: ${command}`);
            usage();
            process.exit(1);
    }
}

main().catch(console.error);
