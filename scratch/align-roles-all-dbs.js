import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function run() {
    const targetDbs = ['school_portal', 'portal_ajat_academy', 'portal_citadel_uni'];
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    for (const dbName of targetDbs) {
        try {
            const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${dbName}`);
            console.log(`\nConnected to ${dbName} database successfully.`);

            // 1. Update Bursar
            console.log("Updating bursar@demo.edu role to 'bursar'...");
            await connection.execute("UPDATE users SET role = 'bursar' WHERE email = 'bursar@demo.edu'");

            // 2. Update Registrar
            console.log("Updating registrar@demo.edu role to 'registrar'...");
            await connection.execute("UPDATE users SET role = 'registrar' WHERE email = 'registrar@demo.edu'");

            // 3. Create/Update Librarian
            console.log("Creating/updating librarian@demo.edu role to 'librarian'...");
            await connection.execute(
                `INSERT INTO users (name, email, password, role, status) 
                 VALUES ('Librarian Admin', 'librarian@demo.edu', ?, 'librarian', 'active')
                 ON DUPLICATE KEY UPDATE role = 'librarian'`,
                [hashedPassword]
            );

            console.log(`=== ${dbName} ROLES ALIGNED SUCCESSFUL ===`);
            await connection.end();
        } catch (e) {
            console.error(`Failed to align roles in ${dbName}:`, e);
        }
    }
}

run();
