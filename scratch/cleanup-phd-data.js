import mysql from 'mysql2/promise';

async function run() {
    console.log("Starting database cleanup to remove all PhD and Referee seed records...");

    const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");

    try {
        await connection.beginTransaction();

        // 1. Fetch all seed PhD application IDs to safely tear down children
        const [apps] = await connection.execute(
            "SELECT id FROM phd_applications WHERE research_title LIKE '[TEST-SEED]%'"
        );
        const appIds = apps.map(app => app.id);
        console.log(`Found ${appIds.length} seeded PhD applications to remove.`);

        if (appIds.length > 0) {
            const appIdList = appIds.join(',');

            // 1a. Delete review logs first (foreign keys to theses)
            const [theses] = await connection.execute(
                `SELECT id FROM phd_theses WHERE phd_application_id IN (${appIdList})`
            );
            const thesisIds = theses.map(t => t.id);
            if (thesisIds.length > 0) {
                const thesisIdList = thesisIds.join(',');
                console.log("Removing review logs...");
                await connection.execute(`DELETE FROM phd_review_logs WHERE phd_thesis_id IN (${thesisIdList})`);
                console.log("Removing theses...");
                await connection.execute(`DELETE FROM phd_theses WHERE id IN (${thesisIdList})`);
            }

            // 1b. Delete supervisors, defenses, examiners
            console.log("Removing supervisors...");
            await connection.execute(`DELETE FROM phd_supervisors WHERE phd_application_id IN (${appIdList})`);
            
            console.log("Removing defenses...");
            await connection.execute(`DELETE FROM phd_defenses WHERE phd_application_id IN (${appIdList})`);
            
            console.log("Removing examiners...");
            await connection.execute(`DELETE FROM phd_examiners WHERE phd_application_id IN (${appIdList})`);

            // 1c. Delete applications themselves
            console.log("Removing applications...");
            await connection.execute(`DELETE FROM phd_applications WHERE id IN (${appIdList})`);
        }

        // 2. Remove referee invitations
        console.log("Removing referee invitations...");
        const [refResult] = await connection.execute(
            "DELETE FROM referee_invitations WHERE referee_name LIKE '[TEST-SEED]%'"
        );
        console.log(`Removed ${refResult.affectedRows} referee invitations.`);

        // 3. Remove student bills, students, and users
        console.log("Removing student bill records...");
        const testStudentIds = [2001, 2002, 2003, 2004, 2005, 2006];
        const studentIdList = testStudentIds.join(',');
        await connection.execute(`DELETE FROM student_bills WHERE student_id IN (${studentIdList})`);

        console.log("Removing test student records...");
        await connection.execute(`DELETE FROM students WHERE id IN (${studentIdList})`);

        console.log("Removing test reviewer staff profile...");
        await connection.execute(`DELETE FROM staff_profiles WHERE id = 1010`);

        console.log("Removing test users...");
        await connection.execute(`DELETE FROM users WHERE id IN (${studentIdList}) OR id = 1010`);

        // Commit transaction
        await connection.commit();
        console.log("\nDatabase cleanup completed successfully! All seed records have been purged.");

    } catch (error) {
        await connection.rollback();
        console.error("Database cleanup failed:", error);
    } finally {
        await connection.end();
    }
}

run();
