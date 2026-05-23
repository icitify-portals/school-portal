// Test script to verify Security Gateway functionality
console.log('🧪 Testing Security Gateway Components...');

// Test 1: Check if required modules are available
try {
  const mysql = require('mysql2/promise');
  console.log('✅ mysql2 module available');
} catch (error) {
  console.log('❌ mysql2 module missing:', error.message);
}

try {
  const { SignJWT } = require('jose');
  console.log('✅ jose module available');
} catch (error) {
  console.log('❌ jose module missing:', error.message);
}

// Test 2: Check database connection
async function testDatabase() {
  try {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    // Test security audit table
    const [result] = await connection.execute('SELECT COUNT(*) FROM security_audit');
    console.log(`✅ Database connection successful - ${result[0]['COUNT(*)']} audit records`);
    
    await connection.end();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
}

testDatabase();

// Test 3: Check if development server is responding
const http = require('http');

function checkServer() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/security/gateway',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server responding - Status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('🎯 Security Gateway is ready for testing!');
      console.log('📱 URL: http://localhost:3000/security/gateway');
      console.log('🔧 Features available:');
      console.log('  - Live QR scanning');
      console.log('  - Tamper-proof JWT passes');
      console.log('  - Automatic blocker for overdue books');
      console.log('  - Real-time audit logging');
    } else {
      console.log('⚠️  Server responded but may have issues');
    }
  });

  req.on('error', (err) => {
    console.log('❌ Server not responding:', err.message);
    console.log('💡 Make sure the development server is running with: npm run dev');
  });

  req.on('timeout', () => {
    console.log('❌ Server request timed out');
    req.destroy();
  });

  req.end();
}

setTimeout(checkServer, 2000);
