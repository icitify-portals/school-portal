import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function migrate() {
    if (!connectionString) {
        console.error("DATABASE_URL not found");
        return;
    }

    const connection = await mysql.createConnection(connectionString);
    console.log("Connected to MySQL (Faculties Schema Sync)...");

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        const statements = [
            `CREATE TABLE IF NOT EXISTS \`faculties\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`code\` varchar(15) NOT NULL,
                CONSTRAINT \`faculties_id\` PRIMARY KEY(\`id\`),
                UNIQUE (\`code\`)
            );`,
            // Ensure department has facultyId
            `ALTER TABLE \`departments\` ADD COLUMN IF NOT EXISTS \`faculty_id\` int;`,
            `ALTER TABLE \`departments\` ADD CONSTRAINT \`departments_faculty_id_faculties_id_fk\` FOREIGN KEY IF NOT EXISTS (\`faculty_id\`) REFERENCES \`faculties\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION;`
        ];

        for (const sql of statements) {
            console.log(`Executing: ${sql.substring(0, 50)}...`);
            try {
                await connection.query(sql);
            } catch (err) {
                if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY' || err.code === 'ER_DUP_FIELDNAME') {
                    console.log("  (Already exists, skipping)");
                } else {
                    throw err;
                }
            }
        }

        console.log("Faculties Schema Sync successful!");
    } catch (error) {
        console.error("Faculties Schema Sync failed:", error);
    } finally {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        await connection.end();
    }
}

migrate();
