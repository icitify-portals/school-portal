#!/usr/bin/env node

/**
 * manage-school.ts
 * Manages institutional units (branches) and their settings.
 * Mirrors Rust's school module dispatcher.
 */

import { SchoolService } from "../src/services/SchoolService";

function usage() {
    console.log(`
School & Branch Management CLI
Usage: manage-school <command> [args]

Commands:
  list              List all branches
  add <name>        Add a new branch
  delete <name>     Delete a branch by name
  rename <old> <new> Rename a branch
  config <unit_id>  Get or set unit settings
    --template <code>     Set report sheet template code
    --show-position <bool> Set whether to show positions (true/false)
    --get                 Show current configuration

Examples:
  npx tsx bin/manage-school.ts list
  npx tsx bin/manage-school.ts add "Secondary School"
  npx tsx bin/manage-school.ts rename "Secondary School" "High School"
  npx tsx bin/manage-school.ts config 1 --get
    `);
}

async function main() {
    const rawArgs = process.argv.slice(2);
    const command = rawArgs[0];

    if (!command || command === "--help") {
        usage();
        process.exit(0);
    }

    switch (command) {
        case "list": {
            const branches = await SchoolService.listBranches();
            if (branches.length === 0) {
                console.log("No branches found.");
            } else {
                branches.forEach(b => console.log(b.name));
            }
            break;
        }

        case "add": {
            const name = rawArgs[1];
            if (!name) {
                console.error("Error: Branch name required.");
                process.exit(1);
            }
            await SchoolService.addBranch(name);
            console.log(`Successfully added branch: ${name}`);
            break;
        }

        case "delete": {
            const name = rawArgs[1];
            if (!name) {
                console.error("Error: Branch name required.");
                process.exit(1);
            }
            await SchoolService.deleteBranch(name);
            console.log(`Successfully deleted branch: ${name}`);
            break;
        }

        case "rename": {
            const oldName = rawArgs[1];
            const newName = rawArgs[2];
            if (!oldName || !newName) {
                console.error("Error: Old and new names required.");
                process.exit(1);
            }
            await SchoolService.renameBranch(oldName, newName);
            console.log(`Successfully renamed branch from '${oldName}' to '${newName}'`);
            break;
        }

        case "config": {
            const unitIdStr = rawArgs[1];
            if (!unitIdStr) {
                console.error("Error: Unit ID required.");
                process.exit(1);
            }
            const unitId = parseInt(unitIdStr);

            // Simple flag parsing for the remaining args
            const args = rawArgs.slice(2);
            const getFlag = args.includes("--get");
            const templateIdx = args.indexOf("--template");
            const showPosIdx = args.indexOf("--show-position");

            if (getFlag) {
                const code = await SchoolService.getReportSheetTemplateCode(unitId);
                const showPos = await SchoolService.shouldShowPosition(unitId);
                console.log(`Unit ${unitId} Config:`);
                console.log(`- Template Code: ${code}`);
                console.log(`- Show Position: ${showPos}`);
            } else if (templateIdx !== -1) {
                const template = args[templateIdx + 1];
                await SchoolService.updateUnitSettings(unitId, { reportSheetTemplateCode: template });
                console.log(`Updated Template Code for Unit ${unitId} to: ${template}`);
            } else if (showPosIdx !== -1) {
                const show = args[showPosIdx + 1] === "true";
                await SchoolService.updateUnitSettings(unitId, { showPosition: show });
                console.log(`Updated Show Position for Unit ${unitId} to: ${show}`);
            } else {
                console.log("No config action specified. Use --get, --template, or --show-position.");
            }
            break;
        }

        default:
            console.error(`Unknown command: ${command}`);
            usage();
            process.exit(1);
    }

    process.exit(0);
}

main().catch(error => {
    console.error("Error:", error.message);
    process.exit(1);
});
