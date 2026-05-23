const mysql = require('mysql2/promise');

async function addImageUrlColumn() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🔧 Adding imageUrl column to users table...');
    
    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'moodledb' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'image_url'
    `);
    
    if (columns.length === 0) {
      // Add the column
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN image_url VARCHAR(255) AFTER phone
      `);
      console.log('✅ imageUrl column added to users table');
    } else {
      console.log('✅ imageUrl column already exists in users table');
    }
    
  } catch (error) {
    console.error('❌ Error adding imageUrl column:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addImageUrlColumn();
