import mysql from 'mysql2/promise';

async function run() {
    try {
        const conn = await mysql.createConnection('mysql://root@localhost:3306/moodledb');
        const sql = `insert into students (id, user_id, first_name, last_name, programme_id, dept_id, unit_id, matric_number, admission_year, admission_session_id, current_level, wallet_balance, barcode, gender, dob, status) values (default, ?, default, default, ?, default, ?, ?, default, default, ?, default, default, default, default, default) on duplicate key update current_level = ?`;
        const params = [25, 3, 1, 'MAT-2025-001', 100, 100];

        await conn.execute(sql, params);
        console.log('SUCCESS');
        await conn.end();
    } catch (err) {
        console.error('MYSQL_ERROR:', err.message);
        console.error('CODE:', err.code);
        console.error('ERRNO:', err.errno);
    }
}

run();
