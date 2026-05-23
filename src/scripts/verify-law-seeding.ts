
import { db } from "../db/db";
import { sql } from "drizzle-orm";
import fs from "fs";

async function verify() {
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync("verify_output_v2.txt", msg + "\n");
    };

    fs.writeFileSync("verify_output_v2.txt", "--- Verification Log ---\n");

    log("🔍 Verifying Law Seeding...");

    // Check Courses
    try {
        const [courses]: any = await db.execute(sql`SELECT count(*) as count FROM courses WHERE code LIKE 'LAW%' OR code LIKE 'LPU%' OR code LIKE 'LPB%' OR code LIKE 'LPI%' OR code LIKE 'LJI%' OR code LIKE 'LCI%' OR code LIKE 'LPP%'`);
        log(`📚 Law Courses Query Result: ${JSON.stringify(courses)}`);
    } catch (e: any) {
        log(`❌ Error checking courses: ${e.message}`);
    }

    // Check Staff
    try {
        const [staff]: any = await db.execute(sql`SELECT count(*) as count FROM staff_profiles s JOIN users u ON s.user_id = u.id WHERE u.email LIKE '%@university.edu.ng'`);
        log(`👨‍🏫 Law Staff Query Result: ${JSON.stringify(staff)}`);
    } catch (e: any) {
        log(`❌ Error checking staff: ${e.message}`);
    }

    // Check Departments
    try {
        const [depts]: any = await db.execute(sql`SELECT code, name FROM departments WHERE code IN ('PUL', 'PPL', 'CIL', 'JIL', 'LAW_GEN')`);
        log("🏢 Departments Found:");
        (depts as any[]).forEach((d: any) => log(` - ${d.code}: ${d.name}`));
    } catch (e: any) {
        log(`❌ Error checking departments: ${e.message}`);
    }

    // Check Faculty
    try {
        const [faculty]: any = await db.execute(sql`SELECT * FROM faculties WHERE code = 'LAW'`);
        if (faculty.length > 0) {
            log(`⚖️ Faculty Found: ${faculty[0].name} (${faculty[0].code})`);
        } else {
            log("❌ Faculty NOT Found");
        }
    } catch (e: any) {
        log(`❌ Error checking faculty: ${e.message}`);
    }

    process.exit(0);
}

verify().catch((e) => {
    console.error(e);
    fs.appendFileSync("verify_output_v2.txt", `CRITICAL ERROR: ${e.message}\n`);
    process.exit(1);
});
