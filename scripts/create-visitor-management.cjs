const mysql = require('mysql2/promise');

async function createVisitorManagementSystem() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🔧 Creating comprehensive visitor management system...');
    
    // Create visitors table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS visitors (
        id int AUTO_INCREMENT PRIMARY KEY,
        firstName varchar(100) NOT NULL,
        lastName varchar(100) NOT NULL,
        email varchar(255),
        phone varchar(20),
        company varchar(255),
        purpose text NOT NULL,
        destinationType enum('faculty', 'department', 'unit', 'person', 'other') NOT NULL,
        destinationId int,
        destinationName varchar(255) NOT NULL,
        hostName varchar(255) NOT NULL,
        hostTitle varchar(255),
        hostDepartment varchar(255),
        hostPhone varchar(20),
        hostEmail varchar(255),
        expectedCheckIn datetime NOT NULL,
        expectedCheckOut datetime,
        actualCheckIn datetime,
        actualCheckOut datetime,
        status enum('scheduled', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'scheduled',
        qrCode varchar(500),
        photoUrl varchar(500),
        idType varchar(50),
        idNumber varchar(100),
        vehicleInfo text,
        notes text,
        createdBy int NOT NULL,
        approvedBy int,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_visitors_status (status),
        INDEX idx_visitors_destination (destinationType, destinationId),
        INDEX idx_visitors_dates (expectedCheckIn, expectedCheckOut),
        INDEX idx_visitors_host (hostName),
        INDEX idx_visitors_qr (qrCode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    // Create visitor_access_log table for detailed tracking
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS visitor_access_log (
        id int AUTO_INCREMENT PRIMARY KEY,
        visitorId int NOT NULL,
        accessType enum('check_in', 'check_out', 'exit_denied', 'security_alert') NOT NULL,
        gatewayLocation varchar(255),
        scannedBy int NOT NULL,
        ipAddress varchar(45),
        userAgent text,
        location varchar(255), -- GPS coordinates
        photoUrl varchar(500),
        notes text,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_visitor_access_visitor (visitorId),
        INDEX idx_visitor_access_type (accessType),
        INDEX idx_visitor_access_dates (createdAt),
        INDEX idx_visitor_access_scanner (scannedBy)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    // Create visitor_destinations table for managing approved destinations
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS visitor_destinations (
        id int AUTO_INCREMENT PRIMARY KEY,
        destinationType enum('faculty', 'department', 'unit', 'building', 'other') NOT NULL,
        destinationId int,
        name varchar(255) NOT NULL,
        description text,
        requiresApproval boolean DEFAULT false,
        approvalLevel enum('none', 'staff', 'head_of_department', 'dean', 'registrar') DEFAULT 'none',
        allowedHours varchar(100), -- e.g., "08:00-17:00"
        maxDurationHours int DEFAULT 8,
        isActive boolean DEFAULT true,
        createdBy int NOT NULL,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY uk_destination (destinationType, destinationId),
        INDEX idx_destinations_type (destinationType),
        INDEX idx_destinations_active (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    // Add foreign key constraints
    await connection.execute(`
      ALTER TABLE visitors 
        ADD CONSTRAINT fk_visitors_created_by 
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
    `);
    
    await connection.execute(`
      ALTER TABLE visitors 
        ADD CONSTRAINT fk_visitors_approved_by 
        FOREIGN KEY (approvedBy) REFERENCES users(id) ON DELETE SET NULL
    `);
    
    await connection.execute(`
      ALTER TABLE visitor_access_log 
        ADD CONSTRAINT fk_visitor_access_visitor 
        FOREIGN KEY (visitorId) REFERENCES visitors(id) ON DELETE CASCADE
    `);
    
    await connection.execute(`
      ALTER TABLE visitor_access_log 
        ADD CONSTRAINT fk_visitor_access_scanner 
        FOREIGN KEY (scannedBy) REFERENCES users(id) ON DELETE CASCADE
    `);
    
    await connection.execute(`
      ALTER TABLE visitor_destinations 
        ADD CONSTRAINT fk_visitor_destinations_created_by 
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
    `);
    
    // Insert default destinations
    await connection.execute(`
      INSERT IGNORE INTO visitor_destinations 
      (destinationType, destinationId, name, description, requiresApproval, approvalLevel, createdBy)
      SELECT 'faculty', f.id, f.name, 
        CASE WHEN f.name IN ('Administration', 'Registry', 'Security') THEN true ELSE false END,
        CASE WHEN f.name IN ('Administration', 'Registry') THEN 'dean' ELSE 'none' END,
        1
      FROM faculties f
    `);
    
    await connection.execute(`
      INSERT IGNORE INTO visitor_destinations 
      (destinationType, destinationId, name, description, requiresApproval, approvalLevel, createdBy)
      SELECT 'department', d.id, d.name, 
        CASE WHEN d.name IN ('Registry', 'Security', 'Finance') THEN true ELSE false END,
        CASE WHEN d.name IN ('Registry', 'Security') THEN 'head_of_department' ELSE 'none' END,
        1
      FROM departments d
    `);
    
    await connection.execute(`
      INSERT IGNORE INTO visitor_destinations 
      (destinationType, destinationId, name, description, requiresApproval, approvalLevel, createdBy)
      VALUES 
        ('other', 1, 'Main Gate', 'Primary entrance/exit point', false, 'none', 1),
        ('other', 2, 'Back Gate', 'Secondary entrance/exit point', false, 'none', 1),
        ('other', 3, 'Emergency Exit', 'Emergency exit only', true, 'dean', 1)
    `);
    
    console.log('✅ Visitor management system created successfully!');
    console.log('📋 Tables created:');
    console.log('  - visitors (main visitor records)');
    console.log('  - visitor_access_log (detailed access tracking)');
    console.log('  - visitor_destinations (approved destinations)');
    console.log('🏢 Default destinations populated from faculties and departments');
    
  } catch (error) {
    console.error('❌ Error creating visitor management system:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createVisitorManagementSystem();
