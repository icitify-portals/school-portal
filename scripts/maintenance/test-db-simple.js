
import mysql from 'mysql2/promise';

async function test() {
    try {
        const connection = await mysql.createConnection("mysql://root@localhost:3306/moodledb");
        console.log("Connected to database.");
        const [rows] = await connection.execute("SHOW TABLES LIKE 'academic_sessions'");
        console.log("academic_sessions search result:", rows);
        if (rows.length > 0) {
            const [columns] = await connection.execute("SHOW COLUMNS FROM academic_sessions");
            console.log("Columns in academic_sessions:", columns.map(c => c.Field));
        } else {
            console.log("Table academic_sessions NOT FOUND.");
        }
        await connection.end();
    } catch (err) {
        console.error("DATABASE ERROR:", err);
    }
}

test();
