import mysql from 'mysql2/promise';

async function run() {
    const targetDbs = ['school_portal', 'portal_ajat_academy', 'portal_citadel_uni'];

    for (const dbName of targetDbs) {
        try {
            const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${dbName}`);
            console.log(`\nConnected to ${dbName} database successfully.`);

            // 1. Fetch all student users
            const [studentUsers] = await connection.execute("SELECT id, name FROM users WHERE role = 'student'");
            console.log(`Found ${studentUsers.length} student users in ${dbName}.`);

            for (const user of studentUsers) {
                // Check if they already have a student profile
                const [profiles] = await connection.execute("SELECT id FROM students WHERE user_id = ?", [user.id]);
                
                if (profiles.length === 0) {
                    console.log(`Self-healing missing student profile for ${user.name} (ID: ${user.id})...`);
                    const admissionYear = new Date().getFullYear();
                    const matricNumber = `STU/${admissionYear}/${Math.floor(1000 + Math.random() * 9000)}`;
                    const barcode = `${user.name} | ${matricNumber}`;

                    await connection.execute(
                        `INSERT INTO students (user_id, matric_number, current_level, admission_year, barcode, status) 
                         VALUES (?, ?, 100, ?, ?, 'active')`,
                        [user.id, matricNumber, admissionYear, barcode]
                    );
                    console.log(`Profile created successfully: Matric: ${matricNumber}`);
                }
            }

            console.log(`=== ${dbName} STUDENT PROFILES ALIGNED SUCCESSFUL ===`);
            await connection.end();
        } catch (e) {
            console.error(`Failed to align student profiles in ${dbName}:`, e);
        }
    }
}

run();
