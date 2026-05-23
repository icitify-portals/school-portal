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

    console.log('Connected to database. Running push subscriptions migration...');

    try {
        // Create push_subscriptions table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                endpoint TEXT NOT NULL,
                p256dh TEXT NOT NULL,
                auth TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_push_user (user_id)
            )
        `);
        console.log('✅ push_subscriptions table created');

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await connection.end();
        console.log('Migration complete.');
    }
}

migrate();
