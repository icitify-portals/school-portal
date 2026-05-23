import mysql from 'mysql2/promise';

async function migrate() {
    console.log('🛠️ Starting JAMB & NIN extra columns migration...');
    const connection = await mysql.createConnection('mysql://root@localhost:3306/moodledb');

    try {
        console.log('📡 Adding missing columns to jamb_candidates and students tables...');

        // 1. jamb_candidates: image_url
        await connection.query(`
            ALTER TABLE jamb_candidates 
            ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) AFTER score
        `);
        console.log('✅ Added image_url to jamb_candidates');

        // 2. students: image_url
        await connection.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) AFTER dob
        `);
        console.log('✅ Added image_url to students');

        // 3. students: is_profile_locked
        await connection.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS is_profile_locked BOOLEAN DEFAULT FALSE AFTER image_url
        `);
        console.log('✅ Added is_profile_locked to students');

        // 4. students: nin
        await connection.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS nin VARCHAR(11) AFTER is_profile_locked
        `);
        console.log('✅ Added nin to students');

        // 5. students: nin_verified
        await connection.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS nin_verified BOOLEAN DEFAULT FALSE AFTER nin
        `);
        console.log('✅ Added nin_verified to students');

        console.log('🚀 Migration successful!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
