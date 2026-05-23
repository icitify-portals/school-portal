
import mysql from 'mysql2/promise';

async function test() {
    try {
        const connection = await mysql.createConnection("mysql://root@127.0.0.1:3306");
        console.log("Connected to MySQL server.");
        const [dbs] = await connection.query("SHOW DATABASES");
        console.log("Databases:", dbs.map(d => d.Database));

        const dbExists = dbs.some(d => d.Database === 'moodledb');
        if (dbExists) {
            console.log("moodledb exists. Switching to it...");
            await connection.query("USE moodledb");
            const [tables] = await connection.query("SHOW TABLES LIKE 'academic_sessions'");
            console.log("academic_sessions search result:", tables);
            if (tables.length > 0) {
                const [columns] = await connection.query("SHOW COLUMNS FROM academic_sessions");
                console.log("Columns in academic_sessions:", columns.map(c => c.Field));
            } else {
                console.log("Table academic_sessions NOT FOUND.");
            }
        } else {
            console.log("moodledb NOT FOUND.");
        }
        await connection.end();
    } catch (err) {
        console.log("ERROR_START");
        console.log(JSON.stringify({
            message: err.message,
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            stack: err.stack
        }, null, 2));
        console.log("ERROR_END");
    }
}

test();
