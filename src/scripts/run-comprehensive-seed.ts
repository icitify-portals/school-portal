import { seedComprehensiveDemo } from "../actions/seed-comprehensive-demo";

async function run() {
    console.log("🚀 Execoting Comprehensive Multi-Tier Seed...");
    const result = await seedComprehensiveDemo();
    if (result.success) {
        console.log("✅ Seeding completed:", result.message);
    } else {
        console.error("❌ Seeding failed:", result.error);
    }
    process.exit(result.success ? 0 : 1);
}

run();
