
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
    // Try both 127.0.0.1 and localhost
    const hosts = ['127.0.0.1', 'localhost'];
    let connection;

    for (const host of hosts) {
        try {
            console.log(`Connecting to ${host}...`);
            connection = await mysql.createConnection({
                host: host,
                user: 'root',
                database: 'moodledb',
                port: 3306
            });
            console.log(`Connected to ${host}`);
            break;
        } catch (err) {
            console.log(`Failed to connect to ${host}: ${err.message}`);
        }
    }

    if (!connection) {
        console.error("Could not connect to any host.");
        process.exit(1);
    }

    try {
        console.log("Checking academic_sessions table...");
        const [tables] = await connection.query("SHOW TABLES LIKE 'academic_sessions'");

        if (tables.length === 0) {
            console.log("academic_sessions table MISSING! Creating it...");
            await connection.query(`
                CREATE TABLE \`academic_sessions\` (
                    \`id\` int AUTO_INCREMENT NOT NULL,
                    \`name\` varchar(255) NOT NULL,
                    \`start_date\` date,
                    \`end_date\` date,
                    \`is_current\` boolean DEFAULT false,
                    \`current_semester\` enum('1','2') DEFAULT '1',
                    \`is_registration_open\` boolean DEFAULT false,
                    \`is_add_drop_open\` boolean DEFAULT false,
                    \`registration_type\` enum('annual','semester') DEFAULT 'semester',
                    \`status\` enum('planned','active','archived') DEFAULT 'planned',
                    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                    \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY(\`id\`)
                )
            `);
            console.log("Table created.");
        } else {
            console.log("academic_sessions table exists. Checking columns...");
            const [cols] = await connection.query("SHOW COLUMNS FROM academic_sessions");
            const colNames = cols.map(c => c.Field);
            console.log("Current columns:", colNames.join(', '));

            const missing = [];
            if (!colNames.includes('is_add_drop_open')) missing.push("ADD COLUMN `is_add_drop_open` boolean DEFAULT false");
            if (!colNames.includes('registration_type')) missing.push("ADD COLUMN `registration_type` enum('annual','semester') DEFAULT 'semester'");

            if (missing.length > 0) {
                console.log("Missing columns found. Altering table...");
                const sql = `ALTER TABLE \`academic_sessions\` ${missing.join(', ')}`;
                await connection.query(sql);
                console.log("Table altered successfully.");
            } else {
                console.log("No columns missing.");
            }
        }
    } catch (err) {
        console.error("Operation failed:", err.message);
    } finally {
        await connection.end();
    }
}

fix();
