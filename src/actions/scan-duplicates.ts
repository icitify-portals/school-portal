"use server";

// ═══════════════════════════════════════════════════════════════════
// DUPLICATE STUDENT SCAN
// Scans for duplicate records by name, email, and matric number
// ═══════════════════════════════════════════════════════════════════

import { db } from "@/db/db";
import { students, users } from "@/db/schema";
import { eq, and, sql, isNotNull, isNull } from "drizzle-orm";

export async function scanForDuplicateStudents() {
  try {
    const results = {
      duplicateEmails: [] as any[],
      duplicateMatricNumbers: [] as any[],
      duplicateNames: [] as any[],
      orphanStudents: [] as any[], // students with no user record
      summary: { total: 0, duplicates: 0 },
    };

    // 1. Duplicate emails
    const emailDuplicates = await db.execute(sql`
      SELECT email, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM users
      WHERE email IS NOT NULL AND email != ''
      GROUP BY LOWER(email)
      HAVING COUNT(*) > 1
    `);
    results.duplicateEmails = (emailDuplicates as any[]).map(r => ({
      email: r.email,
      count: r.count,
      ids: r.ids,
    }));

    // 2. Duplicate matric numbers
    const matricDuplicates = await db.execute(sql`
      SELECT matric_number, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM students
      WHERE matric_number IS NOT NULL AND matric_number != ''
      GROUP BY matric_number
      HAVING COUNT(*) > 1
    `);
    results.duplicateMatricNumbers = (matricDuplicates as any[]).map(r => ({
      matricNumber: r.matric_number,
      count: r.count,
      ids: r.ids,
    }));

    // 3. Duplicate names (same first + last name, same programme type)
    const nameDuplicates = await db.execute(sql`
      SELECT first_name, last_name, programme_type, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM students
      WHERE first_name IS NOT NULL AND last_name IS NOT NULL
      GROUP BY LOWER(first_name), LOWER(last_name), programme_type
      HAVING COUNT(*) > 1
    `);
    results.duplicateNames = (nameDuplicates as any[]).map(r => ({
      firstName: r.first_name,
      lastName: r.last_name,
      programmeType: r.programme_type,
      count: r.count,
      ids: r.ids,
    }));

    // 4. Orphan students (no linked user)
    const orphans = await db.execute(sql`
      SELECT s.id, s.first_name, s.last_name, s.matric_number, s.user_id
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE u.id IS NULL
      LIMIT 100
    `);
    results.orphanStudents = (orphans as any[]).map(r => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      matricNumber: r.matric_number,
      userId: r.user_id,
    }));

    // Summary
    results.summary.total = (await db.select({ count: sql`count(*)` }).from(students))[0].count;
    results.summary.duplicates = results.duplicateEmails.length + results.duplicateMatricNumbers.length;

    return results;
  } catch (error: any) {
    return { error: error.message };
  }
}
