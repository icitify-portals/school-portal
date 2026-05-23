import mysql from 'mysql2/promise';

async function run() {
    try {
        const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");
        
        console.log("=== SYSTEM MODULES ===");
        const [modules] = await connection.execute("SELECT * FROM system_modules");
        console.log(JSON.stringify(modules, null, 2));
        
        await connection.end();
    } catch (e) {
        console.error("Error connecting or querying:", e);
    }
}

run();
