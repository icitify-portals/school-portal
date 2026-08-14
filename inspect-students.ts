import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    // 1. Check the actual column name in the students table
    console.log("=== STUDENTS TABLE COLUMNS ===");
    const cols = await db.execute(sql`DESCRIBE students`);
    console.log(JSON.stringify((cols as any)[0], null, 2));

    // 2. Sample some rows to see actual matric number format
    console.log("\n=== SAMPLE MATRIC NUMBERS (first 20) ===");
    const sample = await db.execute(sql`
      SELECT id, matric_number, admission_number, user_id FROM students LIMIT 20
    `);
    console.log(JSON.stringify((sample as any)[0], null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
