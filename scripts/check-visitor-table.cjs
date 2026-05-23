const mysql = require('mysql2/promise');

async function checkExistingVisitorTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🔍 Checking existing visitor table structure...');
    
    // Get table structure
    const [structure] = await connection.execute(`DESCRIBE visitors`);
    console.log('Current visitors table columns:');
    structure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type}`);
    });
    
    // Get sample data
    const [sample] = await connection.execute(`SELECT * FROM visitors LIMIT 3`);
    console.log('\nSample visitor records:');
    sample.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, record);
    });
    
  } catch (error) {
    console.error('❌ Error checking visitor table:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkExistingVisitorTable();
