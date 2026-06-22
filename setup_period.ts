import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS financial_periods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        status ENUM('open', 'soft_closed', 'hard_closed') DEFAULT 'open',
        closed_by INT,
        closed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (closed_by) REFERENCES users(id)
      )
    `);
    console.log('Table created');
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
