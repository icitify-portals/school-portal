import { seedAuditDemoData } from './src/actions/seed-audit-demo';

async function run() {
    try {
        const result = await seedAuditDemoData();
        console.log("Seed Result:", JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Seed Failed:", error);
        process.exit(1);
    }
}

run();
