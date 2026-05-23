import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
    try {
        console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log('Connected to database.');

        // Check columns manually for compatibility
        const [existingColumns] = await connection.execute("DESCRIBE results");
        const columnNames = existingColumns.map(c => (c.Field || c.field).toLowerCase());

        const addColumn = async (colName, colDef) => {
            if (!columnNames.includes(colName.toLowerCase())) {
                await connection.execute(`ALTER TABLE results ADD COLUMN ${colName} ${colDef}`);
                console.log(`Added column: ${colName}`);
            } else {
                console.log(`Column ${colName} already exists.`);
            }
        };

        await addColumn('ca_score', 'DECIMAL(5,2) DEFAULT 0.00');
        await addColumn('exam_score', 'DECIMAL(5,2) DEFAULT 0.00');
        await addColumn('total_score', 'DECIMAL(5,2) DEFAULT 0.00');
        await addColumn('grade_point', 'DECIMAL(4,2) DEFAULT 0.00');
        await addColumn('is_gpa_course', 'BOOLEAN DEFAULT TRUE');
        await addColumn('last_edited_by', 'INT NULL');
        await addColumn('last_edited_at', 'TIMESTAMP NULL');

        // result_audit_logs table
        await connection.execute(`CREATE TABLE IF NOT EXISTS result_audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            result_id INT NOT NULL,
            editor_id INT NOT NULL,
            old_ca_score DECIMAL(5,2),
            new_ca_score DECIMAL(5,2),
            old_exam_score DECIMAL(5,2),
            new_exam_score DECIMAL(5,2),
            old_total_score DECIMAL(5,2),
            new_total_score DECIMAL(5,2),
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
            FOREIGN KEY (editor_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
        console.log('Audit logs table ready.');

        console.log('Migration completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
