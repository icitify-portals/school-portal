import { db } from './src/db/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    try {
        console.log('Creating phd_applications table...');
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS phd_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                research_title VARCHAR(500) NOT NULL,
                status VARCHAR(100) DEFAULT 'applied',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            );
        `);

        console.log('Creating phd_supervisors table...');
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS phd_supervisors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                phd_application_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                staff_profile_id INT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                token VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                responded_at TIMESTAMP,
                FOREIGN KEY (phd_application_id) REFERENCES phd_applications(id) ON DELETE CASCADE,
                FOREIGN KEY (staff_profile_id) REFERENCES staff_profiles(id) ON DELETE SET NULL
            );
        `);

        console.log('Creating phd_theses table...');
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS phd_theses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                phd_application_id INT NOT NULL,
                file_url TEXT NOT NULL,
                turnitin_report_url TEXT,
                turnitin_score INT,
                status VARCHAR(100) DEFAULT 'draft',
                is_corrected_version BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (phd_application_id) REFERENCES phd_applications(id) ON DELETE CASCADE
            );
        `);

        console.log('Creating phd_review_logs table...');
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS phd_review_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                phd_thesis_id INT NOT NULL,
                reviewer_id INT NOT NULL,
                stage VARCHAR(100) NOT NULL,
                action VARCHAR(50) NOT NULL,
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (phd_thesis_id) REFERENCES phd_theses(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        console.log('Creating phd_examiners table...');
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS phd_examiners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                phd_application_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                honorarium_amount VARCHAR(100),
                payment_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (phd_application_id) REFERENCES phd_applications(id) ON DELETE CASCADE
            );
        `);

        console.log('Creating phd_defenses table...');
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS phd_defenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                phd_application_id INT NOT NULL,
                defense_date TIMESTAMP NOT NULL,
                location VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'scheduled',
                provost_approved_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (phd_application_id) REFERENCES phd_applications(id) ON DELETE CASCADE
            );
        `);

        console.log('PhD tables created successfully!');
    } catch (e) {
        console.error('Migration failed:', e);
    }
    process.exit(0);
}

migrate();
