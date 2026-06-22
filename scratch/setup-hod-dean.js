import mysql from 'mysql2/promise';

async function run() {
    try {
        const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");
        console.log("Connected to school_portal database successfully.");

        // 1. Fetch user ID for staff@demo.edu
        const [users] = await connection.execute("SELECT id FROM users WHERE email = 'staff@demo.edu'");
        if (users.length === 0) {
            throw new Error("staff@demo.edu user not found.");
        }
        const userId = users[0].id;
        console.log(`Found staff@demo.edu user with ID: ${userId}`);

        // 2. Link staff profile to Department 1 (Doctorate College of Sciences)
        console.log("Linking staff profile to department 1...");
        await connection.execute(
            "UPDATE staff_profiles SET department_id = 1 WHERE user_id = ?",
            [userId]
        );

        // 3. Create Institutional Unit for Department 1 (Doctorate College of Sciences)
        console.log("Creating Institutional Unit for HOD (Department 1)...");
        const code1 = "DEPT_1_UNIT_" + Math.floor(Math.random() * 10000);
        const slug1 = "dept-1-unit-" + Math.floor(Math.random() * 10000);
        const [unit1Res] = await connection.execute(
            "INSERT INTO institutional_units (name, code, slug, head_user_id, type) VALUES ('Doctorate College Unit', ?, ?, ?, 'department')",
            [code1, slug1, userId]
        );
        const unit1Id = unit1Res.insertId;
        console.log(`Created Doctorate College Unit with ID: ${unit1Id}`);

        // 4. Link Department 1 to the HOD unit
        await connection.execute(
            "UPDATE departments SET unit_id = ? WHERE id = 1",
            [unit1Id]
        );
        console.log("Linked Department 1 to the new HOD Institutional Unit.");

        // 5. Create Institutional Unit for Faculty 7 (Science)
        console.log("Creating Institutional Unit for Dean (Faculty 7)...");
        const code2 = "FAC_7_UNIT_" + Math.floor(Math.random() * 10000);
        const slug2 = "fac-7-unit-" + Math.floor(Math.random() * 10000);
        const [unit2Res] = await connection.execute(
            "INSERT INTO institutional_units (name, code, slug, head_user_id, type) VALUES ('Science Faculty Governance Unit', ?, ?, ?, 'faculty')",
            [code2, slug2, userId]
        );
        const unit2Id = unit2Res.insertId;
        console.log(`Created Science Faculty Governance Unit with ID: ${unit2Id}`);

        // 6. Link Faculty 7 to the Dean unit
        await connection.execute(
            "UPDATE faculties SET unit_id = ? WHERE id = 7",
            [unit2Id]
        );
        console.log("Linked Faculty 7 to the new Dean Institutional Unit.");

        console.log("=== HOD AND DEAN ROLES LINKED SUCCESSFULLY FOR staff@demo.edu ===");
        
        await connection.end();
    } catch (e) {
        console.error("Failed to setup HOD and Dean:", e);
    }
}

run();
