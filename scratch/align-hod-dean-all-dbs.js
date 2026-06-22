import mysql from 'mysql2/promise';

async function run() {
    const targetDbs = ['school_portal', 'portal_ajat_academy', 'portal_citadel_uni'];

    for (const dbName of targetDbs) {
        try {
            const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${dbName}`);
            console.log(`\nConnected to ${dbName} database successfully.`);

            // 1. Fetch user ID for staff@demo.edu
            const [users] = await connection.execute("SELECT id FROM users WHERE email = 'staff@demo.edu'");
            if (users.length === 0) {
                console.log("staff@demo.edu user not found, skipping.");
                await connection.end();
                continue;
            }
            const userId = users[0].id;
            console.log(`Found staff@demo.edu user with ID: ${userId}`);

            // 2. Ensure Faculty exists
            let facultyId;
            const [facs] = await connection.execute("SELECT id FROM faculties LIMIT 1");
            if (facs.length === 0) {
                console.log("No faculties found. Creating default 'Science' faculty...");
                const [newFac] = await connection.execute("INSERT INTO faculties (name) VALUES ('Science')");
                facultyId = newFac.insertId;
            } else {
                facultyId = facs[0].id;
            }
            console.log(`Using Faculty ID: ${facultyId}`);

            // 3. Ensure Department exists
            let deptId;
            const [depts] = await connection.execute("SELECT id FROM departments LIMIT 1");
            if (depts.length === 0) {
                console.log("No departments found. Creating default 'Doctorate College of Sciences' department...");
                const [newDept] = await connection.execute(
                    "INSERT INTO departments (name, faculty_id, code) VALUES ('Doctorate College of Sciences', ?, 'CSC')",
                    [facultyId]
                );
                deptId = newDept.insertId;
            } else {
                deptId = depts[0].id;
            }
            console.log(`Using Department ID: ${deptId}`);

            // 4. Ensure HOD Institutional Unit exists
            let unit1Id;
            const [existingUnits1] = await connection.execute(
                "SELECT id FROM institutional_units WHERE head_user_id = ? AND type = 'department' LIMIT 1",
                [userId]
            );

            if (existingUnits1.length > 0) {
                unit1Id = existingUnits1[0].id;
                console.log(`Reusing existing Department HOD Unit ID: ${unit1Id}`);
            } else {
                console.log("Creating new HOD Institutional Unit...");
                const code1 = "DEPT_" + deptId + "_UNIT_" + Math.floor(1000 + Math.random() * 9000);
                const slug1 = "dept-" + deptId + "-unit-" + Math.floor(1000 + Math.random() * 9000);
                const [unit1Res] = await connection.execute(
                    "INSERT INTO institutional_units (name, code, slug, head_user_id, type) VALUES ('Department HOD Unit', ?, ?, ?, 'department')",
                    [code1, slug1, userId]
                );
                unit1Id = unit1Res.insertId;
                console.log(`Created Department HOD Unit with ID: ${unit1Id}`);
            }

            // Link department to the unit
            await connection.execute(
                "UPDATE departments SET unit_id = ? WHERE id = ?",
                [unit1Id, deptId]
            );

            // 5. Ensure Dean Institutional Unit exists
            let unit2Id;
            const [existingUnits2] = await connection.execute(
                "SELECT id FROM institutional_units WHERE head_user_id = ? AND type = 'faculty' LIMIT 1",
                [userId]
            );

            if (existingUnits2.length > 0) {
                unit2Id = existingUnits2[0].id;
                console.log(`Reusing existing Faculty Governance Unit ID: ${unit2Id}`);
            } else {
                console.log("Creating new Dean Institutional Unit...");
                const code2 = "FAC_" + facultyId + "_UNIT_" + Math.floor(1000 + Math.random() * 9000);
                const slug2 = "fac-" + facultyId + "-unit-" + Math.floor(1000 + Math.random() * 9000);
                const [unit2Res] = await connection.execute(
                    "INSERT INTO institutional_units (name, code, slug, head_user_id, type) VALUES ('Faculty Governance Unit', ?, ?, ?, 'faculty')",
                    [code2, slug2, userId]
                );
                unit2Id = unit2Res.insertId;
                console.log(`Created Faculty Governance Unit with ID: ${unit2Id}`);
            }

            // Link faculty to the unit
            await connection.execute(
                "UPDATE faculties SET unit_id = ? WHERE id = ?",
                [unit2Id, facultyId]
            );

            // 6. Link staff profile to Department and HOD unit
            console.log(`Linking staff profile to department ${deptId}...`);
            await connection.execute(
                "UPDATE staff_profiles SET department_id = ?, unit_id = ? WHERE user_id = ?",
                [deptId, unit1Id, userId]
            );

            console.log(`=== ${dbName} GOVERNANCE ALIGNED SUCCESSFUL ===`);
            await connection.end();
        } catch (e) {
            console.error(`Failed to align governance in ${dbName}:`, e);
        }
    }
}

run();
