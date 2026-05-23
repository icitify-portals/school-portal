import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function migrate() {
  if (!connectionString) {
    console.error("DATABASE_URL not found");
    return;
  }

  // Extract connection details from many standard formats
  // If it's a URL format like mysql://user:pass@host:port/db
  const connection = await mysql.createConnection(connectionString);
  console.log("Connected to MySQL (Hostel Schema Sync)...");

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Drop legacy tables if they exist to ensure new schema is applied
    console.log("Dropping legacy hostel tables...");
    await connection.query('DROP TABLE IF EXISTS `hostel_applications`;');
    await connection.query('DROP TABLE IF EXISTS `hostel_rooms`;');
    await connection.query('DROP TABLE IF EXISTS `hostel_blocks`;');
    await connection.query('DROP TABLE IF EXISTS `hostel_settings`;');
    await connection.query('DROP TABLE IF EXISTS `room_allocations`;');
    await connection.query('DROP TABLE IF EXISTS `rooms`;');
    await connection.query('DROP TABLE IF EXISTS `hostels`;');

    const statements = [
      `CREATE TABLE IF NOT EXISTS \`hostels\` (
              \`id\` int AUTO_INCREMENT NOT NULL,
              \`name\` varchar(255) NOT NULL,
              \`code\` varchar(50) NOT NULL UNIQUE,
              \`type\` enum('male','female','mixed') DEFAULT 'mixed',
              \`capacity\` int DEFAULT 0,
              \`is_active\` boolean DEFAULT true,
              \`description\` text,
              \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT \`hostels_id\` PRIMARY KEY(\`id\`)
            );`,
      `CREATE TABLE IF NOT EXISTS \`hostel_blocks\` (
              \`id\` int AUTO_INCREMENT NOT NULL,
              \`hostel_id\` int,
              \`name\` varchar(100) NOT NULL,
              \`floor_count\` int DEFAULT 1,
              CONSTRAINT \`hostel_blocks_id\` PRIMARY KEY(\`id\`),
              FOREIGN KEY (\`hostel_id\`) REFERENCES \`hostels\`(\`id\`)
            );`,
      `CREATE TABLE IF NOT EXISTS \`hostel_rooms\` (
              \`id\` int AUTO_INCREMENT NOT NULL,
              \`block_id\` int,
              \`room_number\` varchar(50) NOT NULL,
              \`capacity\` int DEFAULT 4,
              \`occupied_count\` int DEFAULT 0,
              \`gender\` enum('male','female') NOT NULL,
              \`price\` decimal(12,2) DEFAULT '0.00',
              \`is_available\` boolean DEFAULT true,
              CONSTRAINT \`hostel_rooms_id\` PRIMARY KEY(\`id\`),
              FOREIGN KEY (\`block_id\`) REFERENCES \`hostel_blocks\`(\`id\`)
            );`,
      `CREATE TABLE IF NOT EXISTS \`hostel_applications\` (
              \`id\` int AUTO_INCREMENT NOT NULL,
              \`student_id\` int,
              \`session_id\` int,
              \`hostel_id\` int,
              \`status\` enum('pending','approved','rejected','allocated','expired') DEFAULT 'pending',
              \`is_priority\` boolean DEFAULT false,
              \`payment_deadline\` timestamp NULL,
              \`payment_status\` enum('unpaid','paid') DEFAULT 'unpaid',
              \`allocated_room_id\` int,
              \`applied_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT \`hostel_applications_id\` PRIMARY KEY(\`id\`),
              FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`),
              FOREIGN KEY (\`session_id\`) REFERENCES \`academic_sessions\`(\`id\`),
              FOREIGN KEY (\`hostel_id\`) REFERENCES \`hostels\`(\`id\`),
              FOREIGN KEY (\`allocated_room_id\`) REFERENCES \`hostel_rooms\`(\`id\`)
            );`,
      `CREATE TABLE IF NOT EXISTS \`hostel_settings\` (
              \`id\` int AUTO_INCREMENT NOT NULL,
              \`hostel_id\` int UNIQUE,
              \`payment_window_days\` int DEFAULT 3,
              \`allocation_strategy\` enum('manual','dynamic') DEFAULT 'manual',
              \`min_level_priority\` int DEFAULT 100,
              \`max_level_priority\` int DEFAULT 500,
              CONSTRAINT \`hostel_settings_id\` PRIMARY KEY(\`id\`),
              FOREIGN KEY (\`hostel_id\`) REFERENCES \`hostels\`(\`id\`)
            );`
    ];

    for (const sql of statements) {
      console.log(`Checking/Creating table...`);
      await connection.query(sql);
    }

    console.log("Hostel Schema Sync successful!");
  } catch (error) {
    console.error("Hostel Schema Sync failed:", error);
  } finally {
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    await connection.end();
  }
}

migrate();
