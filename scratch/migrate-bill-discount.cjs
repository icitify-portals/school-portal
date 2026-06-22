const mysql = require('mysql2/promise');

const databases = ['school_portal', 'portal_ajat_academy', 'portal_citadel_uni'];

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
    });

    for (const dbName of databases) {
        console.log(`\n--- Migrating: ${dbName} ---`);
        try {
            await connection.query(`USE \`${dbName}\``);

            // Add discount column to student_bill_items
            const [cols] = await connection.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'student_bill_items' AND COLUMN_NAME = 'discount'`,
                [dbName]
            );
            if (cols.length === 0) {
                await connection.query(`ALTER TABLE student_bill_items ADD COLUMN discount DECIMAL(12,2) DEFAULT '0.00'`);
                console.log(`  ✅ Added 'discount' column to student_bill_items`);
            } else {
                console.log(`  ⏭️  'discount' column already exists`);
            }

            // Seed school_address setting if not present
            const [addrRows] = await connection.query(
                `SELECT id FROM system_config WHERE \`key\` = 'school_address' LIMIT 1`
            );
            if (addrRows.length === 0) {
                await connection.query(
                    `INSERT INTO system_config (\`key\`, value, config_group, is_encrypted) VALUES ('school_address', '', 'branding', false)`
                );
                console.log(`  ✅ Seeded 'school_address' config key`);
            } else {
                console.log(`  ⏭️  'school_address' config key already exists`);
            }

            // Seed school_bill_note setting if not present
            const [noteRows] = await connection.query(
                `SELECT id FROM system_config WHERE \`key\` = 'school_bill_note' LIMIT 1`
            );
            if (noteRows.length === 0) {
                await connection.query(
                    `INSERT INTO system_config (\`key\`, value, config_group, is_encrypted) VALUES ('school_bill_note', '', 'bursary', false)`
                );
                console.log(`  ✅ Seeded 'school_bill_note' config key`);
            } else {
                console.log(`  ⏭️  'school_bill_note' config key already exists`);
            }

        } catch (err) {
            console.error(`  ❌ Error in ${dbName}:`, err.message);
        }
    }

    await connection.end();
    console.log('\n✅ Migration complete.');
}

migrate();
