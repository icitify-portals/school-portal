import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

async function run() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    const [rows] = await connection.execute('SELECT email, role FROM users WHERE email = ?', ['superadmin@demo.edu']);
    console.log("Existing superadmin:", rows);

    const hashedPassword = await bcrypt.hash("Password123!", 10);
    console.log("Updating password for superadmin@demo.edu to 'Password123!'...");
    
    await connection.execute(
        'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password = ?, role = ?, status = ?',
        ['Super Admin', 'superadmin@demo.edu', hashedPassword, 'superadmin', 'active', hashedPassword, 'superadmin', 'active']
    );

    console.log("Password updated successfully.");
    await connection.end();
}

run().catch(console.error);
