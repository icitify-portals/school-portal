const mysql = require('mysql2/promise');

async function createPhase3TransportationTables() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🚀 Starting Phase 3 Transportation Implementation...');
    
    // Create vehicle_maintenance table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS vehicle_maintenance (
        id int AUTO_INCREMENT PRIMARY KEY,
        vehicleId int NOT NULL,
        maintenanceType enum('routine', 'repair', 'inspection', 'emergency') NOT NULL,
        description text NOT NULL,
        scheduledDate date NOT NULL,
        completedDate date,
        cost decimal(10,2),
        mechanicName varchar(255),
        partsUsed text,
        odometerReading int,
        nextMaintenanceDate date,
        status enum('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
        invoiceNumber varchar(100),
        warrantyClaim boolean DEFAULT false,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_maintenance_vehicle (vehicleId),
        INDEX idx_maintenance_status (status),
        INDEX idx_maintenance_dates (scheduledDate, completedDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create fuel_records table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS fuel_records (
        id int AUTO_INCREMENT PRIMARY KEY,
        vehicleId int NOT NULL,
        fuelDate date NOT NULL,
        fuelType enum('diesel', 'petrol', 'electric', 'cng') NOT NULL,
        quantityLiters decimal(8,2),
        costPerLiter decimal(8,2),
        totalCost decimal(10,2),
        odometerReading int,
        fuelingStation varchar(255),
        driverId int,
        receiptNumber varchar(100),
        paymentMethod enum('cash', 'card', 'company_account') DEFAULT 'company_account',
        notes text,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_fuel_vehicle (vehicleId),
        INDEX idx_fuel_date (fuelDate),
        INDEX idx_fuel_driver (driverId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create transportation_incidents table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transportation_incidents (
        id int AUTO_INCREMENT PRIMARY KEY,
        tripId int,
        vehicleId int NOT NULL,
        driverId int NOT NULL,
        incidentType enum('accident', 'breakdown', 'traffic_violation', 'passenger_incident', 'theft', 'vandalism', 'medical_emergency') NOT NULL,
        severity enum('low', 'medium', 'high', 'critical') NOT NULL,
        description text NOT NULL,
        incidentDateTime datetime NOT NULL,
        location varchar(255),
        latitude decimal(10,8),
        longitude decimal(11,8),
        passengersInvolved text,
        injuries text,
        policeReportNumber varchar(100),
        insuranceClaimNumber varchar(100),
        estimatedCost decimal(10,2),
        status enum('reported', 'investigating', 'resolved', 'closed') DEFAULT 'reported',
        reportedBy int NOT NULL,
        resolvedBy int,
        resolutionNotes text,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_incidents_trip (tripId),
        INDEX idx_incidents_vehicle (vehicleId),
        INDEX idx_incidents_driver (driverId),
        INDEX idx_incidents_type (incidentType),
        INDEX idx_incidents_severity (severity),
        INDEX idx_incidents_status (status),
        INDEX idx_incidents_date (incidentDateTime)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create transportation_feedback table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transportation_feedback (
        id int AUTO_INCREMENT PRIMARY KEY,
        tripId int,
        routeId int,
        vehicleId int,
        driverId int,
        studentId int,
        feedbackType enum('complaint', 'compliment', 'suggestion', 'incident_report') NOT NULL,
        category enum('punctuality', 'cleanliness', 'driver_behavior', 'safety', 'comfort', 'crowding', 'other') NOT NULL,
        rating int CHECK (rating >= 1 AND rating <= 5),
        comments text NOT NULL,
        feedbackDate datetime NOT NULL,
        status enum('new', 'under_review', 'resolved', 'closed') DEFAULT 'new',
        priority enum('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        assignedTo int,
        response text,
        responseDate datetime,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_feedback_trip (tripId),
        INDEX idx_feedback_student (studentId),
        INDEX idx_feedback_type (feedbackType),
        INDEX idx_feedback_status (status),
        INDEX idx_feedback_date (feedbackDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create transportation_analytics table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transportation_analytics (
        id int AUTO_INCREMENT PRIMARY KEY,
        analyticsType enum('daily_summary', 'weekly_summary', 'monthly_summary', 'route_performance', 'vehicle_utilization', 'driver_performance', 'cost_analysis', 'safety_metrics') NOT NULL,
        periodStart date NOT NULL,
        periodEnd date NOT NULL,
        metrics text NOT NULL,
        insights text,
        recommendations text,
        generatedAt timestamp DEFAULT CURRENT_TIMESTAMP,
        generatedBy int NOT NULL,
        
        INDEX idx_analytics_type (analyticsType),
        INDEX idx_analytics_period (periodStart, periodEnd),
        INDEX idx_analytics_generated (generatedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create vehicle_location_tracking table (for GPS tracking)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS vehicle_location_tracking (
        id int AUTO_INCREMENT PRIMARY KEY,
        vehicleId int NOT NULL,
        tripId int,
        latitude decimal(10,8) NOT NULL,
        longitude decimal(11,8) NOT NULL,
        speed decimal(5,2),
        heading decimal(5,2),
        timestamp datetime NOT NULL,
        ignitionStatus boolean DEFAULT false,
        gpsStatus enum('active', 'inactive', 'error') DEFAULT 'active',
        batteryLevel int,
        fuelLevel decimal(5,2),
        odometerReading int,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_tracking_vehicle (vehicleId),
        INDEX idx_tracking_trip (tripId),
        INDEX idx_tracking_timestamp (timestamp),
        INDEX idx_tracking_gps (gpsStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create maintenance_alerts table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS maintenance_alerts (
        id int AUTO_INCREMENT PRIMARY KEY,
        vehicleId int NOT NULL,
        alertType enum('oil_change', 'tire_rotation', 'brake_inspection', 'general_service', 'inspection_due', 'insurance_expiry', 'registration_expiry') NOT NULL,
        alertLevel enum('info', 'warning', 'critical') NOT NULL,
        title varchar(255) NOT NULL,
        message text NOT NULL,
        dueDate date,
        mileageThreshold int,
        status enum('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active',
        acknowledgedBy int,
        acknowledgedAt datetime,
        resolvedBy int,
        resolvedAt datetime,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_alerts_vehicle (vehicleId),
        INDEX idx_alerts_type (alertType),
        INDEX idx_alerts_level (alertLevel),
        INDEX idx_alerts_status (status),
        INDEX idx_alerts_due (dueDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Add foreign key constraints
    const foreignKeys = [
      'ALTER TABLE vehicle_maintenance ADD CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE',
      'ALTER TABLE fuel_records ADD CONSTRAINT fk_fuel_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE',
      'ALTER TABLE fuel_records ADD CONSTRAINT fk_fuel_driver FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE SET NULL',
      'ALTER TABLE transportation_incidents ADD CONSTRAINT fk_incidents_trip FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE SET NULL',
      'ALTER TABLE transportation_incidents ADD CONSTRAINT fk_incidents_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE',
      'ALTER TABLE transportation_incidents ADD CONSTRAINT fk_incidents_driver FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE',
      'ALTER TABLE transportation_incidents ADD CONSTRAINT fk_incidents_reported_by FOREIGN KEY (reportedBy) REFERENCES users(id) ON DELETE CASCADE',
      'ALTER TABLE transportation_incidents ADD CONSTRAINT fk_incidents_resolved_by FOREIGN KEY (resolvedBy) REFERENCES users(id) ON DELETE SET NULL',
      'ALTER TABLE transportation_feedback ADD CONSTRAINT fk_feedback_trip FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE SET NULL',
      'ALTER TABLE transportation_feedback ADD CONSTRAINT fk_feedback_route FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE SET NULL',
      'ALTER TABLE transportation_feedback ADD CONSTRAINT fk_feedback_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE SET NULL',
      'ALTER TABLE transportation_feedback ADD CONSTRAINT fk_feedback_driver FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE SET NULL',
      'ALTER TABLE transportation_feedback ADD CONSTRAINT fk_feedback_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL',
      'ALTER TABLE transportation_feedback ADD CONSTRAINT fk_feedback_assigned_to FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL',
      'ALTER TABLE vehicle_location_tracking ADD CONSTRAINT fk_tracking_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE',
      'ALTER TABLE vehicle_location_tracking ADD CONSTRAINT fk_tracking_trip FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE SET NULL',
      'ALTER TABLE maintenance_alerts ADD CONSTRAINT fk_alerts_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE'
    ];

    for (const fk of foreignKeys) {
      try {
        await connection.execute(fk);
      } catch (error) {
        // Foreign key might already exist, continue
        console.log(`Note: ${error.message}`);
      }
    }

    // Insert sample Phase 3 data
    await insertPhase3SampleData(connection);

    console.log('✅ Phase 3 Transportation Tables Created Successfully!');
    console.log('📋 New Advanced Tables Added:');
    console.log('  - vehicle_maintenance (maintenance scheduling and tracking)');
    console.log('  - fuel_records (fuel consumption and cost tracking)');
    console.log('  - transportation_incidents (incident reporting and management)');
    console.log('  - transportation_feedback (student feedback system)');
    console.log('  - transportation_analytics (advanced analytics storage)');
    console.log('  - vehicle_location_tracking (GPS tracking infrastructure)');
    console.log('  - maintenance_alerts (predictive maintenance alerts)');
    
  } catch (error) {
    console.error('❌ Error creating Phase 3 tables:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function insertPhase3SampleData(connection) {
  console.log('📝 Inserting Phase 3 sample data...');
  
  // Get existing vehicles and drivers
  const [vehicles] = await connection.execute('SELECT id, registrationNumber FROM vehicles LIMIT 3');
  const [drivers] = await connection.execute('SELECT id FROM drivers LIMIT 3');
  const [users] = await connection.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
  
  // Insert sample maintenance records
  const maintenanceRecords = [
    {
      vehicleId: vehicles[0]?.id,
      maintenanceType: 'routine',
      description: 'Regular oil change and filter replacement',
      scheduledDate: new Date().toISOString().split('T')[0],
      cost: 8500.00,
      mechanicName: 'AutoCare Service Center',
      odometerReading: 15000,
      status: 'completed',
      completedDate: new Date().toISOString().split('T')[0]
    },
    {
      vehicleId: vehicles[1]?.id,
      maintenanceType: 'inspection',
      description: 'Quarterly safety inspection',
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'scheduled'
    },
    {
      vehicleId: vehicles[2]?.id,
      maintenanceType: 'repair',
      description: 'Brake pad replacement',
      scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cost: 15000.00,
      mechanicName: 'Brake Masters',
      status: 'scheduled'
    }
  ];

  for (const record of maintenanceRecords) {
    if (record.vehicleId) {
      await connection.execute(`
        INSERT INTO vehicle_maintenance (vehicleId, maintenanceType, description, 
          scheduledDate, cost, mechanicName, odometerReading, status, completedDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        record.vehicleId, record.maintenanceType, record.description,
        record.scheduledDate, record.cost, record.mechanicName,
        record.odometerReading, record.status, record.completedDate
      ]);
    }
  }

  // Insert sample fuel records
  const fuelRecords = [
    {
      vehicleId: vehicles[0]?.id,
      fuelDate: new Date().toISOString().split('T')[0],
      fuelType: 'diesel',
      quantityLiters: 45.5,
      costPerLiter: 245.50,
      totalCost: 11170.25,
      odometerReading: 15500,
      fuelingStation: 'Shell Station - Campus',
      driverId: drivers[0]?.id,
      receiptNumber: 'SHL' + Date.now()
    },
    {
      vehicleId: vehicles[1]?.id,
      fuelDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fuelType: 'diesel',
      quantityLiters: 38.2,
      costPerLiter: 245.50,
      totalCost: 9378.10,
      odometerReading: 12300,
      fuelingStation: 'Total Station - Main Road',
      driverId: drivers[1]?.id,
      receiptNumber: 'TOT' + Date.now()
    }
  ];

  for (const record of fuelRecords) {
    if (record.vehicleId) {
      await connection.execute(`
        INSERT INTO fuel_records (vehicleId, fuelDate, fuelType, quantityLiters, 
          costPerLiter, totalCost, odometerReading, fuelingStation, driverId, receiptNumber)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        record.vehicleId, record.fuelDate, record.fuelType, record.quantityLiters,
        record.costPerLiter, record.totalCost, record.odometerReading,
        record.fuelingStation, record.driverId, record.receiptNumber
      ]);
    }
  }

  // Insert sample incidents
  const incidents = [
    {
      vehicleId: vehicles[0]?.id,
      driverId: drivers[0]?.id,
      incidentType: 'breakdown',
      severity: 'medium',
      description: 'Vehicle experienced engine overheating during morning trip',
      incidentDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      location: 'Near Science Faculty',
      status: 'resolved',
      reportedBy: users[0]?.id,
      estimatedCost: 5000.00
    }
  ];

  for (const incident of incidents) {
    if (incident.vehicleId && incident.driverId) {
      await connection.execute(`
        INSERT INTO transportation_incidents (vehicleId, driverId, incidentType, 
          severity, description, incidentDateTime, location, status, reportedBy, estimatedCost)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        incident.vehicleId, incident.driverId, incident.incidentType,
        incident.severity, incident.description, incident.incidentDateTime,
        incident.location, incident.status, incident.reportedBy, incident.estimatedCost
      ]);
    }
  }

  // Insert sample feedback
  const [students] = await connection.execute('SELECT id FROM students LIMIT 3');
  const feedback = [
    {
      studentId: students[0]?.id,
      feedbackType: 'compliment',
      category: 'driver_behavior',
      rating: 5,
      comments: 'Driver was very professional and helpful. Arrived on time.',
      feedbackDate: new Date().toISOString(),
      status: 'resolved'
    },
    {
      studentId: students[1]?.id,
      feedbackType: 'suggestion',
      category: 'crowding',
      rating: 3,
      comments: 'Bus was quite crowded during peak hours. Consider adding more trips.',
      feedbackDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'under_review'
    }
  ];

  for (const item of feedback) {
    if (item.studentId) {
      await connection.execute(`
        INSERT INTO transportation_feedback (studentId, feedbackType, category, 
          rating, comments, feedbackDate, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        item.studentId, item.feedbackType, item.category, item.rating,
        item.comments, item.feedbackDate, item.status
      ]);
    }
  }

  // Insert sample maintenance alerts
  const alerts = [
    {
      vehicleId: vehicles[0]?.id,
      alertType: 'oil_change',
      alertLevel: 'warning',
      title: 'Oil Change Due Soon',
      message: 'Vehicle is due for oil change within 500km',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      mileageThreshold: 20000
    },
    {
      vehicleId: vehicles[1]?.id,
      alertType: 'inspection_due',
      alertLevel: 'info',
      title: 'Quarterly Inspection Coming Up',
      message: 'Quarterly safety inspection scheduled for next week',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ];

  for (const alert of alerts) {
    if (alert.vehicleId) {
      await connection.execute(`
        INSERT INTO maintenance_alerts (vehicleId, alertType, alertLevel, 
          title, message, dueDate, mileageThreshold)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        alert.vehicleId, alert.alertType, alert.alertLevel,
        alert.title, alert.message, alert.dueDate, alert.mileageThreshold
      ]);
    }
  }

  console.log('✅ Phase 3 sample data inserted successfully!');
}

createPhase3TransportationTables();
