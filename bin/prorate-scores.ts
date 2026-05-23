#!/usr/bin/env node

import { parseArgs } from "util";
import { ProrationService } from "../src/services/ProrationService";

async function main() {
    const { values } = parseArgs({
        options: {
            course: { type: "string", short: "c" },
            session: { type: "string", short: "s" },
            term: { type: "string", short: "t" },
            factor: { type: "string", short: "f" },
            user: { type: "string", short: "u" },
            reason: { type: "string", short: "r" },
        }
    });

    const result = await ProrationService.prorateResultsInTerm(
        parseInt(values.session || "1"),
        parseInt(values.term || "1")
    );

    console.log(`Batch proration complete. Updated ${result.count} records.`);
    process.exit(0);
}

main().catch(console.error);
