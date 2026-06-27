import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    console.log("Creating extended admission schemas...");
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admission_leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        program_of_interest VARCHAR(255),
        source VARCHAR(100),
        status ENUM('new', 'contacted', 'applied', 'cold') DEFAULT 'new',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created admission_leads table");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admission_waitlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NOT NULL,
        rank_position INT,
        status ENUM('waiting', 'offered', 'rejected') DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES admission_applications_v2(id)
      )
    `);
    console.log("Created admission_waitlists table");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admission_interviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NOT NULL,
        interview_date DATETIME,
        interviewer_id INT,
        mode ENUM('physical', 'virtual') DEFAULT 'physical',
        location_or_link VARCHAR(500),
        status ENUM('scheduled', 'completed', 'no_show', 'cancelled') DEFAULT 'scheduled',
        score INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES admission_applications_v2(id),
        FOREIGN KEY (interviewer_id) REFERENCES users(id)
      )
    `);
    console.log("Created admission_interviews table");
    
    console.log("Done!");
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}
run();
