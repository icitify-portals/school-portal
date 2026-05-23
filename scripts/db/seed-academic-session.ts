import { db } from '../../src/db';
import { sql } from 'drizzle-orm';

async function seedAcademicSession() {
    try {
        // Check if table exists
        const rows = await db.execute(sql`SELECT COUNT(*) as cnt FROM academic_sessions`);
        console.log('academic_sessions table exists, row count:', JSON.stringify(rows[0]));

        // Check if any rows exist
        const existing = await db.execute(sql`SELECT * FROM academic_sessions LIMIT 5`);
        console.log('Existing sessions:', JSON.stringify(existing[0]));

        if ((existing[0] as any[]).length === 0) {
            console.log('No academic sessions found. Seeding a default session...');
            await db.execute(sql`
        INSERT INTO academic_sessions (name, start_date, end_date, is_current, current_semester, is_registration_open, is_add_drop_open, registration_type, status, is_active, created_at)
        VALUES ('2025/2026', '2025-09-01', '2026-07-31', TRUE, '1', FALSE, FALSE, 'semester', 'active', TRUE, NOW())
      `);
            console.log('✅ Default academic session 2025/2026 created!');
        } else {
            console.log('Academic sessions already exist, no seeding needed.');
        }
    } catch (error: any) {
        if (error.message?.includes("doesn't exist")) {
            console.log('Table does not exist! Creating it...');
            await db.execute(sql`
        CREATE TABLE IF NOT EXISTS academic_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          start_date DATE,
          end_date DATE,
          is_current BOOLEAN DEFAULT FALSE,
          current_semester ENUM('1', '2') DEFAULT '1',
          is_registration_open BOOLEAN DEFAULT FALSE,
          is_add_drop_open BOOLEAN DEFAULT FALSE,
          registration_type ENUM('annual', 'semester') DEFAULT 'semester',
          status ENUM('planned', 'active', 'archived') DEFAULT 'planned',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
        )
      `);
            console.log('✅ academic_sessions table created!');

            await db.execute(sql`
        INSERT INTO academic_sessions (name, start_date, end_date, is_current, current_semester, is_registration_open, is_add_drop_open, registration_type, status, is_active, created_at)
        VALUES ('2025/2026', '2025-09-01', '2026-07-31', TRUE, '1', FALSE, FALSE, 'semester', 'active', TRUE, NOW())
      `);
            console.log('✅ Default academic session 2025/2026 created!');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
    process.exit(0);
}

seedAcademicSession();
