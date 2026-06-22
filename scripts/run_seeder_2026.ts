import { seed2026Admission } from "../src/actions/seed_2026_admission";

async function run() {
    console.log("Starting 2026 Seeder...");
    const res = await seed2026Admission();
    console.log("Result:", res);
    process.exit(0);
}

run();
