import mysql from 'mysql2/promise';

async function migrate() {
    console.log('🛠️ Starting JAMB candidates migration...');
    const connection = await mysql.createConnection('mysql://root@localhost:3306/moodledb');

    try {
        console.log('📡 Adding missing columns to jamb_candidates table...');

        // Add email
        await connection.query(`
            ALTER TABLE jamb_candidates 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255) AFTER dob
        `);
        console.log('✅ Added email column');

        // Add phone
        await connection.query(`
            ALTER TABLE jamb_candidates 
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20) AFTER email
        `);
        console.log('✅ Added phone column');

        // Add unit_id
        await connection.query(`
            ALTER TABLE jamb_candidates 
            ADD COLUMN IF NOT EXISTS unit_id INT AFTER claimed_user_id
        `);
        console.log('✅ Added unit_id column');

        console.log('🚀 Migration successful!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
