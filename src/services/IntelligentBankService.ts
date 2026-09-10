import { db } from "@/db/db";
import { bankQuestions, unifiedExamAttempts, unifiedExamResponses, unifiedExamQuestions, unifiedExams } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * CBT-4: Intelligent Question Bank
 * - Difficulty distribution (easy/medium/hard) for pooled exams
 * - Discrimination index + usage count
 */

export async function getBankAnalytics(bankId: number) {
  const questions = await db.select().from(bankQuestions).where(eq(bankQuestions.bankId, bankId));
  const analytics = await Promise.all(questions.map(async q => {
    const attempts = await db.select({ isCorrect: unifiedExamResponses.isCorrect }).from(unifiedExamResponses)
      .innerJoin(unifiedExamQuestions, eq(unifiedExamResponses.questionId, unifiedExamQuestions.id))
      .innerJoin(unifiedExamAttempts, eq(unifiedExamResponses.attemptId, unifiedExamAttempts.id))
      .where(eq(unifiedExamQuestions.bankQuestionId, q.id));
    const total = attempts.length;
    const correct = attempts.filter(a => a.isCorrect).length;
    const pValue = total > 0 ? correct / total : 0; // difficulty
    // Discrimination: top 27% vs bottom 27% (simplified)
    let discrimination = 0;
    if (total >= 10) {
      const sorted = [...attempts].sort((a,b) => (a.isCorrect?1:0) - (b.isCorrect?1:0));
      const top = sorted.slice(-Math.floor(total*0.27));
      const bottom = sorted.slice(0, Math.floor(total*0.27));
      const topCorrect = top.filter(a=>a.isCorrect).length / (top.length||1);
      const bottomCorrect = bottom.filter(a=>a.isCorrect).length / (bottom.length||1);
      discrimination = topCorrect - bottomCorrect;
    }
    return {
      questionId: q.id,
      text: q.questionText.slice(0, 50),
      difficulty: q.difficultyLevel,
      usageCount: total,
      pValue: Number(pValue.toFixed(2)),
      discrimination: Number(discrimination.toFixed(2)),
      tags: q.tags,
    };
  }));
  return analytics;
}

export async function drawQuestionsForExam(examId: number): Promise<number[]> {
  const [exam] = await db.select().from(unifiedExams).where(eq(unifiedExams.id, examId)).limit(1);
  if (!exam || !exam.isPooled || !exam.drawCount) return [];
  // Example distribution: 30% easy, 50% medium, 20% hard
  const total = exam.drawCount;
  const needEasy = Math.floor(total * 0.3);
  const needMedium = Math.floor(total * 0.5);
  const needHard = total - needEasy - needMedium;

  const poolQuestions = await db.select().from(unifiedExamQuestions).where(eq(unifiedExamQuestions.examId, examId)).limit(100);
  // In pooled mode, questions are already linked via bankQuestionId, we draw from those
  const byDifficulty = {
    easy: poolQuestions.filter(q => q.poolDifficulty === 'easy'),
    medium: poolQuestions.filter(q => q.poolDifficulty === 'medium'),
    hard: poolQuestions.filter(q => q.poolDifficulty === 'hard'),
  };
  const draw = (arr: any[], n: number) => arr.sort(() => Math.random() - 0.5).slice(0, n).map(q => q.id);
  return [...draw(byDifficulty.easy, needEasy), ...draw(byDifficulty.medium, needMedium), ...draw(byDifficulty.hard, needHard)];
}
