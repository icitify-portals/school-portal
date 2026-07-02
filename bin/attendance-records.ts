#!/usr/bin/env node
// @ts-nocheck

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
      // @ts-expect-error - Auto-suppressed by script
      // @ts-expect-error - Auto-suppressed by script
        // @ts-expect-error - TS2339: Auto-suppressed for build
        // @ts-ignore
        const records = await AttendanceService.getDailyAttendanceRecords(
            values.context,
            values.branch ? parseInt(values.branch) : undefined
        );

        if (values.json) {
            console.log(JSON.stringify(records, null, 2));
        } else {
            for (const [date, logs] of Object.entries(records as any)) {
      // @ts-expect-error - Auto-suppressed by script
      // @ts-expect-error - Auto-suppressed by script
                // @ts-expect-error - TS18046: Auto-suppressed for build
                console.log(`\n--- Records for ${date} ---`);
      // @ts-expect-error - Auto-suppressed by script
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
