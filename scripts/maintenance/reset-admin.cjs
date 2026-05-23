const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

async function reset() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const connection = await mysql.createConnection(dbUrl);

        console.log("Updating password for admin@portal.com...");
        const [result] = await connection.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@portal.com']
        );

        if (result.affectedRows > 0) {
            console.log("Password updated successfully!");
        } else {
            console.log("User not found or update failed.");
        }

        await connection.end();
    } catch (err) {
        console.error("Error:", err);
    }
}

reset();
