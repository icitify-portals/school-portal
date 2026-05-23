
import { seedLmsData } from "../src/actions/lms-seed";

async function runSeed() {
    console.log("Starting LMS Seeding from Script...");
    const result = await seedLmsData();
    console.log("Seed Result:", JSON.stringify(result, null, 2));
    process.exit(0);
}

runSeed();
