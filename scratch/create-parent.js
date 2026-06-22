import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function run() {
    try {
        const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");
        console.log("Connected to school_portal database successfully.");

        console.log("Creating/updating parent@demo.edu role to 'parent'...");
        const hashedPassword = await bcrypt.hash("Password123!", 10);
        await connection.execute(
            `INSERT INTO users (name, email, password, role, status) 
             VALUES ('Demo Parent', 'parent@demo.edu', ?, 'parent', 'active')
             ON DUPLICATE KEY UPDATE role = 'parent'`,
            [hashedPassword]
        );

        console.log("=== PARENT DEMO ACCOUNT CREATED SUCCESSFULLY ===");
        
        // Print updated parent users
        const [parents] = await connection.execute("SELECT id, name, email, role FROM users WHERE role = 'parent'");
        console.log(parents);

        await connection.end();
    } catch (e) {
        console.error("Failed to create parent user:", e);
    }
}

run();
