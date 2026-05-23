#!/usr/bin/env node

import { parseArgs } from "util";
import { TeacherService } from "../src/services/TeacherService";

async function main() {
    const { values } = parseArgs({
        options: {
            tid: { type: "string" },
            restore: { type: "boolean", short: "r" },
            permanent: { type: "boolean", short: "p" },
        }
    });

    if (!values.tid) {
        console.error("Usage: delete-teacher --tid <teacher_id> [--restore | --permanent]");
        process.exit(1);
    }

    try {
        if (values.restore) {
            console.log(`Restoring staff profile ${values.tid}...`);
            await TeacherService.restoreTeacher(values.tid);
            console.log("Success: Profile restored.");
        } else if (values.permanent) {
            console.log(`PERMANENTLY deleting staff profile ${values.tid}...`);
            await TeacherService.permanentlyDeleteTeacher(values.tid);
            console.log("Success: Profile purged.");
        } else {
            console.log(`Moving staff profile ${values.tid} to the recycle bin...`);
            await TeacherService.deleteTeacher(values.tid);
            console.log("Account successfully deleted (moved to bin)");
        }
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
