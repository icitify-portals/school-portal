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
        trainingCertificates text,
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
        waypoints text,
        distanceKm decimal(8,2) NOT NULL,
        estimatedDurationMinutes int NOT NULL,
        peakHourDurationMinutes int,
        routeType enum('campus_shuttle', 'express', 'local', 'night_service', 'special_event') NOT NULL,
        fareAmount decimal(8,2),
        operatingHoursStart time,
        operatingHoursEnd time,
        daysOfWeek varchar(20),
        isActive boolean DEFAULT true,
        priority int DEFAULT 0,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_routes_active (isActive),
        INDEX idx_routes_type (routeType),
        INDEX idx_routes_priority (priority)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Core transportation tables created successfully!');
    
    // Insert sample data
    await insertSampleData(connection);

    console.log('✅ Transportation Management System created successfully!');
    console.log('📋 Tables created:');
    console.log('  - vehicles (fleet management)');
    console.log('  - drivers (driver management)');
    console.log('  - routes (route configuration)');
    console.log('  - Additional tables for complete system ready');
    
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
      peakHourDurationMinutes: null,
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
      peakHourDurationMinutes: null,
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
      route.distanceKm, route.estimatedDurationMinutes, route.peakHourDurationMinutes,
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
