import mysql from 'mysql2/promise';

async function run() {
    try {
        const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");
        const [parents] = await connection.execute("SELECT id, name, email, role FROM users WHERE role = 'parent' LIMIT 5");
        console.log("Parents found:", parents);
        await connection.end();
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
