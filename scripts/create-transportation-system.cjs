const mysql = require('mysql2/promise');

async function createTransportationManagementSystem() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🚌 Creating Transportation Management System...');
    
    // Create vehicles table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id int AUTO_INCREMENT PRIMARY KEY,
        registrationNumber varchar(50) NOT NULL UNIQUE,
        make varchar(100) NOT NULL,
        model varchar(100) NOT NULL,
        year int NOT NULL,
        type enum('bus', 'van', 'car', 'motorcycle', 'electric_bus', 'shuttle') NOT NULL,
        capacity int NOT NULL,
        fuelType enum('diesel', 'petrol', 'electric', 'hybrid', 'cng') NOT NULL,
        licensePlate varchar(50) NOT NULL UNIQUE,
        chassisNumber varchar(50),
        engineNumber varchar(50),
        purchaseDate date,
        purchasePrice decimal(12,2),
        currentMileage int DEFAULT 0,
        status enum('active', 'maintenance', 'retired', 'accident', 'out_of_service') DEFAULT 'active',
        insuranceExpiry date,
        registrationExpiry date,
        lastServiceDate date,
        nextServiceDate date,
        gpsDeviceId varchar(100),
        driverId int,
        assignedRouteId int,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_vehicles_status (status),
        INDEX idx_vehicles_type (type),
        INDEX idx_vehicles_driver (driverId),
        INDEX idx_vehicles_route (assignedRouteId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create drivers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS drivers (
        id int AUTO_INCREMENT PRIMARY KEY,
        userId int NOT NULL,
        licenseNumber varchar(50) NOT NULL UNIQUE,
        licenseType enum('commercial', 'private', 'public_service') NOT NULL,
        licenseExpiry date NOT NULL,
        experienceYears int DEFAULT 0,
        accidentHistory text,
        trainingCertificates text, -- JSON array of certificates
        medicalFitnessCertificate varchar(255),
        medicalExpiry date,
        backgroundCheckDate date,
        backgroundCheckStatus enum('pending', 'approved', 'rejected') DEFAULT 'pending',
        emergencyContactName varchar(255),
        emergencyContactPhone varchar(20),
        employmentDate date,
        salary decimal(10,2),
        status enum('active', 'suspended', 'terminated', 'on_leave') DEFAULT 'active',
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_drivers_status (status),
        INDEX idx_drivers_user (userId),
        INDEX idx_drivers_license (licenseNumber)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create routes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS routes (
        id int AUTO_INCREMENT PRIMARY KEY,
        name varchar(255) NOT NULL,
        code varchar(50) NOT NULL UNIQUE,
        description text,
        startPoint varchar(255) NOT NULL,
        endPoint varchar(255) NOT NULL,
        waypoints text, -- JSON array of waypoints
        distanceKm decimal(8,2) NOT NULL,
        estimatedDurationMinutes int NOT NULL,
        peakHourDurationMinutes int,
        routeType enum('campus_shuttle', 'express', 'local', 'night_service', 'special_event') NOT NULL,
        fareAmount decimal(8,2),
        operatingHoursStart time,
        operatingHoursEnd time,
        daysOfWeek varchar(20), -- JSON array: [1,2,3,4,5] for weekdays
        isActive boolean DEFAULT true,
        priority int DEFAULT 0, -- Higher priority for main routes
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_routes_active (isActive),
        INDEX idx_routes_type (routeType),
        INDEX idx_routes_priority (priority)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create route_stops table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS route_stops (
        id int AUTO_INCREMENT PRIMARY KEY,
        routeId int NOT NULL,
        name varchar(255) NOT NULL,
        address varchar(255),
        latitude decimal(10,8) NOT NULL,
        longitude decimal(11,8) NOT NULL,
        stopOrder int NOT NULL,
        estimatedArrivalOffsetMinutes int DEFAULT 0,
        facilities text, -- JSON: {"shelter": true, "lighting": true, "seating": true}
        isActive boolean DEFAULT true,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_stops_route (routeId),
        INDEX idx_stops_order (routeId, stopOrder),
        INDEX idx_stops_active (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create schedules table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS schedules (
        id int AUTO_INCREMENT PRIMARY KEY,
        routeId int NOT NULL,
        vehicleId int NOT NULL,
        driverId int NOT NULL,
        departureTime time NOT NULL,
        arrivalTime time NOT NULL,
        frequencyMinutes int DEFAULT 0, -- 0 for one-time, >0 for recurring
        validFrom date NOT NULL,
        validTo date NOT NULL,
        daysOfWeek varchar(20), -- JSON array: [1,2,3,4,5] for weekdays
        isRecurring boolean DEFAULT false,
        specialInstructions text,
        maxCapacity int,
        currentBookings int DEFAULT 0,
        status enum('active', 'cancelled', 'delayed', 'completed') DEFAULT 'active',
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_schedules_route (routeId),
        INDEX idx_schedules_vehicle (vehicleId),
        INDEX idx_schedules_driver (driverId),
        INDEX idx_schedules_status (status),
        INDEX idx_schedules_dates (validFrom, validTo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create student_transport_registrations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS student_transport_registrations (
        id int AUTO_INCREMENT PRIMARY KEY,
        studentId int NOT NULL,
        routeId int NOT NULL,
        registrationType enum('semester', 'monthly', 'daily', 'trip_based') NOT NULL,
        validFrom date NOT NULL,
        validTo date NOT NULL,
        fareAmount decimal(8,2),
        paymentStatus enum('paid', 'pending', 'partial', 'waived') DEFAULT 'pending',
        paymentReference varchar(100),
        boardingPoint varchar(255), -- Preferred boarding stop
        alightingPoint varchar(255), -- Preferred alighting stop
        specialRequirements text, -- JSON: {"wheelchair": true, "assistance": true}
        parentContact varchar(20),
        emergencyContact varchar(20),
        status enum('active', 'suspended', 'expired', 'cancelled') DEFAULT 'active',
        qrCode varchar(500), -- For boarding verification
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_registrations_student (studentId),
        INDEX idx_registrations_route (routeId),
        INDEX idx_registrations_status (status),
        INDEX idx_registrations_dates (validFrom, validTo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create trips table (actual trip executions)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trips (
        id int AUTO_INCREMENT PRIMARY KEY,
        scheduleId int NOT NULL,
        routeId int NOT NULL,
        vehicleId int NOT NULL,
        driverId int NOT NULL,
        tripDate date NOT NULL,
        plannedDepartureTime datetime NOT NULL,
        actualDepartureTime datetime,
        plannedArrivalTime datetime NOT NULL,
        actualArrivalTime datetime,
        status enum('scheduled', 'in_progress', 'completed', 'cancelled', 'delayed') DEFAULT 'scheduled',
        totalBoardings int DEFAULT 0,
        totalAlightings int DEFAULT 0,
        revenue decimal(10,2) DEFAULT 0.00,
        fuelConsumed decimal(8,2),
        distanceCovered decimal(8,2),
        incidents text, -- JSON array of incidents
        driverNotes text,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_trips_schedule (scheduleId),
        INDEX idx_trips_route (routeId),
        INDEX idx_trips_vehicle (vehicleId),
        INDEX idx_trips_driver (driverId),
        INDEX idx_trips_date (tripDate),
        INDEX idx_trips_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create boarding_records table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS boarding_records (
        id int AUTO_INCREMENT PRIMARY KEY,
        tripId int NOT NULL,
        studentId int,
        visitorId int,
        boardingType enum('student', 'staff', 'visitor', 'public') NOT NULL,
        stopId int NOT NULL,
        boardingTime datetime NOT NULL,
        alightingTime datetime,
        fareCollected decimal(8,2) DEFAULT 0.00,
        paymentMethod enum('cash', 'card', 'mobile', 'prepaid', 'complimentary') DEFAULT 'prepaid',
        qrCode varchar(500),
        boardingPoint varchar(255),
        alightingPoint varchar(255),
        purpose varchar(255),
        status enum('boarded', 'alighted', 'no_show') DEFAULT 'boarded',
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_boarding_trip (tripId),
        INDEX idx_boarding_student (studentId),
        INDEX idx_boarding_visitor (visitorId),
        INDEX idx_boarding_stop (stopId),
        INDEX idx_boarding_time (boardingTime),
        INDEX idx_boarding_type (boardingType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

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
        partsUsed text, -- JSON array of parts
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
        passengersInvolved text, -- JSON array of passenger IDs
        injuries text, -- JSON array of injury details
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

    // Add foreign key constraints
    const foreignKeys = [
      'ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_driver FOREIGN KEY (driverId) REFERENCES users(id) ON DELETE SET NULL',
      'ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_route FOREIGN KEY (assignedRouteId) REFERENCES routes(id) ON DELETE SET NULL',
      'ALTER TABLE drivers ADD CONSTRAINT fk_drivers_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE',
      'ALTER TABLE route_stops ADD CONSTRAINT fk_stops_route FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE',
      'ALTER TABLE schedules ADD CONSTRAINT fk_schedules_route FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE',
      'ALTER TABLE schedules ADD CONSTRAINT fk_schedules_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE',
      'ALTER TABLE schedules ADD CONSTRAINT fk_schedules_driver FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE',
      'ALTER TABLE student_transport_registrations ADD CONSTRAINT fk_registrations_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE',
      'ALTER TABLE student_transport_registrations ADD CONSTRAINT fk_registrations_route FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE',
      'ALTER TABLE trips ADD CONSTRAINT fk_trips_schedule FOREIGN KEY (scheduleId) REFERENCES schedules(id) ON DELETE CASCADE',
      'ALTER TABLE trips ADD CONSTRAINT fk_trips_route FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE',
      'ALTER TABLE trips ADD CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE',
      'ALTER TABLE trips ADD CONSTRAINT fk_trips_driver FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE',
      'ALTER TABLE boarding_records ADD CONSTRAINT fk_boarding_trip FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE',
      'ALTER TABLE boarding_records ADD CONSTRAINT fk_boarding_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL',
      'ALTER TABLE boarding_records ADD CONSTRAINT fk_boarding_visitor FOREIGN KEY (visitorId) REFERENCES visitors(id) ON DELETE SET NULL',
      'ALTER TABLE boarding_records ADD CONSTRAINT fk_boarding_stop FOREIGN KEY (stopId) REFERENCES route_stops(id) ON DELETE CASCADE',
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
      'ALTER TABLE transportation_feedback ADD CONSTRAINT fk_feedback_assigned_to FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL'
    ];

    for (const fk of foreignKeys) {
      try {
        await connection.execute(fk);
      } catch (error) {
        // Foreign key might already exist, continue
        console.log(`Note: ${error.message}`);
      }
    }

    // Insert sample data
    await insertSampleData(connection);

    console.log('✅ Transportation Management System created successfully!');
    console.log('📋 Tables created:');
    console.log('  - vehicles (fleet management)');
    console.log('  - drivers (driver management)');
    console.log('  - routes (route configuration)');
    console.log('  - route_stops (stop management)');
    console.log('  - schedules (trip scheduling)');
    console.log('  - student_transport_registrations (student bookings)');
    console.log('  - trips (actual trip execution)');
    console.log('  - boarding_records (passenger tracking)');
    console.log('  - vehicle_maintenance (maintenance tracking)');
    console.log('  - fuel_records (fuel management)');
    console.log('  - transportation_incidents (incident reporting)');
    console.log('  - transportation_feedback (feedback system)');
    
  } catch (error) {
    console.error('❌ Error creating transportation system:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function insertSampleData(connection) {
  console.log('📝 Inserting sample transportation data...');
  
  // Sample routes
  const routes = [
    {
      name: 'Main Campus Shuttle',
      code: 'CS-001',
      description: 'Main campus circular route covering all major faculties',
      startPoint: 'Main Gate',
      endPoint: 'Main Gate',
      distanceKm: 8.5,
      estimatedDurationMinutes: 45,
      peakHourDurationMinutes: 60,
      routeType: 'campus_shuttle',
      fareAmount: 50.00,
      operatingHoursStart: '07:00:00',
      operatingHoursEnd: '22:00:00',
      daysOfWeek: JSON.stringify([1,2,3,4,5])
    },
    {
      name: 'Science Faculty Express',
      code: 'SF-001',
      description: 'Express service to Science Faculty',
      startPoint: 'Main Gate',
      endPoint: 'Science Faculty',
      distanceKm: 3.2,
      estimatedDurationMinutes: 15,
      routeType: 'express',
      fareAmount: 30.00,
      operatingHoursStart: '08:00:00',
      operatingHoursEnd: '18:00:00',
      daysOfWeek: JSON.stringify([1,2,3,4,5])
    },
    {
      name: 'Hostel Shuttle',
      code: 'HS-001',
      description: 'Shuttle service for hostel residents',
      startPoint: 'Hostel Block A',
      endPoint: 'Main Campus',
      distanceKm: 5.8,
      estimatedDurationMinutes: 25,
      routeType: 'campus_shuttle',
      fareAmount: 40.00,
      operatingHoursStart: '06:30:00',
      operatingHoursEnd: '23:00:00',
      daysOfWeek: JSON.stringify([1,2,3,4,5,6,7])
    }
  ];

  for (const route of routes) {
    await connection.execute(`
      INSERT INTO routes (name, code, description, startPoint, endPoint, distanceKm, 
        estimatedDurationMinutes, peakHourDurationMinutes, routeType, fareAmount, 
        operatingHoursStart, operatingHoursEnd, daysOfWeek)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      route.name, route.code, route.description, route.startPoint, route.endPoint,
      route.distanceKm, route.estimatedDurationMinutes, route.peakHourDurationMinutes || null,
      route.routeType, route.fareAmount, route.operatingHoursStart, route.operatingHoursEnd,
      route.daysOfWeek
    ]);
  }

  // Sample vehicles
  const vehicles = [
    {
      registrationNumber: 'ABC-123-45',
      make: 'Toyota',
      model: 'Hiace',
      year: 2022,
      type: 'bus',
      capacity: 16,
      fuelType: 'diesel',
      licensePlate: 'UNI-001-AB',
      purchaseDate: '2022-01-15',
      purchasePrice: 8500000,
      status: 'active'
    },
    {
      registrationNumber: 'DEF-456-78',
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2023,
      type: 'shuttle',
      capacity: 12,
      fuelType: 'diesel',
      licensePlate: 'UNI-002-CD',
      purchaseDate: '2023-03-20',
      purchasePrice: 12000000,
      status: 'active'
    },
    {
      registrationNumber: 'GHI-789-01',
      make: 'Nissan',
      model: 'Urvan',
      year: 2021,
      type: 'van',
      capacity: 8,
      fuelType: 'petrol',
      licensePlate: 'UNI-003-EF',
      purchaseDate: '2021-06-10',
      purchasePrice: 5200000,
      status: 'active'
    }
  ];

  for (const vehicle of vehicles) {
    await connection.execute(`
      INSERT INTO vehicles (registrationNumber, make, model, year, type, capacity, 
        fuelType, licensePlate, purchaseDate, purchasePrice, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      vehicle.registrationNumber, vehicle.make, vehicle.model, vehicle.year,
      vehicle.type, vehicle.capacity, vehicle.fuelType, vehicle.licensePlate,
      vehicle.purchaseDate, vehicle.purchasePrice, vehicle.status
    ]);
  }

  console.log('✅ Sample data inserted successfully!');
}

createTransportationManagementSystem();
