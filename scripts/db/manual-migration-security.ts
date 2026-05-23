import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function migrate() {
    const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/moodledb';
    const url = new URL(dbUrl);
    const connection = await mysql.createConnection({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password || '',
        database: url.pathname.slice(1),
    });

    console.log('Connected. Running security tables migration...');

    try {
        // Activity logs table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                action VARCHAR(100) NOT NULL,
                resource VARCHAR(100) NULL,
                resource_id INT NULL,
                details TEXT NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_activity_user (user_id),
                INDEX idx_activity_action (action),
                INDEX idx_activity_created (created_at)
            )
        `);
        console.log('✅ activity_logs table created');

        // Exam security settings table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS exam_security_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                disable_copy_paste BOOLEAN DEFAULT TRUE,
                full_screen_required BOOLEAN DEFAULT TRUE,
                auto_submit_on_tab_switch BOOLEAN DEFAULT FALSE,
                randomize_questions BOOLEAN DEFAULT TRUE,
                randomize_options BOOLEAN DEFAULT TRUE,
                max_attempts INT DEFAULT 1,
                show_results_immediately BOOLEAN DEFAULT FALSE,
                ip_whitelist TEXT NULL,
                browser_lockdown BOOLEAN DEFAULT FALSE,
                webcam_proctoring BOOLEAN DEFAULT FALSE,
                screenshot_interval INT NULL,
                max_idle_time INT DEFAULT 300,
                updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                updated_by INT NULL,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ exam_security_settings table created');

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await connection.end();
        console.log('Migration complete.');
    }
}

migrate();
