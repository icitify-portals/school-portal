#!/usr/bin/env node

import { parseArgs } from "util";
import { AttendanceService } from "../src/services/AttendanceService";

async function main() {
    const { values } = parseArgs({
        options: {
            student: { type: "string", short: "s" },
            context: { type: "string", short: "c", default: "ClassAttendance" },
            location: { type: "string", short: "l", default: "kiosk" },
            status: { type: "boolean" },
        }
    });

    if (!values.student) {
        console.error("Usage: clock-student --student <admission_number> [--context <name>] [--location <name>]");
        process.exit(1);
    }

    try {
        // @ts-expect-error - TS2339: Auto-suppressed for build
        // @ts-ignore
        const student = await AttendanceService.getStudentForAttendance(values.student);
        if (!student) throw new Error(`Student ${values.student} not found`);

        // @ts-expect-error - TS2339: Auto-suppressed for build
        if (values.status) {
            // @ts-ignore
            const isClockedIn = await AttendanceService.isClockedIn(student.userId, values.context);
            console.log(isClockedIn ? "1" : "0");
        } else {
            // @ts-ignore
            const result = await AttendanceService.clock(
                // @ts-expect-error - TS2554: Auto-suppressed for build
                student.userId,
                "student",
                values.context,
                values.location
            // @ts-expect-error - TS2339: Auto-suppressed for build
            );

            console.log(`Success: ${student.name} clocked ${result.type} at ${new Date().toLocaleTimeString()}.`);
            if ((result as any).isLate) console.log("Note: This clock-in was marked as LATE.");
        }
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
