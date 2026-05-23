import mysql from 'mysql2/promise';
import 'dotenv/config';

async function migrate() {
    console.log("🛠️ Starting profile expansion migration...");
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL!);

        console.log("Adding comprehensive profile fields to students table...");

        await connection.execute(`
            ALTER TABLE students 
            ADD COLUMN guardian_name VARCHAR(255) AFTER status,
            ADD COLUMN guardian_address TEXT AFTER guardian_name,
            ADD COLUMN guardian_occupation VARCHAR(255) AFTER guardian_address,
            ADD COLUMN guardian_phone VARCHAR(20) AFTER guardian_occupation,
            ADD COLUMN guardian_whatsapp VARCHAR(20) AFTER guardian_phone,
            ADD COLUMN guardian_email VARCHAR(150) AFTER guardian_whatsapp,
            
            ADD COLUMN kin_name VARCHAR(255) AFTER guardian_email,
            ADD COLUMN kin_address TEXT AFTER kin_name,
            ADD COLUMN kin_occupation VARCHAR(255) AFTER kin_address,
            ADD COLUMN kin_phone VARCHAR(20) AFTER kin_occupation,
            ADD COLUMN kin_whatsapp VARCHAR(20) AFTER kin_phone,
            ADD COLUMN kin_email VARCHAR(150) AFTER kin_whatsapp,
            
            ADD COLUMN doctor_name VARCHAR(255) AFTER kin_email,
            ADD COLUMN doctor_address TEXT AFTER doctor_name,
            ADD COLUMN doctor_phone VARCHAR(20) AFTER doctor_address,
            ADD COLUMN doctor_whatsapp VARCHAR(20) AFTER doctor_phone,
            ADD COLUMN doctor_email VARCHAR(150) AFTER doctor_whatsapp,
            
            ADD COLUMN ailments TEXT AFTER doctor_email,
            ADD COLUMN operations TEXT AFTER ailments,
            ADD COLUMN food_allergies TEXT AFTER operations,
            ADD COLUMN blood_group VARCHAR(10) AFTER food_allergies,
            ADD COLUMN genotype VARCHAR(10) AFTER blood_group
        `);

        console.log("✅ Migration successful!");
        await connection.end();
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

migrate();
