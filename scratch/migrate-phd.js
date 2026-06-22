import mysql from 'mysql2/promise';

const databases = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

async function migrate() {
    for (const db of databases) {
        console.log(`Migrating database: ${db}...`);
        try {
            const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${db}`);
            
            // 1. phd_applications
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS phd_applications (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  student_id INT NOT NULL,
                  research_title VARCHAR(500) NOT NULL,
                  abstract TEXT,
                  status ENUM('applied', 'supervisors_pending', 'supervisors_accepted', 'fees_pending', 'fees_paid', 'thesis_uploaded', 'under_review', 'approved_corrections', 'defense_scheduled', 'completed') DEFAULT 'applied',
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (student_id) REFERENCES students(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            // 2. phd_supervisors
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS phd_supervisors (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  phd_application_id INT NOT NULL,
                  type ENUM('internal', 'external') NOT NULL,
                  staff_profile_id INT,
                  name VARCHAR(255) NOT NULL,
                  email VARCHAR(255) NOT NULL,
                  phone VARCHAR(20),
                  token VARCHAR(100) UNIQUE NOT NULL,
                  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  responded_at DATETIME,
                  FOREIGN KEY (phd_application_id) REFERENCES phd_applications(id),
                  FOREIGN KEY (staff_profile_id) REFERENCES staff_profiles(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            // 3. phd_theses
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS phd_theses (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  phd_application_id INT NOT NULL,
                  file_url VARCHAR(500) NOT NULL,
                  turnitin_report_url VARCHAR(500),
                  turnitin_score INT,
                  status ENUM('draft', 'dept_review', 'subdean_review', 'pg_committee_review', 'meeting_pending', 'approved', 'reupload_required') DEFAULT 'draft',
                  is_corrected_version TINYINT(1) DEFAULT 0,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (phd_application_id) REFERENCES phd_applications(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            // 4. phd_review_logs
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS phd_review_logs (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  phd_thesis_id INT NOT NULL,
                  reviewer_id INT NOT NULL,
                  stage ENUM('department', 'subdean', 'pg_committee', 'provost') NOT NULL,
                  action ENUM('approve', 'reject') NOT NULL,
                  comment TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (phd_thesis_id) REFERENCES phd_theses(id),
                  FOREIGN KEY (reviewer_id) REFERENCES users(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            // 5. phd_examiners
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS phd_examiners (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  phd_application_id INT NOT NULL,
                  name VARCHAR(255) NOT NULL,
                  email VARCHAR(255) NOT NULL,
                  type ENUM('internal', 'external') NOT NULL,
                  honorarium_amount DECIMAL(12, 2) DEFAULT 0.00,
                  payment_status ENUM('pending', 'approved_by_provost', 'paid') DEFAULT 'pending',
                  FOREIGN KEY (phd_application_id) REFERENCES phd_applications(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            // 6. phd_defenses
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS phd_defenses (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  phd_application_id INT NOT NULL,
                  defense_date DATETIME NOT NULL,
                  location VARCHAR(255) NOT NULL,
                  status ENUM('scheduled', 'successful', 'failed') DEFAULT 'scheduled',
                  provost_approved_at DATETIME,
                  FOREIGN KEY (phd_application_id) REFERENCES phd_applications(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            // 7. referee_invitations
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS referee_invitations (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  application_id INT NOT NULL,
                  application_type ENUM('postgraduate', 'job') NOT NULL,
                  referee_name VARCHAR(255) NOT NULL,
                  referee_email VARCHAR(255) NOT NULL,
                  token VARCHAR(100) UNIQUE NOT NULL,
                  status ENUM('pending', 'completed') DEFAULT 'pending',
                  relationship_capacity VARCHAR(150),
                  relationship_years INT,
                  ratings_json TEXT,
                  recommendation_level ENUM('highly_recommend', 'recommend', 'reservations', 'no_recommend'),
                  reference_letter TEXT,
                  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  responded_at DATETIME
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
