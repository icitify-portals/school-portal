#!/usr/bin/env node

import { parseArgs } from "util";
import { StudentService } from "../src/services/StudentService";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
    const { values } = parseArgs({
        options: {
            session: { type: "string", short: "s" },
            branch: { type: "string", short: "b" },
            output: { type: "string", short: "o" },
        }
    });

    if (!values.session || !values.branch) {
        console.error("Usage: export-students --session <id> --branch <id> [--output <path>]");
        process.exit(1);
    }

    try {
        const sessionId = parseInt(values.session);
        const branchId = parseInt(values.branch);
        
        console.log(`Generating Excel export for Session ${sessionId} (Branch ${branchId})...`);
        const buffer = await StudentService.exportStudentsToExcel(branchId, sessionId);
        
        const outputPath = values.output || join(process.cwd(), `students_export_${sessionId}.xlsx`);
        writeFileSync(outputPath, buffer);
        
        console.log(`Success: Export saved to ${outputPath}`);
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
