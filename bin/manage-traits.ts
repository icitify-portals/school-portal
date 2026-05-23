#!/usr/bin/env node

import { parseArgs } from "util";
import { db } from "../src/db/db";
import { observableTraits, observableTraitGroups, observableTraitAliases } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const { values, positionals } = parseArgs({
        options: {
            name: { type: "string", short: "n" },
            group: { type: "string", short: "g" },
            alias: { type: "string", short: "a" },
            class: { type: "string", short: "c" },
            json: { type: "boolean", short: "j" },
        },
        allowPositionals: true
    });

    const command = positionals[0];

    switch (command) {
        case "add-group":
            if (!values.name) {
                console.error("Usage: add-group --name <group_name>");
                process.exit(1);
            }
            await db.insert(observableTraitGroups).values({ name: values.name });
            console.log(`Added group: ${values.name}`);
            break;

        case "add-trait":
            if (!values.name || !values.group) {
                console.error("Usage: add-trait --name <trait_name> --group <group_id>");
                process.exit(1);
            }
            await db.insert(observableTraits).values({ 
                name: values.name, 
                groupId: parseInt(values.group) 
            });
            console.log(`Added trait: ${values.name} in group ${values.group}`);
            break;

        case "add-alias":
            if (!values.name || !values.alias) {
                console.error("Usage: add-alias --name <trait_name_or_id> --alias <alias_name> [--class <class_id>]");
                process.exit(1);
            }
            // Logic to find trait and add alias
            // (Simplified for demonstration)
            await db.insert(observableTraitAliases).values({
                traitId: parseInt(values.name as string),
                alias: values.alias as string,
                classId: values.class ? parseInt(values.class) : undefined
            });
            console.log(`Added alias: ${values.alias}`);
            break;

        case "list":
            const traits = await db.select().from(observableTraits);
            if (values.json) {
                console.log(JSON.stringify(traits, null, 2));
            } else {
                traits.forEach(t => console.log(`${t.id}: ${t.name}`));
            }
            break;

        default:
            console.log("Commands: add-group, add-trait, add-alias, list");
    }

    process.exit(0);
}

main().catch(console.error);
