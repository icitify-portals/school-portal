#!/usr/bin/env node

import { parseArgs } from "util";
import { StudentService } from "../src/services/StudentService";

async function main() {
    const { values } = parseArgs({
        options: {
            admission: { type: "string", short: "a" },
            matric: { type: "string", short: "m" },
            name: { type: "string", short: "n" },
            sex: { type: "string" },
            level: { type: "string" }, // 100, 200, JSS1, etc.
            branch: { type: "string", short: "b" },
            unit: { type: "string", short: "u" },
        }
    });

    if (!values.admission || !values.name) {
        console.error("Usage: register-student --admission <number> --name <full_name> [--sex male|female] [--branch <id>]");
        process.exit(1);
    }

    try {
        const names = values.name.split(" ");
        const data = {
            admissionNumber: values.admission,
            matricNumber: values.matric || values.admission,
            name: values.name,
            surname: names[0] || "",
            firstName: names[1] || "",
            otherNames: names.slice(2).join(" "),
            sex: values.sex || "other",
            level: values.level ? parseInt(values.level) : 100,
            branchId: values.branch ? parseInt(values.branch) : 1,
            unitId: values.unit ? parseInt(values.unit) : 1,
        };

        console.log(`Registering student ${data.name} (${data.matricNumber})...`);
        const result = await StudentService.createStudent(data, 1);
        console.log(`Success: Student registered with ID ${result.studentId}.`);
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
