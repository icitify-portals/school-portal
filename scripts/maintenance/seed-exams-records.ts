import { db } from './src/db/db';
import { institutionalUnits, users, staffProfiles } from './src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function run() {
    try {
        console.log("🛠️ Seeding Exams and Records Unit...");

        // 1. Create Institutional Unit
        const unitCode = 'EXAMS_RECORDS';
        let [unit] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.code, unitCode)).limit(1);

        if (!unit) {
            console.log("Creating unit...");
            await db.insert(institutionalUnits).values({
                name: "Exams and Records Unit",
                code: unitCode,
                type: 'unit',
                headTitle: 'Registrar (Exams & Records)'
            });
            [unit] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.code, unitCode)).limit(1);
        }
        console.log(`Unit: ${unit.name} (ID: ${unit.id})`);

        // 2. Create Staff Account for the Unit
        const staffEmail = 'exams.records@school.com';
        let [staffUser] = await db.select().from(users).where(eq(users.email, staffEmail)).limit(1);

        if (!staffUser) {
            console.log("Creating staff user...");
            const hashedPassword = await bcrypt.hash('password123', 10);
            await db.insert(users).values({
                name: "Exams Records Staff",
                email: staffEmail,
                password: hashedPassword,
                role: 'staff',
                status: 'active'
            });
            [staffUser] = await db.select().from(users).where(eq(users.email, staffEmail)).limit(1);
        }

        // 3. Create Staff Profile
        let [profile] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, staffUser.id)).limit(1);
        if (!profile) {
            console.log("Creating staff profile...");
            await db.insert(staffProfiles).values({
                userId: staffUser.id,
                staffId: 'STF-EXAMS-001',
                unitId: unit.id,
                jobTitle: 'Unit Head',
            });
        }

        // 4. Update Unit Head
        await db.update(institutionalUnits).set({ headUserId: staffUser.id }).where(eq(institutionalUnits.id, unit.id));

        console.log("✅ Exams and Records Unit Seeded Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

run();
