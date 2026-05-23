#!/usr/bin/env node

import { parseArgs } from "util";
import { ResultService } from "../src/services/ResultService";

async function main() {
    const { values } = parseArgs({
        options: {
            student: { type: "string", short: "s" },
            json: { type: "boolean", short: "j" },
        }
    });

    if (!values.student) {
        console.error("Usage: list-report-sheets --student <admission_number>");
        process.exit(1);
    }

    try {
        const studentId = await ResultService.getStudentIdByAdmissionNumber(values.student);
        if (!studentId) throw new Error(`Student ${values.student} not found`);

        const sheets = await ResultService.getAvailableReportSheets(studentId);

        if (values.json) {
            console.log(JSON.stringify(sheets, null, 2));
        } else {
            console.log(`--- Available Report Sheets for ${values.student} ---`);
            console.log("\nTerminal Reports:");
            sheets.terminal.forEach(s => console.log(`- ${s.session} Term ${s.term}`));
            console.log("\nAnnual Reports:");
            sheets.annual.forEach(s => console.log(`- ${s.session} Annual ${s.isPublished ? "[Published]" : "[Draft]"}`));
        }
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
