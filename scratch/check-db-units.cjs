const mysql = require('mysql2/promise');

async function run() {
    const targetDbs = ['school_portal', 'portal_ajat_academy', 'portal_citadel_uni'];

    for (const dbName of targetDbs) {
        try {
            const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${dbName}`);
            console.log(`\n=== DB: ${dbName} ===`);
            const [units] = await connection.execute("SELECT id, name, type, academic_tier FROM institutional_units");
            console.log("Units:", units);
            const [progs] = await connection.execute("SELECT id, name, code, dept_id FROM programmes LIMIT 5");
            console.log("Programmes:", progs);
            await connection.end();
        } catch (e) {
            console.error(`Failed to query in ${dbName}:`, e.message);
        }
    }
}

run();
