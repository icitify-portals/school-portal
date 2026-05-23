#!/usr/bin/env node

import { parseArgs } from "util";
import { GradingService } from "../src/services/GradingService";

async function main() {
    const { values } = parseArgs({
        options: {
            score: { type: "string", short: "s" },
            class: { type: "string", short: "c" },
            context: { type: "string", short: "x" },
            branch: { type: "string", short: "b" },
            json: { type: "boolean", short: "j" },
        }
    });

    if (!values.score) {
        console.error("Please provide a score using --score");
        process.exit(1);
    }

    const score = parseFloat(values.score);
    const levelId = values.class;
    const context = values.context || "exam";
    const branchId = values.branch ? parseInt(values.branch) : undefined;

    const result = await GradingService.getGradeAndRemark(score, levelId, context, branchId);

    if (values.json) {
        console.log(JSON.stringify({ 
            grade: result.grade, 
            remark: result.remark 
        }, null, 2));
    } else {
        console.log(`Grade: ${result.grade}`);
        console.log(`Remark: ${result.remark}`);
    }

    process.exit(0);
}

main().catch(console.error);
