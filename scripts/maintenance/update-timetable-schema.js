
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        console.log("Creating course_lecturers table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`course_lecturers\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`session_id\` int NOT NULL,
                \`course_id\` int NOT NULL,
                \`staff_id\` int NOT NULL,
                \`dept_id\` int NOT NULL,
                \`semester\` enum('1','2') NOT NULL,
                \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`course_lecturers_id\` PRIMARY KEY(\`id\`),
                FOREIGN KEY (\`session_id\`) REFERENCES \`academic_sessions\`(\`id\`),
                FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`),
                FOREIGN KEY (\`staff_id\`) REFERENCES \`staff_profiles\`(\`id\`),
                FOREIGN KEY (\`dept_id\`) REFERENCES \`departments\`(\`id\`)
            )
        `);

        console.log("Creating timetable_slots table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`timetable_slots\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`course_lecturer_id\` int NOT NULL,
                \`day\` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
                \`start_time\` varchar(5) NOT NULL,
                \`end_time\` varchar(5) NOT NULL,
                \`venue\` varchar(255) NOT NULL,
                \`level\` int NOT NULL,
                CONSTRAINT \`timetable_slots_id\` PRIMARY KEY(\`id\`),
                FOREIGN KEY (\`course_lecturer_id\`) REFERENCES \`course_lecturers\`(\`id\`)
            )
        `);

        console.log("Schema update complete!");
    } catch (err) {
        console.error("Update failed:", err.message);
    } finally {
        await connection.end();
    }
}

fix();
