const mysql = require('mysql2/promise');

async function run() {
    const targetDbs = ['school_portal', 'portal_ajat_academy', 'portal_citadel_uni'];

    for (const dbName of targetDbs) {
        try {
            const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${dbName}`);
            console.log(`\n=== DB: ${dbName} ===`);
            const [rows] = await connection.execute("SELECT id, name, type, level, is_active FROM document_templates");
            console.log("Templates:", rows);
            await connection.end();
        } catch (e) {
            console.error(`Failed to query templates in ${dbName}:`, e.message);
        }
    }
}

run();
