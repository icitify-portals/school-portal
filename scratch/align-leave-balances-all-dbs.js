import mysql from 'mysql2/promise';

async function run() {
    const targetDbs = ['school_portal', 'portal_ajat_academy', 'portal_citadel_uni'];
    const currentYear = new Date().getFullYear();

    for (const dbName of targetDbs) {
        try {
            const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${dbName}`);
            console.log(`\nConnected to ${dbName} database successfully.`);

            // 1. Fetch all staff profiles
            const [staffProfiles] = await connection.execute("SELECT id, user_id FROM staff_profiles");
            console.log(`Found ${staffProfiles.length} staff profiles in ${dbName}.`);

            for (const staff of staffProfiles) {
                // Check if they already have a leave balance record for the current year
                const [balances] = await connection.execute(
                    "SELECT id FROM leave_balances WHERE staff_id = ? AND year = ?",
                    [staff.id, currentYear]
                );
                
                if (balances.length === 0) {
                    console.log(`Creating default leave balances for staff profile ID: ${staff.id}...`);
                    await connection.execute(
                        `INSERT INTO leave_balances (staff_id, year, annual, sick, maternity, study, casual) 
                         VALUES (?, ?, 20, 10, 90, 15, 5)`,
                        [staff.id, currentYear]
                    );
                } else {
                    console.log(`Updating existing leave balances to matching allocations for staff profile ID: ${staff.id}...`);
                    await connection.execute(
                        `UPDATE leave_balances 
                         SET annual = 20, sick = 10, maternity = 90, study = 15, casual = 5 
                         WHERE staff_id = ? AND year = ?`,
                        [staff.id, currentYear]
                    );
                }
            }

            console.log(`=== ${dbName} LEAVE BALANCES ALIGNED SUCCESSFULLY ===`);
            await connection.end();
        } catch (e) {
            console.error(`Failed to align leave balances in ${dbName}:`, e);
        }
    }
}

run();
