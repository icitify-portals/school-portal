const mysql = require('mysql2/promise');

async function createPhase4TransportationTables() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moodledb'
    });
    
    console.log('🚀 Starting Phase 4 Transportation Implementation...');
    
    // Create mobile_app_sessions table for mobile app management
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS mobile_app_sessions (
        id int AUTO_INCREMENT PRIMARY KEY,
        userId int NOT NULL,
        deviceType enum('android', 'ios', 'web') NOT NULL,
        deviceId varchar(255) NOT NULL,
        appVersion varchar(50),
        pushToken varchar(500),
        isActive boolean DEFAULT true,
        lastActive timestamp DEFAULT CURRENT_TIMESTAMP,
        ipAddress varchar(45),
        userAgent text,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_sessions_user (userId),
        INDEX idx_sessions_device (deviceId),
        INDEX idx_sessions_active (isActive),
        INDEX idx_sessions_last_active (lastActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create gps_tracking_realtime table for live GPS data
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gps_tracking_realtime (
        id int AUTO_INCREMENT PRIMARY KEY,
        vehicleId int NOT NULL,
        tripId int,
        latitude decimal(10,8) NOT NULL,
        longitude decimal(11,8) NOT NULL,
        speed decimal(5,2),
        heading decimal(5,2),
        altitude decimal(8,2),
        accuracy decimal(5,2),
        timestamp datetime NOT NULL,
        ignitionStatus boolean DEFAULT false,
        gpsStatus enum('active', 'inactive', 'error') DEFAULT 'active',
        batteryLevel int,
        fuelLevel decimal(5,2),
        odometerReading int,
        engineStatus enum('running', 'stopped', 'error') DEFAULT 'stopped',
        doorStatus enum('open', 'closed', 'unknown') DEFAULT 'unknown',
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_gps_vehicle (vehicleId),
        INDEX idx_gps_trip (tripId),
        INDEX idx_gps_timestamp (timestamp),
        INDEX idx_gps_status (gpsStatus),
        INDEX idx_gps_ignition (ignitionStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create route_optimization table for AI-powered route planning
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS route_optimization (
        id int AUTO_INCREMENT PRIMARY KEY,
        routeId int NOT NULL,
        optimizationDate date NOT NULL,
        originalDistance decimal(8,2),
        optimizedDistance decimal(8,2),
        originalTime int,
        optimizedTime int,
        fuelSavings decimal(8,2),
        timeSavings int,
        trafficConditions text,
        weatherConditions text,
        optimizationAlgorithm varchar(100),
        confidenceScore decimal(3,2),
        recommendations text,
        applied boolean DEFAULT false,
        appliedAt datetime,
        appliedBy int,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_optimization_route (routeId),
        INDEX idx_optimization_date (optimizationDate),
        INDEX idx_optimization_applied (applied)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create demand_forecasting table for AI-powered demand prediction
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS demand_forecasting (
        id int AUTO_INCREMENT PRIMARY KEY,
        routeId int NOT NULL,
        forecastDate date NOT NULL,
        forecastType enum('daily', 'weekly', 'monthly', 'event_based') NOT NULL,
        predictedBoardings int,
        predictedRevenue decimal(10,2),
        confidenceLevel decimal(3,2),
        factors text,
        modelVersion varchar(50),
        actualBoardings int,
        actualRevenue decimal(10,2),
        accuracy decimal(3,2),
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_forecast_route (routeId),
        INDEX idx_forecast_date (forecastDate),
        INDEX idx_forecast_type (forecastType),
        INDEX idx_forecast_confidence (confidenceLevel)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create predictive_maintenance_ai table for AI-powered maintenance prediction
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS predictive_maintenance_ai (
        id int AUTO_INCREMENT PRIMARY KEY,
        vehicleId int NOT NULL,
        predictionDate date NOT NULL,
        componentType enum('engine', 'transmission', 'brakes', 'tires', 'battery', 'cooling', 'electrical', 'suspension') NOT NULL,
        failureProbability decimal(5,4),
        urgencyLevel enum('low', 'medium', 'high', 'critical') NOT NULL,
        predictedFailureDate date,
        confidenceScore decimal(3,2),
        contributingFactors text,
        recommendations text,
        estimatedCost decimal(10,2),
        modelVersion varchar(50),
        status enum('predicted', 'acknowledged', 'scheduled', 'resolved', 'false_positive') DEFAULT 'predicted',
        resolvedAt datetime,
        actualFailureDate date,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_predictive_vehicle (vehicleId),
        INDEX idx_predictive_date (predictionDate),
        INDEX idx_predictive_component (componentType),
        INDEX idx_predictive_urgency (urgencyLevel),
        INDEX idx_predictive_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create passenger_behavior_analytics table for AI-powered insights
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS passenger_behavior_analytics (
        id int AUTO_INCREMENT PRIMARY KEY,
        studentId int,
        routeId int,
        tripId int,
        boardingStopId int,
        alightingStopId int,
        boardingTime datetime,
        alightingTime datetime,
        travelDuration int,
        farePaid decimal(8,2),
        paymentMethod varchar(50),
        deviceType enum('mobile_app', 'qr_card', 'cash', 'web') NOT NULL,
        journeyPattern text,
        frequencyScore int,
        loyaltyScore int,
        satisfactionScore int,
        preferredTimeSlot varchar(50),
        preferredDay varchar(50),
        companionCount int,
        specialAssistance boolean DEFAULT false,
        weatherCondition varchar(50),
        specialEvent varchar(100),
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_behavior_student (studentId),
        INDEX idx_behavior_route (routeId),
        INDEX idx_behavior_trip (tripId),
        INDEX idx_behavior_date (boardingTime),
        INDEX idx_behavior_device (deviceType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create smart_notifications table for intelligent notification system
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS smart_notifications (
        id int AUTO_INCREMENT PRIMARY KEY,
        userId int NOT NULL,
        notificationType enum('trip_reminder', 'delay_alert', 'route_change', 'maintenance_alert', 'safety_alert', 'promotional', 'feedback_request', 'payment_reminder') NOT NULL,
        title varchar(255) NOT NULL,
        message text NOT NULL,
        priority enum('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        channels json,
        scheduledAt datetime,
        sentAt datetime,
        readAt datetime,
        status enum('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending',
        responseRequired boolean DEFAULT false,
        responseReceived boolean DEFAULT false,
        responseData text,
        metadata json,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_notifications_user (userId),
        INDEX idx_notifications_type (notificationType),
        INDEX idx_notifications_status (status),
        INDEX idx_notifications_scheduled (scheduledAt),
        INDEX idx_notifications_priority (priority)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create payment_transactions table for integrated payment system
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id int AUTO_INCREMENT PRIMARY KEY,
        transactionReference varchar(100) NOT NULL,
        userId int NOT NULL,
        studentId int,
        transactionType enum('transport_fare', 'monthly_pass', 'semester_pass', 'trip_pass', 'penalty', 'refund') NOT NULL,
        amount decimal(10,2) NOT NULL,
        currency varchar(3) DEFAULT 'NGN',
        paymentMethod enum('mobile_money', 'card', 'bank_transfer', 'wallet', 'cash') NOT NULL,
        paymentGateway varchar(50),
        gatewayTransactionId varchar(255),
        status enum('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
        processedAt datetime,
        failedReason text,
        refundAmount decimal(10,2),
        refundReason text,
        refundedAt datetime,
        metadata json,
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_transactions_reference (transactionReference),
        INDEX idx_transactions_user (userId),
        INDEX idx_transactions_student (studentId),
        INDEX idx_transactions_type (transactionType),
        INDEX idx_transactions_status (status),
        INDEX idx_transactions_date (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create mobile_app_analytics table for app usage analytics
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS mobile_app_analytics (
        id int AUTO_INCREMENT PRIMARY KEY,
        userId int,
        sessionId varchar(255),
        eventType enum('app_open', 'app_close', 'screen_view', 'button_click', 'qr_scan', 'payment_attempt', 'booking_confirm', 'feedback_submit', 'location_access', 'notification_received') NOT NULL,
        screenName varchar(100),
        eventData json,
        deviceInfo json,
        appVersion varchar(50),
        timestamp datetime NOT NULL,
        sessionDuration int,
        ipAddress varchar(45),
        createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_analytics_user (userId),
        INDEX idx_analytics_session (sessionId),
        INDEX idx_analytics_event (eventType),
        INDEX idx_analytics_timestamp (timestamp),
        INDEX idx_analytics_screen (screenName)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Add foreign key constraints
    const foreignKeys = [
      'ALTER TABLE mobile_app_sessions ADD CONSTRAINT fk_sessions_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE',
      'ALTER TABLE gps_tracking_realtime ADD CONSTRAINT fk_gps_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE',
      'ALTER TABLE gps_tracking_realtime ADD CONSTRAINT fk_gps_trip FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE',
      'ALTER TABLE route_optimization ADD CONSTRAINT fk_optimization_route FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE',
      'ALTER TABLE demand_forecasting ADD CONSTRAINT fk_forecast_route FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE',
      'ALTER TABLE predictive_maintenance_ai ADD CONSTRAINT fk_predictive_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE',
      'ALTER TABLE passenger_behavior_analytics ADD CONSTRAINT fk_behavior_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL',
      'ALTER TABLE passenger_behavior_analytics ADD CONSTRAINT fk_behavior_route FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE',
      'ALTER TABLE passenger_behavior_analytics ADD CONSTRAINT fk_behavior_trip FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE',
      'ALTER TABLE smart_notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE',
      'ALTER TABLE payment_transactions ADD CONSTRAINT fk_transactions_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE',
      'ALTER TABLE payment_transactions ADD CONSTRAINT fk_transactions_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL',
      'ALTER TABLE mobile_app_analytics ADD CONSTRAINT fk_analytics_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL'
    ];

    for (const fk of foreignKeys) {
      try {
        await connection.execute(fk);
      } catch (error) {
        // Foreign key might already exist, continue
        console.log(`Note: ${error.message}`);
      }
    }

    // Insert sample Phase 4 data
    await insertPhase4SampleData(connection);

    console.log('✅ Phase 4 Transportation Tables Created Successfully!');
    console.log('📋 New Advanced Tables Added:');
    console.log('  - mobile_app_sessions (mobile app session management)');
    console.log('  - gps_tracking_realtime (real-time GPS tracking)');
    console.log('  - route_optimization (AI-powered route planning)');
    console.log('  - demand_forecasting (AI-powered demand prediction)');
    console.log('  - predictive_maintenance_ai (AI-powered maintenance prediction)');
    console.log('  - passenger_behavior_analytics (AI-powered behavior insights)');
    console.log('  - smart_notifications (intelligent notification system)');
    console.log('  - payment_transactions (integrated payment system)');
    console.log('  - mobile_app_analytics (mobile app usage analytics)');
    
  } catch (error) {
    console.error('❌ Error creating Phase 4 tables:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function insertPhase4SampleData(connection) {
  console.log('📝 Inserting Phase 4 sample data...');
  
  // Get existing data
  const [vehicles] = await connection.execute('SELECT id, registrationNumber FROM vehicles LIMIT 3');
  const [users] = await connection.execute('SELECT id FROM users WHERE role = "student" LIMIT 5');
  const [routes] = await connection.execute('SELECT id FROM routes LIMIT 3');
  const [trips] = await connection.execute('SELECT id, routeId FROM trips LIMIT 5');

  // Insert sample mobile app sessions
  const mobileSessions = [
    {
      userId: users[0]?.id,
      deviceType: 'android',
      deviceId: 'ANDROID_' + Date.now() + '_1',
      appVersion: '1.0.0',
      pushToken: 'push_token_android_1',
      ipAddress: '192.168.1.100'
    },
    {
      userId: users[1]?.id,
      deviceType: 'ios',
      deviceId: 'IOS_' + Date.now() + '_1',
      appVersion: '1.0.0',
      pushToken: 'push_token_ios_1',
      ipAddress: '192.168.1.101'
    }
  ];

  for (const session of mobileSessions) {
    if (session.userId) {
      await connection.execute(`
        INSERT INTO mobile_app_sessions (userId, deviceType, deviceId, appVersion, pushToken, ipAddress)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        session.userId, session.deviceType, session.deviceId,
        session.appVersion || null, session.pushToken || null, session.ipAddress
      ]);
    }
  }

  // Insert sample GPS tracking data (simulated real-time data)
  const gpsData = [];
  const now = new Date();
  
  for (let i = 0; i < 10; i++) {
    const timestamp = new Date(now.getTime() - (9 - i) * 60000); // Every minute for last 10 minutes
    gpsData.push({
      vehicleId: vehicles[0]?.id,
      tripId: trips[0]?.id,
      latitude: 7.3964 + (Math.random() - 0.5) * 0.01,
      longitude: 3.9170 + (Math.random() - 0.5) * 0.01,
      speed: Math.floor(Math.random() * 60) + 20, // 20-80 km/h
      heading: Math.floor(Math.random() * 360),
      timestamp: timestamp,
      ignitionStatus: true,
      gpsStatus: 'active',
      batteryLevel: Math.floor(Math.random() * 30) + 70, // 70-100%
      fuelLevel: Math.floor(Math.random() * 40) + 30, // 30-70%
      odometerReading: 15000 + i * 2,
      engineStatus: 'running',
      doorStatus: 'closed'
    });
  }

  for (const gps of gpsData) {
    if (gps.vehicleId) {
      await connection.execute(`
        INSERT INTO gps_tracking_realtime (vehicleId, latitude, longitude, 
          speed, heading, timestamp, ignitionStatus, gpsStatus, batteryLevel, 
          fuelLevel, odometerReading, engineStatus, doorStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        gps.vehicleId, gps.latitude, gps.longitude,
        gps.speed, gps.heading, gps.timestamp, gps.ignitionStatus,
        gps.gpsStatus, gps.batteryLevel, gps.fuelLevel,
        gps.odometerReading, gps.engineStatus, gps.doorStatus
      ]);
    }
  }

  // Insert sample route optimization data
  const routeOptimizations = [
    {
      routeId: routes[0]?.id,
      optimizationDate: new Date().toISOString().split('T')[0],
      originalDistance: 8.5,
      optimizedDistance: 7.8,
      originalTime: 45,
      optimizedTime: 42,
      fuelSavings: 15.50,
      timeSavings: 3,
      trafficConditions: JSON.stringify({ congestion_level: 'medium', incidents: 0 }),
      weatherConditions: JSON.stringify({ temperature: 28, condition: 'clear', visibility: 'good' }),
      optimizationAlgorithm: 'genetic_algorithm_v2',
      confidenceScore: 0.85,
      recommendations: JSON.stringify(['Leave 5 minutes earlier', 'Take alternative route during peak hours']),
      applied: true,
      appliedAt: new Date()
    }
  ];

  for (const optimization of routeOptimizations) {
    if (optimization.routeId) {
      await connection.execute(`
        INSERT INTO route_optimization (routeId, optimizationDate, originalDistance, 
          optimizedDistance, originalTime, optimizedTime, fuelSavings, timeSavings,
          trafficConditions, weatherConditions, optimizationAlgorithm, confidenceScore,
          recommendations, applied, appliedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        optimization.routeId, optimization.optimizationDate, optimization.originalDistance,
        optimization.optimizedDistance, optimization.originalTime, optimization.optimizedTime,
        optimization.fuelSavings, optimization.timeSavings, optimization.trafficConditions,
        optimization.weatherConditions, optimization.optimizationAlgorithm,
        optimization.confidenceScore, optimization.recommendations,
        optimization.applied, optimization.appliedAt
      ]);
    }
  }

  // Insert sample demand forecasting data
  const demandForecasts = [
    {
      routeId: routes[0]?.id,
      forecastDate: new Date().toISOString().split('T')[0],
      forecastType: 'daily',
      predictedBoardings: 85,
      predictedRevenue: 4250.00,
      confidenceLevel: 0.78,
      factors: JSON.stringify(['day_of_week', 'weather', 'academic_calendar', 'historical_data']),
      modelVersion: 'demand_forecast_v1.2',
      actualBoardings: 82,
      actualRevenue: 4100.00,
      accuracy: 0.96
    },
    {
      routeId: routes[1]?.id,
      forecastDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      forecastType: 'daily',
      predictedBoardings: 65,
      predictedRevenue: 1950.00,
      confidenceLevel: 0.82,
      factors: JSON.stringify(['day_of_week', 'weather', 'historical_data']),
      modelVersion: 'demand_forecast_v1.2'
    }
  ];

  for (const forecast of demandForecasts) {
    if (forecast.routeId) {
      await connection.execute(`
        INSERT INTO demand_forecasting (routeId, forecastDate, forecastType, 
          predictedBoardings, predictedRevenue, confidenceLevel, factors, 
          modelVersion, actualBoardings, actualRevenue, accuracy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        forecast.routeId, forecast.forecastDate, forecast.forecastType,
        forecast.predictedBoardings, forecast.predictedRevenue, forecast.confidenceLevel,
        forecast.factors, forecast.modelVersion, forecast.actualBoardings,
        forecast.actualRevenue, forecast.accuracy
      ]);
    }
  }

  // Insert sample predictive maintenance data
  const predictiveMaintenance = [
    {
      vehicleId: vehicles[0]?.id,
      predictionDate: new Date().toISOString().split('T')[0],
      componentType: 'brakes',
      failureProbability: 0.15,
      urgencyLevel: 'medium',
      predictedFailureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      confidenceScore: 0.73,
      contributingFactors: JSON.stringify(['mileage', 'brake_pad_wear', 'driving_conditions']),
      recommendations: JSON.stringify(['Inspect brake pads within 2 weeks', 'Monitor brake fluid levels']),
      estimatedCost: 25000.00,
      modelVersion: 'maintenance_predictor_v1.0',
      status: 'predicted'
    },
    {
      vehicleId: vehicles[1]?.id,
      predictionDate: new Date().toISOString().split('T')[0],
      componentType: 'battery',
      failureProbability: 0.35,
      urgencyLevel: 'high',
      predictedFailureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      confidenceScore: 0.81,
      contributingFactors: JSON.stringify(['battery_age', 'charging_system', 'weather_conditions']),
      recommendations: JSON.stringify(['Replace battery within 1 week', 'Check alternator output']),
      estimatedCost: 45000.00,
      modelVersion: 'maintenance_predictor_v1.0',
      status: 'acknowledged'
    }
  ];

  for (const maintenance of predictiveMaintenance) {
    if (maintenance.vehicleId) {
      await connection.execute(`
        INSERT INTO predictive_maintenance_ai (vehicleId, predictionDate, componentType, 
          failureProbability, urgencyLevel, predictedFailureDate, confidenceScore, 
          contributingFactors, recommendations, estimatedCost, modelVersion, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        maintenance.vehicleId, maintenance.predictionDate, maintenance.componentType,
        maintenance.failureProbability, maintenance.urgencyLevel, maintenance.predictedFailureDate,
        maintenance.confidenceScore, maintenance.contributingFactors, maintenance.recommendations,
        maintenance.estimatedCost, maintenance.modelVersion, maintenance.status
      ]);
    }
  }

  // Insert sample smart notifications
  const notifications = [
    {
      userId: users[0]?.id,
      notificationType: 'trip_reminder',
      title: 'Trip Departure Reminder',
      message: 'Your regular trip on Main Campus Shuttle departs in 30 minutes from Main Gate.',
      priority: 'medium',
      channels: JSON.stringify(['push', 'email', 'sms']),
      scheduledAt: new Date(Date.now() + 30 * 60 * 1000),
      status: 'pending',
      responseRequired: false,
      metadata: JSON.stringify({ routeId: routes[0]?.id, departureTime: '08:00' })
    },
    {
      userId: users[1]?.id,
      notificationType: 'delay_alert',
      title: 'Trip Delay Alert',
      message: 'Your Science Faculty Express trip is delayed by 15 minutes due to traffic.',
      priority: 'high',
      channels: JSON.stringify(['push', 'sms']),
      scheduledAt: new Date(),
      status: 'sent',
      responseRequired: false,
      metadata: JSON.stringify({ routeId: routes[1]?.id, delayMinutes: 15 })
    }
  ];

  for (const notification of notifications) {
    if (notification.userId) {
      await connection.execute(`
        INSERT INTO smart_notifications (userId, notificationType, title, message, 
          priority, channels, scheduledAt, status, responseRequired, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        notification.userId, notification.notificationType, notification.title,
        notification.message, notification.priority, notification.channels,
        notification.scheduledAt, notification.status, notification.responseRequired,
        notification.metadata || null
      ]);
    }
  }

  // Insert sample payment transactions
  const transactions = [
    {
      transactionReference: 'TXN' + Date.now() + '_1',
      userId: users[0]?.id,
      studentId: users[0]?.id,
      transactionType: 'monthly_pass',
      amount: 3000.00,
      currency: 'NGN',
      paymentMethod: 'mobile_money',
      paymentGateway: 'flutterwave',
      gatewayTransactionId: 'FLW_' + Date.now() + '_1',
      status: 'completed',
      processedAt: new Date(),
      metadata: JSON.stringify({ passType: 'monthly', routeId: routes[0]?.id, validity: '30_days' })
    },
    {
      transactionReference: 'TXN' + Date.now() + '_2',
      userId: users[1]?.id,
      studentId: users[1]?.id,
      transactionType: 'transport_fare',
      amount: 30.00,
      currency: 'NGN',
      paymentMethod: 'wallet',
      status: 'completed',
      processedAt: new Date(),
      metadata: JSON.stringify({ tripId: trips[1]?.id, fareAmount: 30.00, paymentMethod: 'wallet' })
    }
  ];

  for (const transaction of transactions) {
    if (transaction.userId) {
      await connection.execute(`
        INSERT INTO payment_transactions (transactionReference, userId, studentId, 
          transactionType, amount, currency, paymentMethod, paymentGateway, 
          gatewayTransactionId, status, processedAt, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transaction.transactionReference, transaction.userId, transaction.studentId,
        transaction.transactionType, transaction.amount, transaction.currency,
        transaction.paymentMethod, transaction.paymentGateway || null,
        transaction.gatewayTransactionId || null, transaction.status,
        transaction.processedAt, transaction.metadata || null
      ]);
    }
  }

  // Insert sample mobile app analytics
  const analytics = [
    {
      userId: users[0]?.id,
      sessionId: mobileSessions[0]?.deviceId,
      eventType: 'app_open',
      deviceInfo: JSON.stringify({ platform: 'android', version: '1.0.0', device: 'Samsung Galaxy S21' }),
      appVersion: '1.0.0',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      ipAddress: '192.168.1.100'
    },
    {
      userId: users[0]?.id,
      sessionId: mobileSessions[0]?.deviceId,
      eventType: 'screen_view',
      screenName: 'dashboard',
      eventData: JSON.stringify({ screenLoadTime: 1.2, interactions: 5 }),
      deviceInfo: JSON.stringify({ platform: 'android', version: '1.0.0', device: 'Samsung Galaxy S21' }),
      appVersion: '1.0.0',
      timestamp: new Date(Date.now() - 59 * 60 * 1000),
      sessionDuration: 60,
      ipAddress: '192.168.1.100'
    },
    {
      userId: users[1]?.id,
      sessionId: mobileSessions[1]?.deviceId,
      eventType: 'qr_scan',
      eventData: JSON.stringify({ scanSuccess: true, scanTime: 0.8, qrType: 'boarding_pass' }),
      deviceInfo: JSON.stringify({ platform: 'ios', version: '1.0.0', device: 'iPhone 13' }),
      appVersion: '1.0.0',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      ipAddress: '192.168.1.101'
    }
  ];

  for (const analytic of analytics) {
    if (analytic.userId) {
      await connection.execute(`
        INSERT INTO mobile_app_analytics (userId, sessionId, eventType, screenName, 
          eventData, deviceInfo, appVersion, timestamp, sessionDuration, ipAddress)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        analytic.userId, analytic.sessionId || null, analytic.eventType, analytic.screenName || null,
        analytic.eventData || null, analytic.deviceInfo || null, analytic.appVersion || null,
        analytic.timestamp, analytic.sessionDuration || null, analytic.ipAddress || null
      ]);
    }
  }

  console.log('✅ Phase 4 sample data inserted successfully!');
}

createPhase4TransportationTables();
