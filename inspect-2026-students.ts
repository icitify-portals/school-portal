import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    // Search for any matric numbers containing 2026
    console.log("=== MATRIC NUMBERS CONTAINING '2026' ===");
    const with2026 = await db.execute(sql`
      SELECT s.id, s.matric_number, s.admission_number, u.id as user_id, u.name, u.email, u.role
      FROM students s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.matric_number LIKE '%2026%' OR s.admission_number LIKE '%2026%'
      LIMIT 30
    `);
    const rows2026 = (with2026 as any)[0] as any[];
    console.log(`Found ${rows2026.length} records with '2026' in matric/admission number:`);
    rows2026.forEach((r: any) => {
      console.log(`  [${r.id}] ${r.name} | matric: ${r.matric_number} | admission: ${r.admission_number} | role: ${r.role}`);
    });

    // Also check users with role 'student' and see their pattern
    console.log("\n=== DISTINCT MATRIC NUMBER PREFIXES ===");
    const prefixes = await db.execute(sql`
      SELECT SUBSTRING_INDEX(matric_number, '/', 1) as prefix, COUNT(*) as count
      FROM students
      WHERE matric_number IS NOT NULL AND matric_number != ''
      GROUP BY prefix
      ORDER BY count DESC
      LIMIT 30
    `);
    console.log(JSON.stringify((prefixes as any)[0], null, 2));

    // Check users table directly for any with '2026' in name or email
    console.log("\n=== USERS WITH 'stu' or '2026' IN EMAIL ===");
    const stuUsers = await db.execute(sql`
      SELECT id, name, email, role, status
      FROM users
      WHERE email LIKE '%stu%2026%' OR email LIKE '%2026%'
      LIMIT 30
    `);
    const stuRows = (stuUsers as any)[0] as any[];
    console.log(`Found ${stuRows.length}:`);
    stuRows.forEach((r: any) => {
      console.log(`  [${r.id}] ${r.name} | ${r.email} | role: ${r.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
