#!/usr/bin/env node

import { parseArgs } from "util";
import { CommentService } from "../src/services/CommentService";

async function main() {
    const { values } = parseArgs({
        options: {
            average: { type: "string", short: "a" },
            branch: { type: "string", short: "b" },
            json: { type: "boolean", short: "j" },
        }
    });

    if (!values.average) {
        console.error("Please provide an average score using --average");
        process.exit(1);
    }

    const average = parseFloat(values.average);
    const branchId = values.branch ? parseInt(values.branch) : undefined;

    const comment = await CommentService.generateComment(average, branchId);

    if (values.json) {
        console.log(JSON.stringify({ value: comment }, null, 2));
    } else {
        console.log(comment);
    }

    process.exit(0);
}

main().catch(console.error);
