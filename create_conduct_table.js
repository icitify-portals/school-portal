import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS student_conduct_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        infraction VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        date_of_incident DATE NOT NULL,
        senate_sanction ENUM('none', 'warning', 'suspension', 'expulsion', 'rustication') DEFAULT 'none',
        sanction_start_date DATE,
        sanction_end_date DATE,
        status ENUM('active', 'resolved', 'appealed') DEFAULT 'active',
        logged_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (logged_by) REFERENCES users(id)
      )
    `);
    console.log("Table created successfully");
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}
run();
