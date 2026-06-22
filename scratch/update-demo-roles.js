import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function run() {
    try {
        const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");
        console.log("Connected to school_portal database successfully.");

        // 1. Update Bursar
        console.log("Updating bursar@demo.edu role to 'bursar'...");
        await connection.execute("UPDATE users SET role = 'bursar' WHERE email = 'bursar@demo.edu'");

        // 2. Update Registrar
        console.log("Updating registrar@demo.edu role to 'registrar'...");
        await connection.execute("UPDATE users SET role = 'registrar' WHERE email = 'registrar@demo.edu'");

        // 3. Create/Update Librarian
        console.log("Creating/updating librarian@demo.edu role to 'librarian'...");
        const hashedPassword = await bcrypt.hash("Password123!", 10);
        await connection.execute(
            `INSERT INTO users (name, email, password, role, status) 
             VALUES ('Librarian Admin', 'librarian@demo.edu', ?, 'librarian', 'active')
             ON DUPLICATE KEY UPDATE role = 'librarian'`,
            [hashedPassword]
        );

        console.log("=== ALL DEMO ACCOUNTS UPDATED SUCCESSFULLY ===");
        
        // Print updated list of users
        const [users] = await connection.execute("SELECT id, name, email, role FROM users LIMIT 15");
        console.log(users);

        await connection.end();
    } catch (e) {
        console.error("Error updating demo roles:", e);
    }
}

run();
