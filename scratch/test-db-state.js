import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const url = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";
    console.log("Base Database URL:", url);
    try {
        const parsedUrl = new URL(url);
        parsedUrl.pathname = "/"; // connect to root
        const conn = await mysql.createConnection(parsedUrl.toString());
        
        // 1. Show all databases
        const [dbs] = await conn.execute("SHOW DATABASES");
        const dbNames = dbs.map(d => Object.values(d)[0]);
        console.log("Available Databases:", dbNames);

        // 2. Query each relevant database for cms_homepage_sections using fully qualified names
        for (const dbName of ["school_portal", "moodledb"]) {
            if (dbNames.includes(dbName)) {
                console.log(`\n--- Inspecting database: ${dbName} ---`);
                try {
                    const [rows] = await conn.query(`SELECT * FROM \`${dbName}\`.cms_homepage_sections`);
                    console.log(`Found ${rows.length} rows in ${dbName}.cms_homepage_sections:`);
                    rows.forEach(r => {
                        console.log(`- ID: ${r.id}, Type: ${r.section_type || r.type}, Title: "${r.title}", IsActive: ${r.is_active || r.isActive}`);
                    });
                } catch (e) {
                    console.log(`Could not query ${dbName}:`, e.message);
                }
            }
        }
        
        await conn.end();
    } catch (error) {
        console.error("Database connection failed:", error);
    }
}

main();
