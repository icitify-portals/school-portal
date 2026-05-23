import { seedResultsDemo } from "../actions/seed-results-demo";

async function run() {
    console.log("🚀 Executing Results Engine Demo Seed...");
    const result = await seedResultsDemo();
    if (result.success) {
        console.log("✅ Seeding completed successfully!");
    } else {
        console.error("❌ Seeding failed:", result.error);
    }
    process.exit(result.success ? 0 : 1);
}

run();
