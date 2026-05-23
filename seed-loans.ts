import { seedUniversityLoanTemplates } from "./src/actions/seed-university-loans";

async function run() {
    console.log("🚀 Starting University Loan Seeding...");
    const res = await seedUniversityLoanTemplates();
    if (res.success) {
        console.log("✅ SUCCESS:", res.message);
    } else {
        console.error("❌ FAILED:", res.error);
    }
    process.exit(0);
}

run();
