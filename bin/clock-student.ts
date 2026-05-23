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
        const student = await AttendanceService.getStudentForAttendance(values.student);
        if (!student) throw new Error(`Student ${values.student} not found`);

        if (values.status) {
            const isClockedIn = await AttendanceService.isClockedIn(student.userId, values.context);
            console.log(isClockedIn ? "1" : "0");
        } else {
            const result = await AttendanceService.clock(
                student.userId,
                "student",
                values.context,
                values.location
            );

            console.log(`Success: ${student.name} clocked ${result.type} at ${new Date().toLocaleTimeString()}.`);
            if (result.isLate) console.log("Note: This clock-in was marked as LATE.");
        }
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
