import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS graduation_clearances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        status ENUM('pending', 'cleared', 'rejected') DEFAULT 'pending',
        library_status ENUM('pending', 'cleared', 'rejected') DEFAULT 'pending',
        bursary_status ENUM('pending', 'cleared', 'rejected') DEFAULT 'pending',
        department_status ENUM('pending', 'cleared', 'rejected') DEFAULT 'pending',
        registrar_status ENUM('pending', 'cleared', 'rejected') DEFAULT 'pending',
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `);
    console.log("Table graduation_clearances created successfully");
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}
run();
