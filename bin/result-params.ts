#!/usr/bin/env node

import { parseArgs } from "util";
import { ResultParamService } from "../src/services/ResultParamService";

async function main() {
    const { values } = parseArgs({
        options: {
            class: { type: "string", short: "c" },
            session: { type: "string", short: "s" },
            context: { type: "string", short: "x" },
            json: { type: "boolean", short: "j" },
        }
    });

    if (!values.class) {
        console.error("Usage: result-params --class <code_or_id> --session <id> --context <exam|midterm>");
        process.exit(1);
    }

    try {
        const params = await ResultParamService.getResultParams(
            values.class,
            parseInt(values.session || "1"),
            values.context || "exam"
        );

        if (values.json) {
            console.log(JSON.stringify(params, null, 2));
        } else {
            console.log(`--- Result Parameters for ${values.class} ---`);
            console.log(`Total Obtainable: ${params.total_obtainable}`);
            Object.values(params.nodes).forEach((node: any) => {
                console.log(`- ${node.name}: ${node.mark_obtainable} marks (Weight: ${node.weight})`);
            });
        }
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
