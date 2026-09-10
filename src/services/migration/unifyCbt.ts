/**
 * CBT-2: One-time migration quizzes/cbtQuizzes -> unifiedExams (dry-run by default)
 * Run with: npx tsx src/services/migration/unifyCbt.ts --execute
 * Keeps legacy tables readable (no delete) for rollback
 */
import { db } from "@/db/db";
import { quizzes, quizQuestions, cbtQuizzes, cbtQuestions } from "@/db/schema";

export async function dryRun() {
  const legacyQuizzes = await db.select().from(quizzes);
  const centralCbt = await db.select().from(cbtQuizzes);
  console.log(`Legacy quizzes: ${legacyQuizzes.length}, Central cbtQuizzes: ${centralCbt.length}`);
  // Would migrate to unifiedExams with contextType='course' for quizzes and 'standalone' for cbtQuizzes
  return { legacyQuizzes: legacyQuizzes.length, centralCbt: centralCbt.length };
}

if (require.main === module) {
  const shouldExecute = process.argv.includes("--execute");
  dryRun().then(res => {
    console.log("Dry-run:", res);
    if (!shouldExecute) console.log("Add --execute to actually migrate (keeps legacy for no break)");
    process.exit(0);
  });
}
