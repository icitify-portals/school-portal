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
    console.log("Connected to MySQL...");

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        const statements = [
            `CREATE TABLE IF NOT EXISTS \`badge_templates\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`image_url\` varchar(255),
                \`criteria\` text,
                \`issuer_name\` varchar(255) DEFAULT 'Academic Portal',
                \`issuer_url\` varchar(255),
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`badge_templates_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`issued_badges\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`badge_id\` int NOT NULL,
                \`student_id\` int NOT NULL,
                \`issued_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                \`assertion_url\` varchar(255),
                \`evidence_url\` varchar(255),
                CONSTRAINT \`issued_badges_id\` PRIMARY KEY(\`id\`),
                CONSTRAINT \`issued_badges_badge_id_badge_templates_id_fk\` FOREIGN KEY (\`badge_id\`) REFERENCES \`badge_templates\`(\`id\`),
                CONSTRAINT \`issued_badges_student_id_students_id_fk\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`course_certificates\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`course_id\` int NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`description\` text,
                \`signature_name\` varchar(255),
                \`signature_title\` varchar(255),
                \`logo_url\` varchar(255),
                \`min_completion_threshold\` int DEFAULT 100,
                \`min_grade_threshold\` decimal(5,2),
                \`is_active\` boolean DEFAULT true,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`course_certificates_id\` PRIMARY KEY(\`id\`),
                CONSTRAINT \`course_certificates_course_id_courses_id_fk\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`issued_certificates\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`certificate_id\` int NOT NULL,
                \`student_id\` int NOT NULL,
                \`course_id\` int NOT NULL,
                \`certificate_code\` varchar(100) NOT NULL,
                \`issued_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                \`pdf_url\` varchar(255),
                CONSTRAINT \`issued_certificates_id\` PRIMARY KEY(\`id\`),
                CONSTRAINT \`issued_certificates_certificate_code_unique\` UNIQUE(\`certificate_code\`),
                CONSTRAINT \`issued_certificates_certificate_id_course_certificates_id_fk\` FOREIGN KEY (\`certificate_id\`) REFERENCES \`course_certificates\`(\`id\`),
                CONSTRAINT \`issued_certificates_student_id_students_id_fk\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`),
                CONSTRAINT \`issued_certificates_course_id_courses_id_fk\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`)
            );`
        ];

        for (const sql of statements) {
            console.log(`Executing statement...`);
            await connection.query(sql);
        }

        console.log("Migration successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        await connection.end();
    }
}

migrate();
