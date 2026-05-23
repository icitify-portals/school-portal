#!/usr/bin/env node

import { parseArgs } from "util";
import { StudentPrivilegeService } from "../src/services/StudentPrivilegeService";

async function main() {
    const { values } = parseArgs({
        options: {
            list: { type: "boolean" },
            student: { type: "string", short: "s" },
            grant: { type: "string", short: "g" }, // Privilege Name
            revoke: { type: "string", short: "r" },
            "status-list": { type: "string", short: "L" }, // Privilege Name
            "check-status": { type: "string", short: "C" }, // Privilege Name
            students: { type: "string" }, // Comma-separated IDs/Admission Numbers
            value: { type: "string" }, // "1" for grant, "0" for revoke
        }
    });

    try {
        if (values.list) {
            const list = await StudentPrivilegeService.listPrivileges();
            console.log("--- System Privileges ---");
            list.forEach(p => console.log(`[${p.id}] ${p.name}: ${p.description || ""}`));
        } else if (values.student && (values.grant || values.revoke || values.value)) {
            const privName = values.grant || values.revoke || "General";
            const privs = await StudentPrivilegeService.listPrivileges();
            const priv = privs.find(p => p.name.toLowerCase() === privName.toLowerCase());
            if (!priv) throw new Error(`Privilege ${privName} not found`);

            const isGrant = values.value === "1" || !!values.grant;
            
            if (isGrant) {
                console.log(`Granting ${priv.name} to student ${values.student}...`);
                await StudentPrivilegeService.grantPrivilege(parseInt(values.student), priv.id, 1);
            } else {
                console.log(`Revoking ${priv.name} from student ${values.student}...`);
                await StudentPrivilegeService.revokePrivilege(parseInt(values.student), priv.id);
            }
            console.log("Success.");
        } else if (values["status-list"]) {
            const data = await StudentPrivilegeService.getDetailedCohortPrivilegeStatus(values["status-list"], 1);
            console.log(`--- Status List for ${values["status-list"]} ---`);
            data.forEach(d => {
                console.log(`${d.admissionNumber}: ${d.name} - Granted: ${d.grantedAt?.toLocaleDateString()} ${d.expiresAt ? `(Expires: ${d.expiresAt.toLocaleDateString()})` : ""}`);
            });
        } else if (values.student && values["check-status"]) {
            // Mocking student ID for demo
            const hasPriv = await StudentPrivilegeService.hasPrivilege(parseInt(values.student), values["check-status"]);
            console.log(hasPriv ? "1" : "0");
        } else if (values.students && (values.grant || values.revoke || values.value)) {
            const ids = values.students.split(",").map(id => parseInt(id.trim()));
            const privName = values.grant || values.revoke || "General"; // simplified
            
            const privs = await StudentPrivilegeService.listPrivileges();
            const priv = privs.find(p => p.name.toLowerCase() === privName.toLowerCase());
            if (!priv) throw new Error(`Privilege ${privName} not found`);

            const isGrant = values.value === "1" || !!values.grant;
            
            if (isGrant) {
                await StudentPrivilegeService.batchGrantPrivilege(ids, priv.id, 1);
                console.log(`Successfully granted ${priv.name} to ${ids.length} students.`);
            } else {
                await StudentPrivilegeService.batchRevokePrivilege(ids, priv.id);
                console.log(`Successfully revoked ${priv.name} from ${ids.length} students.`);
            }
        } else {
            console.log("Usage: manage-privileges --list OR manage-privileges --student <id> --grant <name>");
        }
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
