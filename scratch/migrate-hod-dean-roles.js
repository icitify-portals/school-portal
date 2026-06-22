import mysql from 'mysql2/promise';

async function run() {
    try {
        const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");
        console.log("Connected to school_portal database successfully.");

        // Run ALTER TABLE to expand the ENUM to include 'hod' and 'dean'
        console.log("Altering 'users' table to add 'hod' and 'dean' roles...");
        await connection.execute(
            `ALTER TABLE users MODIFY COLUMN role 
             ENUM('admin','staff','student','dvc','healthadmin','applicant','fresher','superadmin','parent','icitify_dev','bursar','registrar','librarian','hod','dean') 
             DEFAULT 'student'`
        );
        console.log("Database schema altered successfully! 'hod' and 'dean' roles are now active.");

        await connection.end();
    } catch (e) {
        console.error("Migration failed:", e);
    }
}

run();
