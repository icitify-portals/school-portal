#!/usr/bin/env node

import { parseArgs } from "util";
import { PromotionService } from "../src/services/PromotionService";

async function main() {
    const { values } = parseArgs({
        options: {
            admission_number: { type: "string", short: "a" },
            session: { type: "string", short: "s" },
            term: { type: "string", short: "t" },
            branch: { type: "string", short: "b" },
            json: { type: "boolean", short: "j" },
        }
    });

    if (!values.admission_number || !values.session || !values.term) {
        console.error("Please provide --admission_number, --session, and --term");
        process.exit(1);
    }

    const admissionNumber = values.admission_number;
    const sessionName = values.session;
    const term = values.term;
    const branchId = values.branch ? parseInt(values.branch) : undefined;

    const isPromoted = await PromotionService.isPromoted(admissionNumber, sessionName, term, branchId);

    if (values.json) {
        console.log(JSON.stringify({ value: isPromoted }, null, 2));
    } else {
        console.log(isPromoted ? "true" : "false");
    }

    process.exit(0);
}

main().catch(console.error);
