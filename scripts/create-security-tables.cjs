const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    console.log("Creating security_vehicles table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS security_vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT,
        owner_name VARCHAR(255) NOT NULL,
        owner_type ENUM('student', 'staff', 'visitor', 'other') NOT NULL,
        license_plate VARCHAR(50) NOT NULL,
        vehicle_make VARCHAR(100) NOT NULL,
        vehicle_model VARCHAR(100) NOT NULL,
        vehicle_color VARCHAR(50) NOT NULL,
        pass_number VARCHAR(100) UNIQUE NOT NULL,
        status ENUM('pending', 'approved', 'expired', 'revoked') NOT NULL DEFAULT 'pending',
        qr_code VARCHAR(500),
        expires_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log("Creating security_vehicle_logs table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS security_vehicle_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        gate_name VARCHAR(100) NOT NULL,
        direction ENUM('entry', 'exit') NOT NULL,
        security_officer_id INT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES security_vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (security_officer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Creating security_strategic_positions table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS security_strategic_positions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        qr_code VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Creating security_patrol_logs table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS security_patrol_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        checkpoint_id INT NOT NULL,
        patrol_officer_id INT NOT NULL,
        notes TEXT,
        gps_coordinates VARCHAR(100),
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (checkpoint_id) REFERENCES security_strategic_positions(id) ON DELETE CASCADE,
        FOREIGN KEY (patrol_officer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Creating security_incidents table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS security_incidents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        incident_type ENUM('theft', 'trespass', 'property_damage', 'assault', 'accident', 'fire_hazard', 'medical_emergency', 'other') NOT NULL,
        severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
        location VARCHAR(255) NOT NULL,
        reported_by INT NOT NULL,
        status ENUM('reported', 'under_investigation', 'resolved', 'closed') NOT NULL DEFAULT 'reported',
        resolution_notes TEXT,
        resolved_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Security tables created successfully!");
  } catch (e) {
    console.error("Migration error:", e);
  } finally {
    await connection.end();
  }
}
run();
