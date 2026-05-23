import { seedFssDemoData } from "../src/actions/seed-fss-demo";

async function main() {
    console.log("Starting FSS Ibadan seeding via CLI...");
    // Force override CLI database to school_portal
    process.env.CLI_DB_OVERRIDE = "school_portal";
    
    try {
        const result = await seedFssDemoData();
        console.log("Result:", result);
    } catch (e) {
        console.error("Seeding crashed:", e);
    }
    process.exit(0);
}

main();
