#!/usr/bin/env node

import { parseArgs } from "util";
import { ResultAggregationService } from "../src/services/ResultAggregationService";

async function main() {
    const { values } = parseArgs({
        options: {
            student: { type: "string", short: "s" },
            session: { type: "string" },
            term: { type: "string" },
            json: { type: "boolean", short: "j" },
        }
    });

    if (!values.student) {
        console.error("Usage: compute-result --student <admission_number> --session <id> --term <number>");
        process.exit(1);
    }

    try {
        const result = await ResultAggregationService.computeStudentResultData(
            values.student,
            parseInt(values.session || "1"),
            parseInt(values.term || "1")
        );

        if (values.json) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log(`--- Result for ${result.student.name} (${result.student.admissionNumber}) ---`);
            console.log(`Average: ${result.summary?.gpa || "N/A"}`);
            console.log(`Subjects: ${result.results.length}`);
            result.results.forEach(r => {
                console.log(`${r.subjectCode}: ${r.totalScore} (${r.grade}) - Rank: ${r.rank}`);
            });
        }
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
