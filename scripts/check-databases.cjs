const mysql = require('mysql2/promise');

async function checkDatabases() {
  let connection;
  try {
    // Connect without specifying database first
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    
    console.log('🔍 Checking available databases...');
    const [rows] = await connection.execute('SHOW DATABASES');
    
    console.log('📊 Available databases:');
    if (Array.isArray(rows)) {
      const possibleDbs = [];
      rows.forEach(row => {
        // MySQL SHOW DATABASES returns objects with Database property
        const database = row.Database || row[0] || 'unknown';
        console.log(`  - ${database}`);
        if (database.includes('school') || database.includes('portal') || database.includes('moodle')) {
          possibleDbs.push(database);
        }
      });
      
      if (possibleDbs.length > 0) {
        console.log('\n🎯 Possible target databases found:');
        possibleDbs.forEach(db => console.log(`  - ${db}`));
      }
    } else {
      console.log('  - No databases found or unexpected response format');
      console.log('  Response type:', typeof rows);
      console.log('  Response:', rows);
    }
    
  } catch (error) {
    console.error('❌ Error checking databases:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabases();
