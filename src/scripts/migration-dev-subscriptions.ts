import "dotenv/config";
import mysql from "mysql2/promise";

const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";
const databases = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

async function run() {
    for (const dbName of databases) {
        console.log(`\n--- Migrating ${dbName} ---`);
        try {
            const parsedUrl = new URL(baseUri);
            parsedUrl.pathname = `/${dbName}`;
            const connection = await mysql.createConnection(parsedUrl.toString());

            await connection.execute(`
                CREATE TABLE IF NOT EXISTS developer_subscription_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    fee_name VARCHAR(255) NOT NULL DEFAULT 'Platform Subscription Fee',
                    fee_amount DECIMAL(12, 2) NOT NULL,
                    billing_cycle ENUM('per_term', 'per_semester', 'per_annum') NOT NULL DEFAULT 'per_term',
                    is_active BOOLEAN DEFAULT TRUE,
                    updated_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
                )
            `);
            console.log(`✅ Created developer_subscription_settings`);

            await connection.execute(`
                CREATE TABLE IF NOT EXISTS developer_subscriptions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    academic_session_id INT NOT NULL,
                    term_or_semester INT,
                    amount_due DECIMAL(12, 2) NOT NULL,
                    amount_paid DECIMAL(12, 2) DEFAULT 0.00,
                    status ENUM('unpaid', 'part_paid', 'paid', 'exempt') DEFAULT 'unpaid',
                    payment_reference VARCHAR(100),
                    paid_by ENUM('student', 'parent', 'school_bulk'),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE
                )
            `);
            console.log(`✅ Created developer_subscriptions`);

            await connection.end();
        } catch (e: any) {
            console.error(`❌ Error migrating ${dbName}: ${e.message}`);
        }
    }
    console.log(`\n🎉 Migration Complete!`);
}

run();
