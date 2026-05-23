import mysql from 'mysql2/promise';

async function migrate() {
    console.log('🛠️ Starting Notifications table migration...');
    const connection = await mysql.createConnection('mysql://root@localhost:3306/moodledb');

    try {
        console.log('📡 Creating notifications table...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
                channel ENUM('toast', 'email', 'both') DEFAULT 'both',
                is_read BOOLEAN DEFAULT FALSE,
                is_toasted BOOLEAN DEFAULT FALSE,
                link VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created notifications table');

        console.log('🚀 Migration successful!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
