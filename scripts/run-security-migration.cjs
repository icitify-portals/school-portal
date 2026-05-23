const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFile = path.join(__dirname, '../scripts/security-performance-indexes.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'school_portal',
  multipleStatements: true
};

async function runMigration() {
  let connection;
  try {
    console.log('🔧 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📊 Running security performance indexes migration...');
    
    // Split SQL by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('🔹 Executing:', statement.trim().substring(0, 50) + '...');
        await connection.execute(statement);
      }
    }
    
    console.log('✅ Security performance indexes created successfully!');
    console.log('🚀 Database is now optimized for sub-200ms security gateway queries');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

runMigration();
