import { seedInstitutionalHub } from "../src/actions/seed-hub";
import { seedPanAfricanDemo } from "../src/actions/seed-pan-african";
import { seedLmsData } from "../src/actions/lms-seed";

async function run() {
    try {
        console.log("----------------------------------------");
        console.log("1. Seeding Institutional Hub...");
        await seedInstitutionalHub();
        console.log("Institutional Hub seeded successfully.");
        
        console.log("----------------------------------------");
        console.log("2. Seeding Pan-African structures...");
        const resHub = await seedPanAfricanDemo();
        console.log("Pan-African seeding result:", JSON.stringify(resHub));

        console.log("----------------------------------------");
        console.log("3. Seeding LMS Formatted Courses...");
        const resLms = await seedLmsData();
        console.log("LMS seeding result:", JSON.stringify(resLms));
        console.log("----------------------------------------");
        console.log("ALL SEEDING COMPLETED SUCCESSFULY!");
    } catch (e: any) {
        console.error("Seeding failed with error:", e);
    }
}

run();
