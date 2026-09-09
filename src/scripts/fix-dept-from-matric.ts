/**
 * fix-dept-from-matric.ts
 * Fixes students whose department/programme doesn't match their matric number's dept code.
 * Matric is the source of truth for imports from previous DB.
 * Usage: npx tsx src/scripts/fix-dept-from-matric.ts [--dry]
 */
import { db } from "../db/db";
import { students, departments, programmes } from "../db/schema";
import { eq } from "drizzle-orm";
import { parseMatric } from "../lib/matric-parser";

const ALIAS: Record<string, string> = { STAT: "STA" };

async function main() {
  const dry = process.argv.includes("--dry");
  const depts = await db.select().from(departments);
  const byCode = new Map<string, any>();
  for (const d of depts) byCode.set(d.code.toUpperCase(), d);

  const all = await db.select({ id: students.id, matricNumber: students.matricNumber, deptId: students.deptId, programmeId: students.programmeId, programmeType: students.programmeType }).from(students);
  let mismatched = 0, fixed = 0;
  for (const s of all) {
    if (!s.matricNumber) continue;
    const parsed = parseMatric(s.matricNumber);
    if (!parsed.isValid || !parsed.department || parsed.confidence < 0.85) continue;
    let code = parsed.department.toUpperCase();
    if (ALIAS[code]) code = ALIAS[code];
    const targetDept = byCode.get(code);
    if (!targetDept) continue;
    if (s.deptId === targetDept.id) continue;
    mismatched++;
    const progs = await db.select().from(programmes).where(eq(programmes.deptId, targetDept.id));
    const targetProg = progs.find(p => p.programmeType === s.programmeType) || progs[0];
    const newProgId = targetProg ? targetProg.id : s.programmeId;
    console.log(`${dry ? "[DRY]" : ""} Fix ${s.id} ${s.matricNumber} dept ${s.deptId}->${targetDept.id} (${code}) prog ${s.programmeId}->${newProgId}`);
    if (!dry) {
      await db.update(students).set({ deptId: targetDept.id, programmeId: newProgId as any }).where(eq(students.id, s.id));
      fixed++;
    }
  }
  console.log(`${dry ? "Would fix" : "Fixed"} ${fixed} / ${mismatched} mismatched`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
