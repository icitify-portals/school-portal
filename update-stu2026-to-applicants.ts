import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Fetching students with matric number STU/2026/...");

    // First, preview who we are going to update
    const preview = await db.execute(sql`
      SELECT u.id, u.name, u.email, u.role, s.matric_number
      FROM users u
      INNER JOIN students s ON s.user_id = u.id
      WHERE s.matric_number LIKE 'STU/2026/%'
    `);

    const rows = (preview as any)[0] as any[];
    console.log(`Found ${rows.length} students with STU/2026/ matric numbers:`);
    rows.forEach((r: any) => {
      console.log(`  - [${r.id}] ${r.name} (${r.email}) | Role: ${r.role} | Matric: ${r.matric_number}`);
    });

    if (rows.length === 0) {
      console.log("No matching students found. Exiting.");
      process.exit(0);
    }

    // Update their role to 'applicant'
    const result = await db.execute(sql`
      UPDATE users u
      INNER JOIN students s ON s.user_id = u.id
      SET u.role = 'applicant'
      WHERE s.matric_number LIKE 'STU/2026/%'
    `);

    console.log(`\n✓ Successfully updated ${rows.length} users to role 'applicant'.`);
    console.log("These users can now log in and apply via the applicant portal.");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
