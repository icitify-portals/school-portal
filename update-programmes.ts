import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
    console.log("Connecting to db...");
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    
    // 1. Add studyMode to students if not exists
    try {
        console.log("Adding studyMode to students...");
        await connection.query("ALTER TABLE students ADD COLUMN study_mode ENUM('full-time', 'part-time') DEFAULT 'full-time'");
        console.log("Column added.");
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error("Error adding column:", e);
        }
    }

    // 2. Set students study mode based on modeOfEntry
    console.log("Updating student study modes...");
    const [result] = await connection.query("UPDATE students SET study_mode = IF(mode_of_entry = 'JAMB' OR mode_of_entry = 'UTME', 'full-time', 'part-time')");
    console.log("Students updated:", (result as any).affectedRows);

    // 3. Update programmes to 24 months duration and ensure OND/HND for each department
    console.log("Fetching current departments...");
    const [depts] = await connection.query("SELECT id, name FROM departments");

    for (const d of depts as any[]) {
        const ondName = `OND ${d.name}`;
        const hndName = `HND ${d.name}`;
        
        // Find existing programmes for this dept
        const [existing] = await connection.query("SELECT id FROM programmes WHERE dept_id = ?", [d.id]);
        const programmesList = existing as any[];
        
        if (programmesList.length > 0) {
            // Update the first one to OND
            const firstId = programmesList[0].id;
            await connection.query(
                "UPDATE programmes SET name = ?, duration_months = ?, duration_years = ? WHERE id = ?",
                [ondName, 24, 2, firstId]
            );
            
            // Delete others if there are any
            for (let i = 1; i < programmesList.length; i++) {
                // To avoid FK constraints, map any students to the first one before deleting
                await connection.query("UPDATE students SET programme_id = ? WHERE programme_id = ?", [firstId, programmesList[i].id]);
                await connection.query("DELETE FROM programmes WHERE id = ?", [programmesList[i].id]);
            }
            
            // Insert HND
            await connection.query(
                "INSERT INTO programmes (dept_id, name, duration_months, duration_years, cut_off_mark, merit_quota, scoring_strategy) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [d.id, hndName, 24, 2, 180, 45, 'JAMB_ONLY']
            );
        } else {
            // Insert both OND and HND
            await connection.query(
                "INSERT INTO programmes (dept_id, name, duration_months, duration_years, cut_off_mark, merit_quota, scoring_strategy) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [d.id, ondName, 24, 2, 180, 45, 'JAMB_ONLY']
            );
            await connection.query(
                "INSERT INTO programmes (dept_id, name, duration_months, duration_years, cut_off_mark, merit_quota, scoring_strategy) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [d.id, hndName, 24, 2, 180, 45, 'JAMB_ONLY']
            );
        }
    }
    console.log("Programmes updated successfully.");
    
    process.exit(0);
}

main().catch(console.error);
