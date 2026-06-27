import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    console.log("Updating conduct schema...");
    
    await connection.execute(`DROP TABLE IF EXISTS student_conduct_logs`);
    console.log("Dropped old table");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS conduct_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_type ENUM('student', 'staff') NOT NULL,
        student_id INT,
        staff_id INT,
        infraction VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        date_of_incident DATE NOT NULL,
        senate_sanction ENUM('none', 'warning', 'suspension', 'expulsion', 'rustication', 'termination', 'demotion') DEFAULT 'none',
        sanction_start_date DATE,
        sanction_end_date DATE,
        status ENUM('active', 'resolved', 'appealed') DEFAULT 'active',
        logged_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (staff_id) REFERENCES staff_profiles(id),
        FOREIGN KEY (logged_by) REFERENCES users(id)
      )
    `);
    console.log("Created conduct_logs table successfully");
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}
run();
