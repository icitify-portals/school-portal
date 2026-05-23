#!/usr/bin/env node

import { parseArgs } from "util";
import { StudentService } from "../src/services/StudentService";

async function main() {
    const { values } = parseArgs({
        options: {
            session: { type: "string", short: "s" },
            branch: { type: "string", short: "b" },
            status: { type: "string" }, // active, graduated, etc.
        }
    });

    if (!values.session || !values.branch) {
        console.error("Usage: list-students --session <id> --branch <id> [--status active]");
        process.exit(1);
    }

    try {
        const sessionId = parseInt(values.session);
        const branchId = parseInt(values.branch);
        
        console.log(`Fetching student list for Session ${sessionId} (Branch ${branchId})...`);
        const list = await StudentService.listStudents(branchId, sessionId, values.status);
        
        console.log(`--- Student List (${list.length} found) ---`);
        list.forEach(s => {
            console.log(`- [${s.admissionNumber}] ${s.name} (${s.gender || 'N/A'}) - Level ${s.level || 'N/A'} [${s.status}]`);
        });
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
