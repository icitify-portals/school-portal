import mysql from 'mysql2/promise';

async function run() {
    try {
        const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");
        
        console.log("=== RUNNING JOURNAL MIGRATIONS ===");
        
        // 1. Add columns to journal_articles
        const articlesCols = [
            "ALTER TABLE journal_articles ADD COLUMN funding TEXT NULL",
            "ALTER TABLE journal_articles ADD COLUMN conflict_of_interest TEXT NULL",
            "ALTER TABLE journal_articles ADD COLUMN section VARCHAR(255) NULL",
            "ALTER TABLE journal_articles ADD COLUMN pages VARCHAR(50) NULL",
            "ALTER TABLE journal_articles ADD COLUMN starting_page INT NULL",
            "ALTER TABLE journal_articles ADD COLUMN ending_page INT NULL"
        ];
        
        for (const sql of articlesCols) {
            try {
                await connection.execute(sql);
                console.log(`Executed: ${sql}`);
            } catch (err) {
                console.log(`Skipped or failed (likely already exists): ${err.message}`);
            }
        }
        
        // 2. Add columns to journal_article_authors
        const authorsCols = [
            "ALTER TABLE journal_article_authors ADD COLUMN is_corresponding TINYINT(1) DEFAULT 0"
        ];
        
        for (const sql of authorsCols) {
            try {
                await connection.execute(sql);
                console.log(`Executed: ${sql}`);
            } catch (err) {
                console.log(`Skipped or failed (likely already exists): ${err.message}`);
            }
        }
        
        console.log("=== MIGRATIONS COMPLETE ===");
        
        await connection.end();
    } catch (e) {
        console.error("Migration failed:", e);
    }
}

run();
