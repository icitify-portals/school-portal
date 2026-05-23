#!/usr/bin/env node

import { parseArgs } from "util";
import { StudentService } from "../src/services/StudentService";

async function main() {
    const { values } = parseArgs({
        options: {
            old: { type: "string", short: "o" },
            new: { type: "string", short: "n" },
        }
    });

    if (!values.old || !values.new) {
        console.error("Usage: change-admission --old <old_number> --new <new_number>");
        process.exit(1);
    }

    try {
        console.log(`Attempting to change admission number from ${values.old} to ${values.new}...`);
        await StudentService.changeAdmissionNumber(values.old, values.new);
        console.log(`Success: Admission number updated for student.`);
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
