"use server";

// ═══════════════════════════════════════════════════════════════════
// ADMISSION CONTEXT ADAPTER
// Maps unified exam engine to admission entrance exams
// ═══════════════════════════════════════════════════════════════════

import { db } from "@/db/db";
import { unifiedExams, unifiedExamQuestions, unifiedExamAttempts, unifiedExamResponses, admissionApplicationsV2 } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createExam, startExamAttempt, submitExamResponse, finalizeExamAttempt, getExamWithQuestions } from "./unified-exam";

export async function createAdmissionExam(data: {
  title: string;
  description?: string;
  durationMinutes: number;
  admissionTemplateId: number;
  programmeId?: number;
  showResultsInstantly?: boolean;
}) {
  return createExam({
    title: data.title,
    description: data.description,
    durationMinutes: data.durationMinutes,
    contextType: 'admission',
    admissionTemplateId: data.admissionTemplateId,
    programmeId: data.programmeId,
    showResultsInstantly: data.showResultsInstantly ?? false,
    randomizeQuestions: true,
    requireAssignment: false,
    maxAttempts: 1,
    passingScore: 0, // No pass/fail for admission - just scoring
  });
}

export async function addAdmissionExamSubject(examId: number, subject: {
  name: string;
  questionCount: number;
  marksPerQuestion?: number;
}) {
  // Add placeholder questions for the subject (admin will fill in details)
  const questions = Array.from({ length: subject.questionCount }, (_, i) => ({
    examId,
    questionText: `[${subject.name} Question ${i + 1}]`,
    questionType: 'multiple_choice' as const,
    options: JSON.stringify(['A', 'B', 'C', 'D']),
    correctAnswer: 'A',
    points: subject.marksPerQuestion || 1,
    subjectName: subject.name,
    subjectOrder: 0,
    displayOrder: i,
  }));

  const { addExamQuestion } = await import("./unified-exam");
  for (const q of questions) {
    await addExamQuestion(examId, q);
  }
  return { success: true };
}

export async function startAdmissionExam(applicationId: number, examId: number) {
  return startExamAttempt(examId, { applicantId: applicationId }, 'exam');
}

export async function submitAdmissionExam(attemptId: number, answers: Record<number, string>) {
  const { submitExamResponse, finalizeExamAttempt } = await import("./unified-exam");
  
  // Submit all responses
  for (const [questionId, answer] of Object.entries(answers)) {
    await submitExamResponse(attemptId, parseInt(questionId), answer);
  }

  // Finalize
  const result = await finalizeExamAttempt(attemptId);
  
  // Calculate subject scores
  if (result.success) {
    const responses = await db.select().from(unifiedExamResponses)
      .where(eq(unifiedExamResponses.attemptId, attemptId));
    const questions = await db.select().from(unifiedExamQuestions)
      .where(eq(unifiedExamQuestions.examId, (await db.select().from(unifiedExamAttempts).where(eq(unifiedExamAttempts.id, attemptId)).limit(1))[0]?.examId || 0));

    const subjectScores: Record<string, number> = {};
    for (const r of responses) {
      const q = questions.find(qq => qq.id === r.questionId);
      if (q?.subjectName) {
        subjectScores[q.subjectName] = (subjectScores[q.subjectName] || 0) + parseFloat(r.marksAwarded as string);
      }
    }

    // Store subject scores on attempt
    await db.update(unifiedExamAttempts)
      .set({ subjectScores: JSON.stringify(subjectScores) })
      .where(eq(unifiedExamAttempts.id, attemptId));
  }

  return result;
}

export async function getAdmissionExamResults(examId: number) {
  const { getExamResults } = await import("./unified-exam");
  const results = await getExamResults(examId);
  
  return results.map(r => ({
    ...r,
    subjectScores: r.subjectScores ? JSON.parse(r.subjectScores as string) : {},
  }));
}
