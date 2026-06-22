import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Creating O-Level Tables...");
    
    try {
        await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`examination_bodies\` (
            \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
            \`name\` varchar(50) NOT NULL,
            \`is_active\` boolean DEFAULT true,
            \`created_at\` timestamp DEFAULT (now()),
            CONSTRAINT \`examination_bodies_name_unique\` UNIQUE(\`name\`)
        );
        `);

        await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`applicant_olevel_sittings\` (
            \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
            \`applicant_id\` int NOT NULL,
            \`application_id\` int NOT NULL,
            \`exam_body_id\` int NOT NULL,
            \`exam_year\` varchar(4) NOT NULL,
            \`exam_number\` varchar(50) NOT NULL,
            \`sitting_number\` int NOT NULL,
            \`created_at\` timestamp DEFAULT (now()),
            \`updated_at\` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (\`applicant_id\`) REFERENCES \`users\`(\`id\`),
            FOREIGN KEY (\`application_id\`) REFERENCES \`admission_applications_v2\`(\`id\`),
            FOREIGN KEY (\`exam_body_id\`) REFERENCES \`examination_bodies\`(\`id\`)
        );
        `);

        await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`applicant_olevel_subjects\` (
            \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
            \`sitting_id\` int NOT NULL,
            \`subject_name\` varchar(100) NOT NULL,
            \`grade\` varchar(10) NOT NULL,
            \`created_at\` timestamp DEFAULT (now()),
            FOREIGN KEY (\`sitting_id\`) REFERENCES \`applicant_olevel_sittings\`(\`id\`)
        );
        `);

        console.log("Successfully created O-Level tables!");
    } catch (e) {
        console.error("Error creating tables:", e);
    }
    
    process.exit(0);
}

run();
