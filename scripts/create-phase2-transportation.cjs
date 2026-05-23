const mysql = require('mysql2/promise');

async function createPhase2TransportationTables() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🚀 Starting Phase 2 Transportation Implementation...');
    
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
        facilities text,
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
        frequencyMinutes int DEFAULT 0,
        validFrom date NOT NULL,
        validTo date NOT NULL,
        daysOfWeek varchar(20),
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
        boardingPoint varchar(255),
        alightingPoint varchar(255),
        specialRequirements text,
        parentContact varchar(20),
        emergencyContact varchar(20),
        status enum('active', 'suspended', 'expired', 'cancelled') DEFAULT 'active',
        qrCode varchar(500),
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
        incidents text,
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

    // Add foreign key constraints
    const foreignKeys = [
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
      'ALTER TABLE boarding_records ADD CONSTRAINT fk_boarding_stop FOREIGN KEY (stopId) REFERENCES route_stops(id) ON DELETE CASCADE'
    ];

    for (const fk of foreignKeys) {
      try {
        await connection.execute(fk);
      } catch (error) {
        // Foreign key might already exist, continue
        console.log(`Note: ${error.message}`);
      }
    }

    // Insert sample data for Phase 2
    await insertPhase2SampleData(connection);

    console.log('✅ Phase 2 Transportation Tables Created Successfully!');
    console.log('📋 New Tables Added:');
    console.log('  - route_stops (stop management)');
    console.log('  - schedules (trip scheduling)');
    console.log('  - student_transport_registrations (student bookings)');
    console.log('  - trips (actual trip execution)');
    console.log('  - boarding_records (passenger tracking)');
    
  } catch (error) {
    console.error('❌ Error creating Phase 2 tables:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function insertPhase2SampleData(connection) {
  console.log('📝 Inserting Phase 2 sample data...');
  
  // Get existing routes
  const [routes] = await connection.execute('SELECT id, name FROM routes');
  
  // Insert sample route stops
  const routeStops = [];
  
  // Main Campus Shuttle stops
  const mainCampusRoute = routes.find(r => r.name === 'Main Campus Shuttle');
  if (mainCampusRoute) {
    routeStops.push(
      {
        routeId: mainCampusRoute.id,
        name: 'Main Gate',
        address: 'Main Campus Entrance',
        latitude: 7.3964,
        longitude: 3.9170,
        stopOrder: 1,
        estimatedArrivalOffsetMinutes: 0
      },
      {
        routeId: mainCampusRoute.id,
        name: 'Faculty of Science',
        address: 'Science Faculty Building',
        latitude: 7.3984,
        longitude: 3.9180,
        stopOrder: 2,
        estimatedArrivalOffsetMinutes: 10
      },
      {
        routeId: mainCampusRoute.id,
        name: 'Library',
        address: 'Main Library Building',
        latitude: 7.3994,
        longitude: 3.9190,
        stopOrder: 3,
        estimatedArrivalOffsetMinutes: 20
      },
      {
        routeId: mainCampusRoute.id,
        name: 'Student Union',
        address: 'Student Union Building',
        latitude: 7.4004,
        longitude: 3.9200,
        stopOrder: 4,
        estimatedArrivalOffsetMinutes: 30
      },
      {
        routeId: mainCampusRoute.id,
        name: 'Hostel Block A',
        address: 'Hostel Block A',
        latitude: 7.4014,
        longitude: 3.9210,
        stopOrder: 5,
        estimatedArrivalOffsetMinutes: 40
      }
    );
  }

  // Science Faculty Express stops
  const scienceRoute = routes.find(r => r.name === 'Science Faculty Express');
  if (scienceRoute) {
    routeStops.push(
      {
        routeId: scienceRoute.id,
        name: 'Main Gate',
        address: 'Main Campus Entrance',
        latitude: 7.3964,
        longitude: 3.9170,
        stopOrder: 1,
        estimatedArrivalOffsetMinutes: 0
      },
      {
        routeId: scienceRoute.id,
        name: 'Science Faculty',
        address: 'Science Faculty Building',
        latitude: 7.3984,
        longitude: 3.9180,
        stopOrder: 2,
        estimatedArrivalOffsetMinutes: 15
      }
    );
  }

  // Hostel Shuttle stops
  const hostelRoute = routes.find(r => r.name === 'Hostel Shuttle');
  if (hostelRoute) {
    routeStops.push(
      {
        routeId: hostelRoute.id,
        name: 'Hostel Block A',
        address: 'Hostel Block A',
        latitude: 7.4014,
        longitude: 3.9210,
        stopOrder: 1,
        estimatedArrivalOffsetMinutes: 0
      },
      {
        routeId: hostelRoute.id,
        name: 'Hostel Block B',
        address: 'Hostel Block B',
        latitude: 7.4024,
        longitude: 3.9220,
        stopOrder: 2,
        estimatedArrivalOffsetMinutes: 5
      },
      {
        routeId: hostelRoute.id,
        name: 'Main Gate',
        address: 'Main Campus Entrance',
        latitude: 7.3964,
        longitude: 3.9170,
        stopOrder: 3,
        estimatedArrivalOffsetMinutes: 15
      },
      {
        routeId: hostelRoute.id,
        name: 'Library',
        address: 'Main Library Building',
        latitude: 7.3994,
        longitude: 3.9190,
        stopOrder: 4,
        estimatedArrivalOffsetMinutes: 25
      }
    );
  }

  // Insert route stops
  for (const stop of routeStops) {
    await connection.execute(`
      INSERT INTO route_stops (routeId, name, address, latitude, longitude, stopOrder, estimatedArrivalOffsetMinutes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      stop.routeId, stop.name, stop.address, stop.latitude, stop.longitude,
      stop.stopOrder, stop.estimatedArrivalOffsetMinutes
    ]);
  }

  // Get vehicles and drivers for schedules
  const [vehicles] = await connection.execute('SELECT id, type, capacity FROM vehicles WHERE status = "active" LIMIT 3');
  const [drivers] = await connection.execute('SELECT id FROM drivers WHERE status = "active" LIMIT 3');

  // Insert sample schedules
  const schedules = [];
  const today = new Date();
  const validFrom = today.toISOString().split('T')[0];
  const validTo = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now

  routes.forEach((route, index) => {
    if (index < vehicles.length && index < drivers.length) {
      schedules.push({
        routeId: route.id,
        vehicleId: vehicles[index].id,
        driverId: drivers[index].id,
        departureTime: '07:00:00',
        arrivalTime: '08:00:00',
        frequencyMinutes: 60, // Every hour
        validFrom,
        validTo,
        daysOfWeek: JSON.stringify([1,2,3,4,5]), // Weekdays
        isRecurring: true,
        maxCapacity: vehicles[index].capacity
      });
      
      // Add evening schedule
      schedules.push({
        routeId: route.id,
        vehicleId: vehicles[index].id,
        driverId: drivers[index].id,
        departureTime: '17:00:00',
        arrivalTime: '18:00:00',
        frequencyMinutes: 60,
        validFrom,
        validTo,
        daysOfWeek: JSON.stringify([1,2,3,4,5]),
        isRecurring: true,
        maxCapacity: vehicles[index].capacity
      });
    }
  });

  for (const schedule of schedules) {
    await connection.execute(`
      INSERT INTO schedules (routeId, vehicleId, driverId, departureTime, arrivalTime, 
        frequencyMinutes, validFrom, validTo, daysOfWeek, isRecurring, maxCapacity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      schedule.routeId, schedule.vehicleId, schedule.driverId, schedule.departureTime,
      schedule.arrivalTime, schedule.frequencyMinutes, schedule.validFrom, schedule.validTo,
      schedule.daysOfWeek, schedule.isRecurring, schedule.maxCapacity
    ]);
  }

  // Get sample students for registrations
  const [students] = await connection.execute('SELECT id, firstName, lastName FROM students LIMIT 5');
  
  // Insert sample student transport registrations
  const registrations = [];
  students.forEach((student, index) => {
    if (index < routes.length) {
      registrations.push({
        studentId: student.id,
        routeId: routes[index].id,
        registrationType: 'monthly',
        validFrom,
        validTo,
        fareAmount: 3000.00, // Monthly fare
        paymentStatus: 'paid',
        paymentReference: 'TXN' + Date.now() + student.id,
        boardingPoint: 'Main Gate',
        alightingPoint: routes[index].name.includes('Shuttle') ? 'Library' : 'Science Faculty',
        parentContact: '080' + String(Math.floor(Math.random() * 90000000) + 10000000),
        emergencyContact: '090' + String(Math.floor(Math.random() * 90000000) + 10000000)
      });
    }
  });

  for (const registration of registrations) {
    await connection.execute(`
      INSERT INTO student_transport_registrations (studentId, routeId, registrationType, 
        validFrom, validTo, fareAmount, paymentStatus, paymentReference, boardingPoint, 
        alightingPoint, parentContact, emergencyContact)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      registration.studentId, registration.routeId, registration.registrationType,
      registration.validFrom, registration.validTo, registration.fareAmount,
      registration.paymentStatus, registration.paymentReference, registration.boardingPoint,
      registration.alightingPoint, registration.parentContact, registration.emergencyContact
    ]);
  }

  console.log('✅ Phase 2 sample data inserted successfully!');
}

createPhase2TransportationTables();
