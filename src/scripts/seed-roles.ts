import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const roles = [
    'admin', 'staff', 'student', 'dvc', 'healthadmin', 'applicant', 
    'fresher', 'superadmin', 'parent', 'icitify_dev', 'bursar', 
    'registrar', 'librarian', 'hod', 'dean', 'admission_officer'
];

async function seedRoles() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal");
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    console.log("Seeding Role Test Accounts...");
    const createdAccounts = [];

    for (const role of roles) {
        const email = `${role}@test.com`;
        const name = `${role.charAt(0).toUpperCase() + role.slice(1)} Tester`;

        // Check if exists
        const [rows]: any = await connection.query("SELECT id FROM users WHERE email = ?", [email]);
        
        if (rows.length === 0) {
            await connection.execute(
                "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, 'active')",
                [name, email, hashedPassword, role]
            );
            console.log(`✅ Created: ${email}`);
        } else {
            // Ensure password is correct and role is correct
            await connection.execute(
                "UPDATE users SET password = ?, role = ?, status = 'active' WHERE email = ?",
                [hashedPassword, role, email]
            );
            console.log(`✅ Updated: ${email}`);
        }

        createdAccounts.push({ role, email, password: "Password123!" });
    }

    await connection.end();
    console.log("\nAll accounts generated successfully!\n");
}

seedRoles().catch(console.error);
