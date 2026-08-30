"use server";

// ═══════════════════════════════════════════════════════════════════
// COURSE CONTEXT ADAPTER
// Maps unified exam engine to LMS course quizzes/exams
// ═══════════════════════════════════════════════════════════════════

import { db } from "@/db/db";
import { unifiedExams, unifiedExamAttempts, unifiedExamResponses, students, studentProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createExam, startExamAttempt, submitExamResponse, finalizeExamAttempt, getExamWithQuestions } from "./unified-exam";

export async function createCourseQuiz(data: {
  title: string;
  description?: string;
  courseId: number;
  moduleId?: number;
  lessonId?: number;
  durationMinutes?: number;
  passingScore?: number;
  quizType?: 'standard' | 'examination';
  examSlotId?: number;
  includeInCa?: boolean;
  caWeight?: number;
  proctoringEnabled?: boolean;
  isPooled?: boolean;
  drawCount?: number;
  maxPoints?: number;
}) {
  return createExam({
    title: data.title,
    description: data.description,
    durationMinutes: data.durationMinutes || 30,
    passingScore: data.passingScore || 50,
    contextType: 'course',
    courseId: data.courseId,
    moduleId: data.moduleId,
    lessonId: data.lessonId,
    examSlotId: data.examSlotId,
    includeInCa: data.includeInCa ?? false,
    caWeight: data.caWeight,
    proctoringEnabled: data.proctoringEnabled ?? false,
    isPooled: data.isPooled ?? false,
    drawCount: data.drawCount,
    maxPoints: data.maxPoints,
    randomizeQuestions: true,
    requireAssignment: false,
    maxAttempts: 1,
    gradingStrategy: 'absolute',
  });
}

export async function startCourseQuizAttempt(examId: number, studentId: number) {
  // Get user_id from students table
  const studentList = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (studentList.length === 0) return { success: false, error: "Student not found" };

  const student = studentList[0];
  return startExamAttempt(examId, { userId: student.userId! }, 'exam');
}

export async function submitCourseQuiz(attemptId: number, answers: Record<number, string>) {
  const { submitExamResponse, finalizeExamAttempt } = await import("./unified-exam");

  for (const [questionId, answer] of Object.entries(answers)) {
    await submitExamResponse(attemptId, parseInt(questionId), answer);
  }

  const result = await finalizeExamAttempt(attemptId);

  // Update progress on pass
  if (result.success && result.passed) {
    const attempt = await db.select().from(unifiedExamAttempts)
      .where(eq(unifiedExamAttempts.id, attemptId)).limit(1);
    
    if (attempt.length > 0 && attempt[0].userId) {
      const exam = await db.select().from(unifiedExams)
        .where(eq(unifiedExams.id, attempt[0].examId)).limit(1);
      
      if (exam.length > 0 && exam[0].courseId) {
        try {
          const studentList = await db.select().from(students)
            .where(eq(students.userId, attempt[0].userId!)).limit(1);
          
          if (studentList.length > 0) {
            await db.insert(studentProgress).values({
              studentId: studentList[0].id,
              courseId: exam[0].courseId,
              quizScore: parseInt(result.score || '0'),
            }).onDuplicateKeyUpdate({
              set: { quizScore: parseInt(result.score || '0') },
            });
          }
        } catch (e) {
          console.warn("Failed to update progress:", e);
        }
      }
    }
  }

  return result;
}

export async function getCourseQuizzes(courseId: number) {
  return await db.select().from(unifiedExams)
    .where(and(eq(unifiedExams.courseId, courseId), eq(unifiedExams.contextType, 'course')));
}

export async function getCourseQuizResults(examId: number) {
  const { getExamResults } = await import("./unified-exam");
  return getExamResults(examId);
}
