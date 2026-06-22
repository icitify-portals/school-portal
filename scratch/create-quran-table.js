import mysql from 'mysql2/promise';

const databases = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

async function migrate() {
    for (const db of databases) {
        console.log(`Migrating database: ${db}...`);
        try {
            const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${db}`);
            
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS quran_memorization_logs (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  student_id INT NOT NULL,
                  session_id INT NOT NULL,
                  term ENUM('1', '2', '3') NOT NULL,
                  surah_name VARCHAR(100) NOT NULL,
                  status ENUM('memorized', 'in_progress', 'not_started') DEFAULT 'not_started',
                  tajweed_rating INT DEFAULT 0,
                  fluency_rating INT DEFAULT 0,
                  teacher_remark TEXT,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  FOREIGN KEY (student_id) REFERENCES students(id),
                  FOREIGN KEY (session_id) REFERENCES academic_sessions(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            
            console.log(`Successfully migrated ${db}!`);
            await connection.end();
        } catch (e) {
            console.error(`Error migrating ${db}:`, e.message);
        }
    }
}

migrate();
