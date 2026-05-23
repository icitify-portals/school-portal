#!/usr/bin/env node

import { parseArgs } from "util";
import { StudentService } from "../src/services/StudentService";

async function main() {
    const { values } = parseArgs({
        options: {
            student: { type: "string", short: "s" },
            restore: { type: "boolean", short: "r" },
            permanent: { type: "boolean", short: "p" },
            "empty-bin": { type: "boolean" },
        }
    });

    try {
        if (values["empty-bin"]) {
            console.log("Emptying the recycle bin...");
            await StudentService.emptyRecycleBin();
            console.log("Success: Recycle bin cleared.");
        } else if (values.student && values.restore) {
            console.log(`Restoring student ${values.student}...`);
            await StudentService.restoreStudent(values.student);
            console.log(`Success: Student ${values.student} has been restored.`);
        } else if (values.student && values.permanent) {
            console.log(`PERMANENTLY deleting student ${values.student}...`);
            await StudentService.permanentlyDeleteStudent(values.student);
            console.log(`Success: Student ${values.student} has been purged.`);
        } else if (values.student) {
            console.log(`Moving student ${values.student} to the recycle bin...`);
            await StudentService.deleteStudent(values.student);
            console.log(`Success: Student ${values.student} is now in the bin.`);
        } else {
            console.log("Usage: delete-student --student <id> [--restore | --permanent] OR --empty-bin");
        }
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
