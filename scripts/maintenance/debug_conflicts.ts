import mysql from 'mysql2/promise';

async function run() {
    try {
        const conn = await mysql.createConnection('mysql://root@localhost:3306/moodledb');
        const [rows] = await conn.query('SELECT id, user_id, matric_number FROM students WHERE user_id = 25 OR matric_number = "MAT-2025-001"');
        console.log('CONFLICTING_ROWS:', JSON.stringify(rows, null, 2));
        await conn.end();
    } catch (err) {
        console.error('QUERY_ERROR:', err.message);
    }
}

run();
