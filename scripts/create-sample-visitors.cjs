const mysql = require('mysql2/promise');

async function createSampleVisitorData() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🔧 Creating sample visitor data for testing reports...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Sample visitor data
    const sampleVisitors = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@company.com',
        phone: '08012345678',
        company: 'Tech Solutions Ltd',
        purpose: 'Meeting with Dean of Science',
        destinationType: 'faculty',
        destinationName: 'Faculty of Science',
        hostName: 'Prof. Johnson',
        hostTitle: 'Dean',
        hostDepartment: 'Science',
        hostPhone: '08098765432',
        expectedCheckIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        expectedCheckOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0),
        actualCheckIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 15),
        actualCheckOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 45),
        status: 'checked_out',
        createdBy: 1
      },
      {
        firstName: 'Mary',
        lastName: 'Johnson',
        email: 'mary.j@consulting.com',
        phone: '09023456789',
        company: 'Education Consulting',
        purpose: 'Curriculum review meeting',
        destinationType: 'department',
        destinationName: 'Computer Science',
        hostName: 'Dr. Williams',
        hostTitle: 'HOD',
        hostDepartment: 'Computer Science',
        hostPhone: '08087654321',
        expectedCheckIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
        expectedCheckOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
        actualCheckIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
        actualCheckOut: null,
        status: 'checked_in',
        createdBy: 1
      },
      {
        firstName: 'Robert',
        lastName: 'Brown',
        email: 'robert.b@vendor.com',
        phone: '08034567890',
        company: 'Office Supplies Co',
        purpose: 'Equipment delivery and setup',
        destinationType: 'unit',
        destinationName: 'Administrative Unit',
        hostName: 'Mrs. Davis',
        hostTitle: 'Admin Officer',
        hostDepartment: 'Administration',
        hostPhone: '08076543210',
        expectedCheckIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
        expectedCheckOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0),
        actualCheckIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 15),
        actualCheckOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30),
        status: 'checked_out',
        createdBy: 1
      },
      {
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.w@parent.com',
        phone: '09045678901',
        company: 'Parent Association',
        purpose: 'Meeting with Principal',
        destinationType: 'other',
        destinationName: 'Administrative Block',
        hostName: 'Mr. Thompson',
        hostTitle: 'Principal',
        hostDepartment: 'Administration',
        hostPhone: '08065432109',
        expectedCheckIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
        expectedCheckOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
        actualCheckIn: null,
        actualCheckOut: null,
        status: 'scheduled',
        createdBy: 1
      },
      {
        firstName: 'David',
        lastName: 'Lee',
        email: 'david.lee@contractor.com',
        phone: '08056789012',
        company: 'Facility Management',
        purpose: 'Maintenance inspection',
        destinationType: 'department',
        destinationName: 'Facility Management',
        hostName: 'Mr. Garcia',
        hostTitle: 'Facility Manager',
        hostDepartment: 'Facility',
        hostPhone: '08054321098',
        expectedCheckIn: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 13, 0),
        expectedCheckOut: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 17, 0),
        actualCheckIn: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 13, 15),
        actualCheckOut: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 16, 45),
        status: 'checked_out',
        createdBy: 1
      }
    ];

    // Insert sample visitors
    for (const visitor of sampleVisitors) {
      await connection.execute(`
        INSERT INTO visitors (
          firstName, lastName, email, phone, company, purpose, destinationType, 
          destinationId, destinationName, hostName, hostTitle, hostDepartment, 
          hostPhone, hostEmail, expectedCheckIn, expectedCheckOut, actualCheckIn, 
          actualCheckOut, status, createdBy, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        visitor.firstName, visitor.lastName, visitor.email, visitor.phone, visitor.company,
        visitor.purpose, visitor.destinationType, null, visitor.destinationName,
        visitor.hostName, visitor.hostTitle, visitor.hostDepartment, visitor.hostPhone,
        null, visitor.expectedCheckIn, visitor.expectedCheckOut, visitor.actualCheckIn,
        visitor.actualCheckOut, visitor.status, visitor.createdBy
      ]);
    }

    // Create access log entries
    const [visitors] = await connection.execute('SELECT id, status FROM visitors ORDER BY id DESC LIMIT 5');
    
    for (const visitor of visitors) {
      if (visitor.status === 'checked_in' || visitor.status === 'checked_out') {
        await connection.execute(`
          INSERT INTO visitor_access_log (visitorId, accessType, scannedBy, createdAt)
          VALUES (?, ?, 1, NOW())
        `, [visitor.id, visitor.status === 'checked_in' ? 'check_in' : 'check_out']);
      }
    }

    console.log('✅ Sample visitor data created successfully!');
    console.log('📊 Data created:');
    console.log('  - 5 sample visitors with different statuses');
    console.log('  - 2 visitors checked out');
    console.log('  - 1 visitor currently inside');
    console.log('  - 1 visitor scheduled');
    console.log('  - 1 visitor from yesterday');
    console.log('  - Access log entries for tracking');
    
    console.log('\n🎯 Now you can test the reports at:');
    console.log('📊 Visitor Reports: http://localhost:3000/admin/reports/visitors');
    console.log('📱 Real-time Dashboard: Shows current visitors and locations');
    console.log('📅 Daily Report: Detailed breakdown for specific dates');
    console.log('📈 Range Reports: Analytics across multiple days');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createSampleVisitorData();
