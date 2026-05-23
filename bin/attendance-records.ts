#!/usr/bin/env node

import { parseArgs } from "util";
import { AttendanceService } from "../src/services/AttendanceService";

async function main() {
    const { values } = parseArgs({
        options: {
            context: { type: "string", short: "c", default: "ClassAttendance" },
            branch: { type: "string", short: "b" },
            json: { type: "boolean", short: "j" },
        }
    });

    try {
        const records = await AttendanceService.getDailyAttendanceRecords(
            values.context,
            values.branch ? parseInt(values.branch) : undefined
        );

        if (values.json) {
            console.log(JSON.stringify(records, null, 2));
        } else {
            for (const [date, logs] of Object.entries(records)) {
                console.log(`\n--- Records for ${date} ---`);
                logs.forEach((log: any) => {
                    console.log(`[${log.time}] ${log.name} (${log.admission_number}) - Clocked ${log.type.toUpperCase()} ${log.is_late ? "[LATE]" : ""}`);
                });
            }
        }
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
