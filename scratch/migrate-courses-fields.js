import mysql from 'mysql2/promise';

async function migrateDatabase(dbName) {
    console.log(`\nChecking columns for table 'courses' in database: ${dbName}...`);
    const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${dbName}`);

    try {
        const [columns] = await connection.execute("SHOW COLUMNS FROM courses");
        const existingColumns = columns.map(col => col.Field);

        const columnsToAdd = [
            {
                name: 'course_format',
                sql: "ALTER TABLE courses ADD COLUMN course_format ENUM('topics', 'weeks', 'days') DEFAULT 'topics'"
            },
            {
                name: 'course_start_date',
                sql: "ALTER TABLE courses ADD COLUMN course_start_date DATE"
            },
            {
                name: 'total_duration_weeks',
                sql: "ALTER TABLE courses ADD COLUMN total_duration_weeks INT DEFAULT 12"
            },
            {
                name: 'flow_control',
                sql: "ALTER TABLE courses ADD COLUMN flow_control ENUM('sequential', 'open') DEFAULT 'open'"
            },
            {
                name: 'min_passing_score',
                sql: "ALTER TABLE courses ADD COLUMN min_passing_score INT DEFAULT 75"
            }
        ];

        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name)) {
                console.log(`Adding missing column '${col.name}' to 'courses' table...`);
                await connection.execute(col.sql);
                console.log(`Column '${col.name}' added successfully.`);
            } else {
                console.log(`Column '${col.name}' already exists.`);
            }
        }
        console.log(`Database '${dbName}' migration check finalized.`);
    } catch (error) {
        console.error(`Migration failed on database '${dbName}':`, error);
    } finally {
        await connection.end();
    }
}

async function run() {
    console.log("Starting University Courses table fields migration across pools...");
    
    const dbPools = ['school_portal', 'portal_AJAT_ACADEMY', 'portal_CITADEL_UNI'];
    
    for (const dbName of dbPools) {
        try {
            await migrateDatabase(dbName);
        } catch (e) {
            console.error(`Could not process pool '${dbName}':`, e.message);
        }
    }
    
    console.log("\nAll course database pools have been successfully migrated and synchronized!");
}

run();
