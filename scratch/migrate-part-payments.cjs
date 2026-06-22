const mysql = require('mysql2/promise');

async function run() {
    const targetDbs = ['school_portal', 'portal_ajat_academy', 'portal_citadel_uni'];

    for (const dbName of targetDbs) {
        try {
            const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${dbName}`);
            console.log(`\n=== Database: ${dbName} ===`);

            // 1. Add part_payment_allowed
            try {
                await connection.execute("ALTER TABLE student_bills ADD COLUMN part_payment_allowed TINYINT(1) DEFAULT 1");
                console.log("SUCCESS: Added part_payment_allowed column to student_bills table.");
            } catch (err) {
                if (err.message.includes("Duplicate column name")) {
                    console.log("INFO: Column part_payment_allowed already exists in student_bills table.");
                } else {
                    console.error("ERROR altering student_bills table (part_payment_allowed):", err.message);
                }
            }

            // 2. Add part_payment_min_percent
            try {
                await connection.execute("ALTER TABLE student_bills ADD COLUMN part_payment_min_percent INT DEFAULT 60");
                console.log("SUCCESS: Added part_payment_min_percent column to student_bills table.");
            } catch (err) {
                if (err.message.includes("Duplicate column name")) {
                    console.log("INFO: Column part_payment_min_percent already exists in student_bills table.");
                } else {
                    console.error("ERROR altering student_bills table (part_payment_min_percent):", err.message);
                }
            }

            await connection.end();
        } catch (e) {
            console.error(`Failed to connect or process database ${dbName}:`, e.message);
        }
    }
}

run();
