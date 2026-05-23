const mysql = require('mysql2/promise');

async function checkStudentsTableAndInsertData() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🔍 Checking students table structure...');
    
    // Get students table structure
    const [structure] = await connection.execute('DESCRIBE students');
    console.log('Students table columns:');
    structure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type}`);
    });
    
    // Get sample students
    const [students] = await connection.execute('SELECT * FROM students LIMIT 5');
    console.log('\nSample students:');
    students.forEach((student, index) => {
      console.log(`Student ${index + 1}:`, student);
    });
    
    // Insert sample student transport registrations with correct columns
    if (students.length > 0) {
      console.log('\n📝 Inserting sample student transport registrations...');
      
      // Get routes
      const [routes] = await connection.execute('SELECT id, name FROM routes LIMIT 3');
      
      const today = new Date();
      const validFrom = today.toISOString().split('T')[0];
      const validTo = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Insert registrations
      for (let i = 0; i < Math.min(students.length, routes.length); i++) {
        await connection.execute(`
          INSERT INTO student_transport_registrations (studentId, routeId, registrationType, 
            validFrom, validTo, fareAmount, paymentStatus, paymentReference, boardingPoint, 
            alightingPoint, parentContact, emergencyContact)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          students[i].id,
          routes[i].id,
          'monthly',
          validFrom,
          validTo,
          3000.00,
          'paid',
          'TXN' + Date.now() + students[i].id,
          'Main Gate',
          routes[i].name.includes('Shuttle') ? 'Library' : 'Science Faculty',
          '080' + String(Math.floor(Math.random() * 90000000) + 10000000),
          '090' + String(Math.floor(Math.random() * 90000000) + 10000000)
        ]);
      }
      
      console.log('✅ Sample student transport registrations inserted successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkStudentsTableAndInsertData();
