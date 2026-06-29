import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";
const databases = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

async function run() {
    const email = "dev@icitify.com";
    const passwordRaw = "developer123";
    const passwordHash = await bcrypt.hash(passwordRaw, 10);

    for (const dbName of databases) {
        console.log(`\n--- Creating developer in ${dbName} ---`);
        try {
            const parsedUrl = new URL(baseUri);
            parsedUrl.pathname = `/${dbName}`;
            const connection = await mysql.createConnection(parsedUrl.toString());

            const [existing]: any = await connection.query(`SELECT id FROM users WHERE email = ?`, [email]);
            if (existing.length > 0) {
                console.log(`Developer account already exists in ${dbName}. Updating password...`);
                await connection.execute(`UPDATE users SET password = ?, role = 'icitify_dev' WHERE email = ?`, [passwordHash, email]);
            } else {
                await connection.execute(
                    `INSERT INTO users (name, email, password, role, status, created_at)
                     VALUES ('System Developer', ?, ?, 'icitify_dev', 'active', NOW())`,
                    [email, passwordHash]
                );
                console.log(`Developer account created in ${dbName}.`);
            }

            await connection.end();
        } catch (e: any) {
            console.error(`Error in ${dbName}: ${e.message}`);
        }
    }

    console.log(`\n✅ Done! Login across any tenant with:\nEmail: ${email}\nPassword: ${passwordRaw}`);
}

run();
