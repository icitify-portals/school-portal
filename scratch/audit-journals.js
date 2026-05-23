import mysql from 'mysql2/promise';

async function run() {
    try {
        const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");
        
        console.log("=== COUNT journals ===");
        const [countJournals] = await connection.execute("SELECT COUNT(*) as count FROM journals");
        console.log(countJournals);

        console.log("=== COUNT journal_issues ===");
        const [countIssues] = await connection.execute("SELECT COUNT(*) as count FROM journal_issues");
        console.log(countIssues);

        console.log("=== SELECT journals ===");
        const [journals] = await connection.execute("SELECT * FROM journals");
        console.log(journals);
        
        await connection.end();
    } catch (e) {
        console.error("Error connecting or querying:", e);
    }
}

run();
