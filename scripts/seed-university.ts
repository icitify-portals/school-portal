import { seedUniversityStructure } from "../src/actions/seed-university-structure.js";

console.log("🚀 Starting University Structure Seeding...");

seedUniversityStructure()
    .then((result) => {
        if (result.success) {
            console.log("✅ Seeding completed successfully!");
            console.log(result.message);
            process.exit(0);
        } else {
            console.error("❌ Seeding failed:", result.error);
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error("❌ Unexpected error:", error);
        process.exit(1);
    });
