import mysql from 'mysql2/promise';

async function main() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'oldfsstable'
        });

        console.log("\n--- Unique program in applicants ---");
        const [appPrograms] = await connection.query("SELECT DISTINCT program FROM applicants");
        console.log(appPrograms);
        
        console.log("\n--- Sample full row of applicants ---");
        const [appFull] = await connection.query("SELECT * FROM applicants LIMIT 2");
        console.log(appFull);

        process.exit(0);
    } catch (e) {
        console.error("Failed to connect or query:", e);
        process.exit(1);
    }
}

main();
