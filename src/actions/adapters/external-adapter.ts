"use server";

// ═══════════════════════════════════════════════════════════════════
// EXTERNAL CONTEXT ADAPTER
// For external exam bodies (non-FSS candidates)
// ═══════════════════════════════════════════════════════════════════

import { db } from "@/db/db";
import { unifiedExams } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createExam, startExamAttempt, getExamResults as getUnifiedResults } from "./unified-exam";
import bcrypt from "bcryptjs";

export async function createExternalExam(data: {
  title: string;
  description?: string;
  durationMinutes: number;
  totalMarks?: number;
  passingScore?: number;
  programmeId?: number;
  examSlotId?: number;
  accessCode: string;
  accessPin: string;
}) {
  const hashedPin = await bcrypt.hash(data.accessPin, 10);

  return createExam({
    title: data.title,
    description: data.description,
    durationMinutes: data.durationMinutes,
    totalMarks: data.totalMarks,
    passingScore: data.passingScore,
    contextType: 'external',
    programmeId: data.programmeId,
    examSlotId: data.examSlotId,
    externalAccessCode: data.accessCode,
    randomizeQuestions: true,
    requireAssignment: false,
    maxAttempts: 1,
  });
}

export async function authenticateExternalCandidate(accessCode: string, accessPin: string) {
  try {
    const exams = await db.select().from(unifiedExams)
      .where(and(
        eq(unifiedExams.externalAccessCode, accessCode),
        eq(unifiedExams.contextType, 'external'),
        eq(unifiedExams.isActive, true),
      ));

    for (const exam of exams) {
      if (exam.externalAccessPin) {
        const valid = await bcrypt.compare(accessPin, exam.externalAccessPin);
        if (valid) return { success: true, examId: exam.id };
      }
    }

    return { success: false, error: "Invalid credentials" };
  } catch {
    return { success: false, error: "Authentication failed" };
  }
}

export async function startExternalExamAttempt(examId: number, candidateId: string) {
  return startExamAttempt(examId, { externalCandidateId: candidateId }, 'exam');
}

export async function getExternalExamResults(examId: number) {
  return getUnifiedResults(examId);
}
