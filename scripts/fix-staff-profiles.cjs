const mysql = require('mysql2/promise');

async function fixStaffProfilesSchema() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🔧 Fixing staff_profiles schema...');
    
    // Check if signature_url column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'moodledb' 
      AND TABLE_NAME = 'staff_profiles' 
      AND COLUMN_NAME = 'signature_url'
    `);
    
    if (columns.length === 0) {
      // Add the missing columns
      await connection.execute(`
        ALTER TABLE staff_profiles 
        ADD COLUMN signature_url VARCHAR(255) AFTER expertise,
        ADD COLUMN is_signature_digital BOOLEAN DEFAULT false AFTER signature_url
      `);
      console.log('✅ signature_url and is_signature_digital columns added to staff_profiles table');
    } else {
      console.log('✅ signature_url column already exists in staff_profiles table');
    }
    
  } catch (error) {
    console.error('❌ Error fixing staff_profiles schema:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixStaffProfilesSchema();
