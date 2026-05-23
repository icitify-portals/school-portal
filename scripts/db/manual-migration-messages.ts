import mysql from 'mysql2/promise';

async function migrate() {
    console.log('🛠️ Starting Direct Messages table migration...');
    const connection = await mysql.createConnection('mysql://root@localhost:3306/moodledb');

    try {
        console.log('📡 Creating direct_messages table...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS direct_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,
                recipient_id INT NOT NULL,
                subject VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id),
                FOREIGN KEY (recipient_id) REFERENCES users(id)
            )
        `);
        console.log('✅ Created direct_messages table');

        console.log('🚀 Migration successful!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
