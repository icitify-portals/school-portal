#!/usr/bin/env node

import { parseArgs } from "util";
import { TeacherService } from "../src/services/TeacherService";

async function main() {
    const { values } = parseArgs({
        options: {
            tid: { type: "string" },
            name: { type: "string", short: "n" },
            username: { type: "string" },
            email: { type: "string", short: "e" },
            qualification: { type: "string" },
            sex: { type: "string" },
            phone: { type: "string" },
            marital: { type: "string" },
            branch: { type: "string", short: "b" },
            category: { type: "string", short: "c" },
        }
    });

    if (!values.name || !values.branch) {
        console.error("Usage: register-teacher --name <name> --branch <id> [--tid <id>] [--email <email>] ...");
        process.exit(1);
    }

    try {
        const data = {
            staffId: values.tid,
            name: values.name,
            username: values.username || values.name.toLowerCase().replace(/ /g, '.'),
            email: values.email || `${values.tid || 'staff'}@school.edu`,
            qualification: values.qualification || "B.Ed",
            sex: values.sex || "other",
            phoneNumber: values.phone || "",
            maritalStatus: values.marital || "single",
            branchId: parseInt(values.branch),
            category: values.category as any || 'academic'
        };

        console.log(`Onboarding institutional staff [${data.category}]: ${data.name}...`);
        const result = await TeacherService.createTeacher(data, 1);
        console.log(`Success: Registered as ${result.title} with Profile ID ${result.staffId}.`);
        
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
