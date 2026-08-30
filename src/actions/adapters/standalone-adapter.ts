"use server";

// ═══════════════════════════════════════════════════════════════════
// STANDALONE CONTEXT ADAPTER
// For institution-wide exams not tied to a course
// ═══════════════════════════════════════════════════════════════════

import { createExam, startExamAttempt, getExamResults as getUnifiedResults, getExamAnalytics as getUnifiedAnalytics } from "./unified-exam";

export async function createStandaloneExam(data: {
  title: string;
  description?: string;
  durationMinutes: number;
  totalMarks?: number;
  passingScore?: number;
  programmeId?: number;
  examSlotId?: number;
  proctoringEnabled?: boolean;
  maxAttempts?: number;
  requireAssignment?: boolean;
}) {
  return createExam({
    ...data,
    contextType: 'standalone',
    randomizeQuestions: true,
    maxAttempts: data.maxAttempts || 1,
  });
}

export async function startStandaloneExamAttempt(examId: number, userId: number) {
  return startExamAttempt(examId, { userId }, 'exam');
}

export async function getStandaloneExamResults(examId: number) {
  return getUnifiedResults(examId);
}

export async function getStandaloneExamAnalytics(examId: number) {
  return getUnifiedAnalytics(examId);
}
