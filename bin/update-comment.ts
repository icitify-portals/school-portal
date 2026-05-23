#!/usr/bin/env node

import { parseArgs } from "util";
import { CommentService } from "../src/services/CommentService";
import { db } from "@/db/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const { values } = parseArgs({
        options: {
            student: { type: "string", short: "s" },
            session: { type: "string" },
            term: { type: "string" },
            comment: { type: "string", short: "m" },
            type: { type: "string", short: "t", default: "hoa" }, // hoa or teacher
        }
    });

    if (!values.student || !values.comment) {
        console.error("Usage: update-comment --student <admission_number> --comment <text> [--type hoa|teacher]");
        process.exit(1);
    }

    try {
        // 1. Resolve Student ID
        const [student] = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.admissionNumber, values.student))
            .limit(1);

        if (!student) throw new Error(`Student ${values.student} not found`);

        const sessionId = parseInt(values.session || "1");
        const term = parseInt(values.term || "1");

        // 2. Update Comment
        if (values.type === "hoa") {
            await CommentService.updatePrincipalComment(student.id, sessionId, term, values.comment);
            console.log("Head of Academics comment updated successfully.");
        } else {
            await CommentService.updateTeacherComment(student.id, sessionId, term, values.comment);
            console.log("Teacher comment updated successfully.");
        }
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
