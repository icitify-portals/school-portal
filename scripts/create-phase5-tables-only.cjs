const mysql = require('mysql2/promise');

async function createPhase5TablesOnly() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🚀 Creating Phase 5 Tables Only...');
    
    // Create multi_campus_coordination table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS multi_campus_coordination (
        id int AUTO_INCREMENT PRIMARY KEY,
        sourceCampusId int NOT NULL,
        destinationCampusId int NOT NULL,
        routeType enum('shuttle', 'express', 'chartered', 'emergency') NOT NULL,
        operatingHours json,
        frequencyMinutes int DEFAULT 30,
        vehicleCapacity int NOT NULL,
        driverRequirements text,
        fareStructure json,
        isActive boolean DEFAULT true,
        priorityLevel enum('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        coordinationRules json,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_coordination_source (sourceCampusId),
        INDEX idx_coordination_destination (destinationCampusId),
        INDEX idx_coordination_active (isActive),
        INDEX idx_coordination_priority (priorityLevel)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create campus_locations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS campus_locations (
        id int AUTO_INCREMENT PRIMARY KEY,
        campusId int NOT NULL,
        locationName varchar(255) NOT NULL,
        locationType enum('main_gate', 'bus_stop', 'parking_lot', 'student_center', 'faculty_building', 'hostel', 'library', 'sports_complex', 'admin_block') NOT NULL,
        latitude decimal(10,8) NOT NULL,
        longitude decimal(11,8) NOT NULL,
        address varchar(255),
        capacity int,
        facilities text,
        operatingHours json,
        accessibilityFeatures text,
        isActive boolean DEFAULT true,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_locations_campus (campusId),
        INDEX idx_locations_type (locationType),
        INDEX idx_locations_active (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create global_transportation_settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS global_transportation_settings (
        id int AUTO_INCREMENT PRIMARY KEY,
        settingKey varchar(255) NOT NULL,
        settingValue text NOT NULL,
        settingType enum('string', 'number', 'boolean', 'json') NOT NULL,
        category varchar(100) NOT NULL,
        description text,
        isActive boolean DEFAULT true,
        isGlobal boolean DEFAULT true,
        campusId int,
        lastModifiedBy int NOT NULL,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_settings_key (settingKey),
        INDEX idx_settings_category (category),
        INDEX idx_settings_global (isGlobal),
        INDEX idx_settings_campus (campusId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create transportation_api_keys table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transportation_api_keys (
        id int AUTO_INCREMENT PRIMARY KEY,
        keyName varchar(255) NOT NULL,
        apiKey varchar(500) NOT NULL,
        apiSecret varchar(500) NOT NULL,
        permissions json NOT NULL,
        rateLimitPerHour int DEFAULT 1000,
        isActive boolean DEFAULT true,
        expiresAt datetime,
        lastUsedAt datetime,
        usageCount int DEFAULT 0,
        createdBy int NOT NULL,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_api_keys_key (apiKey),
        INDEX idx_api_keys_active (isActive),
        INDEX idx_api_keys_expires (expiresAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create emergency_transportation table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS emergency_transportation (
        id int AUTO_INCREMENT PRIMARY KEY,
        emergencyType enum('medical', 'security', 'natural_disaster', 'accident', 'fire', 'other') NOT NULL,
        severityLevel enum('low', 'medium', 'high', 'critical') NOT NULL,
        campusId int NOT NULL,
        locationId int,
        description text NOT NULL,
        requestedBy int NOT NULL,
        approvedBy int,
        vehicleId int,
        driverId int,
        dispatchTime datetime,
        arrivalTime datetime,
        completionTime datetime,
        status enum('requested', 'approved', 'dispatched', 'in_progress', 'completed', 'cancelled') DEFAULT 'requested',
        priorityLevel enum('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        passengersInvolved text,
        specialRequirements text,
        costEstimate decimal(10,2),
        actualCost decimal(10,2),
        notes text,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_emergency_type (emergencyType),
        INDEX idx_emergency_severity (severityLevel),
        INDEX idx_emergency_campus (campusId),
        INDEX idx_emergency_status (status),
        INDEX idx_emergency_priority (priorityLevel),
        INDEX idx_emergency_date (dispatchTime)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create transportation_performance_metrics table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transportation_performance_metrics (
        id int AUTO_INCREMENT PRIMARY KEY,
        metricType enum('kpi', 'efficiency', 'safety', 'satisfaction', 'financial', 'operational') NOT NULL,
        metricName varchar(255) NOT NULL,
        metricValue decimal(15,4),
        metricUnit varchar(50),
        targetValue decimal(15,4),
        variancePercentage decimal(5,2),
        periodStart date NOT NULL,
        periodEnd date NOT NULL,
        campusId int,
        vehicleId int,
        driverId int,
        routeId int,
        benchmarkValue decimal(15,4),
        trendDirection enum('up', 'down', 'stable') NOT NULL,
        notes text,
        calculatedAt timestamp DEFAULT CURRENT_TIMESTAMP,
        calculatedBy int NOT NULL,
        
        INDEX idx_metrics_type (metricType),
        INDEX idx_metrics_name (metricName),
        INDEX idx_metrics_period (periodStart, periodEnd),
        INDEX idx_metrics_campus (campusId),
        INDEX idx_metrics_vehicle (vehicleId),
        INDEX idx_metrics_driver (driverId),
        INDEX idx_metrics_route (routeId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Phase 5 Tables Created Successfully!');
    
  } catch (error) {
    console.error('❌ Error creating Phase 5 tables:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createPhase5TablesOnly();
