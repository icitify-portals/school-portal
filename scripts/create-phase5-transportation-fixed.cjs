const mysql = require('mysql2/promise');

async function createPhase5TransportationTables() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🚀 Starting Phase 5 Transportation Implementation...');
    
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

    // Create inter_campus_trips table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inter_campus_trips (
        id int AUTO_INCREMENT PRIMARY KEY,
        coordinationId int NOT NULL,
        vehicleId int NOT NULL,
        driverId int NOT NULL,
        tripDate date NOT NULL,
        departureTime datetime NOT NULL,
        estimatedArrivalTime datetime NOT NULL,
        actualArrivalTime datetime,
        sourceLocationId int NOT NULL,
        destinationLocationId int NOT NULL,
        passengerCount int DEFAULT 0,
        maxCapacity int NOT NULL,
        fareAmount decimal(8,2),
        status enum('scheduled', 'in_progress', 'completed', 'cancelled', 'delayed') DEFAULT 'scheduled',
        delayReason text,
        weatherConditions varchar(100),
        trafficConditions varchar(100),
        incidents text,
        driverNotes text,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_inter_campus_coordination (coordinationId),
        INDEX idx_inter_campus_vehicle (vehicleId),
        INDEX idx_inter_campus_driver (driverId),
        INDEX idx_inter_campus_date (tripDate),
        INDEX idx_inter_campus_status (status)
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

    // Create transportation_audit_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transportation_audit_logs (
        id int AUTO_INCREMENT PRIMARY KEY,
        userId int NOT NULL,
        action varchar(255) NOT NULL,
        module varchar(100) NOT NULL,
        recordId int,
        oldValues json,
        newValues json,
        ipAddress varchar(45),
        userAgent text,
        timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
        sessionId varchar(255),
        campusId int,
        
        INDEX idx_audit_user (userId),
        INDEX idx_audit_module (module),
        INDEX idx_audit_action (action),
        INDEX idx_audit_timestamp (timestamp),
        INDEX idx_audit_campus (campusId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create transportation_reports table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transportation_reports (
        id int AUTO_INCREMENT PRIMARY KEY,
        reportName varchar(255) NOT NULL,
        reportType enum('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom') NOT NULL,
        category varchar(100) NOT NULL,
        parameters json,
        generatedAt datetime NOT NULL,
        generatedBy int NOT NULL,
        filePath varchar(500),
        fileSize int,
        format enum('pdf', 'excel', 'csv', 'json') NOT NULL,
        status enum('generating', 'completed', 'failed') DEFAULT 'generating',
        errorMessage text,
        downloadCount int DEFAULT 0,
        expiresAt datetime,
        campusId int,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_reports_type (reportType),
        INDEX idx_reports_category (category),
        INDEX idx_reports_status (status),
        INDEX idx_reports_campus (campusId),
        INDEX idx_reports_generated (generatedAt)
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

    // Create transportation_integration_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transportation_integration_logs (
        id int AUTO_INCREMENT PRIMARY KEY,
        integrationType enum('payment_gateway', 'gps_provider', 'notification_service', 'analytics_service', 'external_api') NOT NULL,
        serviceName varchar(255) NOT NULL,
        endpoint varchar(500),
        requestType enum('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL,
        requestData json,
        responseData json,
        statusCode int,
        responseTime int,
        success boolean NOT NULL,
        errorMessage text,
        requestId varchar(255),
        userId int,
        timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_integration_type (integrationType),
        INDEX idx_integration_service (serviceName),
        INDEX idx_integration_success (success),
        INDEX idx_integration_timestamp (timestamp),
        INDEX idx_integration_request (requestId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Insert sample Phase 5 data
    await insertPhase5SampleData(connection);

    console.log('✅ Phase 5 Transportation Tables Created Successfully!');
    console.log('📋 New Enterprise Tables Added:');
    console.log('  - multi_campus_coordination (multi-campus route coordination)');
    console.log('  - campus_locations (campus location management)');
    console.log('  - inter_campus_trips (inter-campus trip management)');
    console.log('  - global_transportation_settings (global configuration)');
    console.log('  - transportation_api_keys (API key management)');
    console.log('  - transportation_audit_logs (comprehensive audit trail)');
    console.log('  - transportation_reports (automated report generation)');
    console.log('  - emergency_transportation (emergency transport services)');
    console.log('  - transportation_performance_metrics (KPI tracking)');
    console.log('  - transportation_integration_logs (integration monitoring)');
    
  } catch (error) {
    console.error('❌ Error creating Phase 5 tables:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function insertPhase5SampleData(connection) {
  console.log('📝 Inserting Phase 5 sample data...');
  
  // Get existing data
  const [campuses] = await connection.execute('SELECT id, name FROM institutional_units WHERE type = "campus" LIMIT 3');
  const [vehicles] = await connection.execute('SELECT id, registrationNumber FROM vehicles LIMIT 3');
  const [drivers] = await connection.execute('SELECT id FROM drivers LIMIT 3');
  const [users] = await connection.execute('SELECT id FROM users WHERE role IN ("admin", "transport_manager") LIMIT 2');
  const [routes] = await connection.execute('SELECT id FROM routes LIMIT 3');

  // Insert sample campus locations
  const campusLocations = [
    {
      campusId: campuses[0]?.id,
      locationName: 'Main Gate - Campus A',
      locationType: 'main_gate',
      latitude: 7.3964,
      longitude: 3.9170,
      address: 'Main Campus Entrance, Campus A',
      capacity: 100,
      facilities: JSON.stringify(['security_post', 'waiting_area', 'information_board']),
      operatingHours: JSON.stringify({ open: '06:00', close: '22:00' }),
      accessibilityFeatures: 'Wheelchair ramp, tactile paving'
    },
    {
      campusId: campuses[0]?.id,
      locationName: 'Student Center - Campus A',
      locationType: 'student_center',
      latitude: 7.3984,
      longitude: 3.9180,
      address: 'Student Union Building, Campus A',
      capacity: 200,
      facilities: JSON.stringify(['restaurant', 'bookstore', 'lounge', 'atm']),
      operatingHours: JSON.stringify({ open: '08:00', close: '20:00' }),
      accessibilityFeatures: 'Elevator access, wheelchair accessible'
    },
    {
      campusId: campuses[1]?.id,
      locationName: 'Main Gate - Campus B',
      locationType: 'main_gate',
      latitude: 7.4064,
      longitude: 3.9270,
      address: 'Main Campus Entrance, Campus B',
      capacity: 80,
      facilities: JSON.stringify(['security_post', 'waiting_area']),
      operatingHours: JSON.stringify({ open: '07:00', close: '21:00' }),
      accessibilityFeatures: 'Wheelchair ramp'
    },
    {
      campusId: campuses[1]?.id,
      locationName: 'Library - Campus B',
      locationType: 'library',
      latitude: 7.4084,
      longitude: 3.9280,
      address: 'Central Library, Campus B',
      capacity: 150,
      facilities: JSON.stringify(['study_areas', 'computer_lab', 'printing']),
      operatingHours: JSON.stringify({ open: '08:00', close: '22:00' }),
      accessibilityFeatures: 'Full wheelchair access, assistive technology'
    }
  ];

  for (const location of campusLocations) {
    if (location.campusId) {
      await connection.execute(`
        INSERT INTO campus_locations (campusId, locationName, locationType, 
          latitude, longitude, address, capacity, facilities, operatingHours, accessibilityFeatures, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        location.campusId, location.locationName, location.locationType,
        location.latitude, location.longitude, location.address || null, location.capacity || null,
        JSON.stringify(location.facilities), JSON.stringify(location.operatingHours), location.accessibilityFeatures || null,
        true
      ]);
    }
  }

  // Insert sample multi-campus coordination
  const coordination = [
    {
      sourceCampusId: campuses[0]?.id,
      destinationCampusId: campuses[1]?.id,
      routeType: 'shuttle',
      operatingHours: JSON.stringify({ 
        weekday: { start: '07:00', end: '19:00' },
        weekend: { start: '08:00', end: '18:00' }
      }),
      frequencyMinutes: 30,
      vehicleCapacity: 16,
      driverRequirements: 'Valid driver license, 2+ years experience',
      fareStructure: JSON.stringify({
        students: 100,
        staff: 150,
        visitors: 200,
        currency: 'NGN'
      }),
      priorityLevel: 'high',
      coordinationRules: JSON.stringify({
        maxWaitTime: 15,
        minCapacity: 4,
        weatherExceptions: true,
        emergencyPriority: true
      })
    },
    {
      sourceCampusId: campuses[1]?.id,
      destinationCampusId: campuses[0]?.id,
      routeType: 'express',
      operatingHours: JSON.stringify({ 
        weekday: { start: '08:00', end: '18:00' },
        weekend: { start: '09:00', end: '17:00' }
      }),
      frequencyMinutes: 45,
      vehicleCapacity: 12,
      driverRequirements: 'Valid driver license, 3+ years experience, clean record',
      fareStructure: JSON.stringify({
        students: 120,
        staff: 180,
        visitors: 250,
        currency: 'NGN'
      }),
      priorityLevel: 'medium',
      coordinationRules: JSON.stringify({
        maxWaitTime: 20,
        minCapacity: 6,
        weatherExceptions: false,
        emergencyPriority: true
      })
    }
  ];

  for (const coord of coordination) {
    if (coord.sourceCampusId && coord.destinationCampusId) {
      await connection.execute(`
        INSERT INTO multi_campus_coordination (sourceCampusId, destinationCampusId, 
          routeType, operatingHours, frequencyMinutes, vehicleCapacity, driverRequirements, 
          fareStructure, priorityLevel, coordinationRules)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        coord.sourceCampusId, coord.destinationCampusId, coord.routeType,
        JSON.stringify(coord.operatingHours), coord.frequencyMinutes, coord.vehicleCapacity,
        coord.driverRequirements || null, JSON.stringify(coord.fareStructure), coord.priorityLevel,
        JSON.stringify(coord.coordinationRules)
      ]);
    }
  }

  // Insert sample inter-campus trips
  const interCampusTrips = [
    {
      coordinationId: 1,
      vehicleId: vehicles[0]?.id,
      driverId: drivers[0]?.id,
      tripDate: new Date().toISOString().split('T')[0],
      departureTime: new Date(),
      estimatedArrivalTime: new Date(Date.now() + 45 * 60 * 1000),
      sourceLocationId: 1,
      destinationLocationId: 3,
      passengerCount: 8,
      maxCapacity: 16,
      fareAmount: 100.00,
      status: 'in_progress',
      weatherConditions: 'clear',
      trafficConditions: 'moderate'
    },
    {
      coordinationId: 2,
      vehicleId: vehicles[1]?.id,
      driverId: drivers[1]?.id,
      tripDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      estimatedArrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      sourceLocationId: 3,
      destinationLocationId: 2,
      passengerCount: 0,
      maxCapacity: 12,
      fareAmount: 120.00,
      status: 'scheduled'
    }
  ];

  for (const trip of interCampusTrips) {
    if (trip.vehicleId && trip.driverId) {
      await connection.execute(`
        INSERT INTO inter_campus_trips (coordinationId, vehicleId, driverId, tripDate, 
          departureTime, estimatedArrivalTime, sourceLocationId, destinationLocationId, 
          passengerCount, maxCapacity, fareAmount, status, weatherConditions, trafficConditions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        trip.coordinationId, trip.vehicleId, trip.driverId, trip.tripDate,
        trip.departureTime, trip.estimatedArrivalTime, trip.sourceLocationId,
        trip.destinationLocationId, trip.passengerCount, trip.maxCapacity,
        trip.fareAmount, trip.status, trip.weatherConditions, trip.trafficConditions
      ]);
    }
  }

  // Insert sample global settings
  const globalSettings = [
    {
      settingKey: 'global_fare_currency',
      settingValue: 'NGN',
      settingType: 'string',
      category: 'financial',
      description: 'Default currency for all transportation fares',
      isGlobal: true
    },
    {
      settingKey: 'max_booking_days_advance',
      settingValue: '30',
      settingType: 'number',
      category: 'booking',
      description: 'Maximum days in advance for transportation bookings',
      isGlobal: true
    },
    {
      settingKey: 'emergency_response_time_minutes',
      settingValue: '15',
      settingType: 'number',
      category: 'emergency',
      description: 'Target response time for emergency transportation requests',
      isGlobal: true
    }
  ];

  for (const setting of globalSettings) {
    if (users[0]?.id) {
      await connection.execute(`
        INSERT INTO global_transportation_settings (settingKey, settingValue, 
          settingType, category, description, isGlobal, lastModifiedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        setting.settingKey, setting.settingValue, setting.settingType,
        setting.category, setting.description, setting.isGlobal, users[0].id
      ]);
    }
  }

  // Insert sample API keys
  const apiKeys = [
    {
      keyName: 'Mobile App API Key',
      apiKey: 'tk_mob_' + Date.now() + '_abc123',
      apiSecret: 'sk_mob_' + Date.now() + '_def456',
      permissions: JSON.stringify(['read:vehicles', 'read:routes', 'create:bookings', 'read:trips']),
      rateLimitPerHour: 5000,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      createdBy: users[0]?.id
    },
    {
      keyName: 'GPS Provider API Key',
      apiKey: 'tk_gps_' + Date.now() + '_ghi789',
      apiSecret: 'sk_gps_' + Date.now() + '_jkl012',
      permissions: JSON.stringify(['write:gps', 'read:vehicles', 'read:trips']),
      rateLimitPerHour: 10000,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdBy: users[0]?.id
    }
  ];

  for (const apiKey of apiKeys) {
    if (apiKey.createdBy) {
      await connection.execute(`
        INSERT INTO transportation_api_keys (keyName, apiKey, apiSecret, 
          permissions, rateLimitPerHour, expiresAt, createdBy)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        apiKey.keyName, apiKey.apiKey, apiKey.apiSecret,
        apiKey.permissions, apiKey.rateLimitPerHour, apiKey.expiresAt, apiKey.createdBy
      ]);
    }
  }

  // Insert sample emergency transportation requests
  const emergencyRequests = [
    {
      emergencyType: 'medical',
      severityLevel: 'high',
      campusId: campuses[0]?.id,
      locationId: 2,
      description: 'Student requires immediate medical attention - allergic reaction',
      requestedBy: users[0]?.id,
      approvedBy: users[1]?.id,
      vehicleId: vehicles[2]?.id,
      driverId: drivers[2]?.id,
      dispatchTime: new Date(Date.now() - 30 * 60 * 1000),
      arrivalTime: new Date(Date.now() - 15 * 60 * 1000),
      completionTime: new Date(Date.now() - 5 * 60 * 1000),
      status: 'completed',
      priorityLevel: 'high',
      passengersInvolved: '1 student, 1 staff member',
      specialRequirements: 'Medical emergency - requires fast transport',
      costEstimate: 500.00,
      actualCost: 450.00,
      notes: 'Student transported to campus medical center, now stable'
    },
    {
      emergencyType: 'security',
      severityLevel: 'medium',
      campusId: campuses[1]?.id,
      locationId: 4,
      description: 'Security escort requested for late night study session',
      requestedBy: users[1]?.id,
      status: 'requested',
      priorityLevel: 'medium',
      passengersInvolved: '3 students',
      specialRequirements: 'Security escort to dormitory',
      costEstimate: 200.00,
      notes: 'Students studying late for exams, request safe transport'
    }
  ];

  for (const emergency of emergencyRequests) {
    if (emergency.campusId && emergency.requestedBy) {
      await connection.execute(`
        INSERT INTO emergency_transportation (emergencyType, severityLevel, campusId, 
          locationId, description, requestedBy, approvedBy, vehicleId, driverId, 
          dispatchTime, arrivalTime, completionTime, status, priorityLevel, 
          passengersInvolved, specialRequirements, costEstimate, actualCost, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        emergency.emergencyType, emergency.severityLevel, emergency.campusId,
        emergency.locationId || null, emergency.description, emergency.requestedBy,
        emergency.approvedBy || null, emergency.vehicleId || null, emergency.driverId || null,
        emergency.dispatchTime || null, emergency.arrivalTime || null, emergency.completionTime || null,
        emergency.status, emergency.priorityLevel, emergency.passengersInvolved || null,
        emergency.specialRequirements || null, emergency.costEstimate || null, emergency.actualCost || null,
        emergency.notes || null
      ]);
    }
  }

  // Insert sample performance metrics
  const performanceMetrics = [
    {
      metricType: 'kpi',
      metricName: 'on_time_performance_percentage',
      metricValue: 92.5,
      metricUnit: '%',
      targetValue: 95.0,
      variancePercentage: -2.63,
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      campusId: campuses[0]?.id,
      benchmarkValue: 90.0,
      trendDirection: 'up',
      notes: 'Improved performance due to new scheduling system',
      calculatedBy: users[0]?.id
    },
    {
      metricType: 'efficiency',
      metricName: 'fuel_efficiency_km_per_liter',
      metricValue: 8.2,
      metricUnit: 'km/l',
      targetValue: 8.5,
      variancePercentage: -3.53,
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      vehicleId: vehicles[0]?.id,
      benchmarkValue: 7.8,
      trendDirection: 'stable',
      notes: 'Slightly below target due to increased traffic',
      calculatedBy: users[0]?.id
    },
    {
      metricType: 'satisfaction',
      metricName: 'passenger_satisfaction_score',
      metricValue: 4.2,
      metricUnit: 'points',
      targetValue: 4.5,
      variancePercentage: -6.67,
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      campusId: campuses[1]?.id,
      benchmarkValue: 4.0,
      trendDirection: 'up',
      notes: 'Improving trend due to better vehicle maintenance',
      calculatedBy: users[0]?.id
    }
  ];

  for (const metric of performanceMetrics) {
    if (metric.calculatedBy) {
      await connection.execute(`
        INSERT INTO transportation_performance_metrics (metricType, metricName, 
          metricValue, metricUnit, targetValue, variancePercentage, periodStart, 
          periodEnd, campusId, vehicleId, benchmarkValue, trendDirection, notes, calculatedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        metric.metricType, metric.metricName, metric.metricValue, metric.metricUnit,
        metric.targetValue, metric.variancePercentage, metric.periodStart,
        metric.periodEnd, metric.campusId, metric.vehicleId, metric.benchmarkValue,
        metric.trendDirection, metric.notes, metric.calculatedBy
      ]);
    }
  }

  console.log('✅ Phase 5 sample data inserted successfully!');
}

createPhase5TransportationTables();
