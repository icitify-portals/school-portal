import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const [rows] = await db.execute(sql`SELECT email, role FROM users`);
    console.table(rows);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
