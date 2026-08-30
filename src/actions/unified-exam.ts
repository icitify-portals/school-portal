"use server";

import { db } from "@/db/db";
import {
  unifiedExams, unifiedExamQuestions, unifiedExamAttempts, unifiedExamResponses,
  unifiedExamIncidents, unifiedExamAssignments,
  globalQuestionBanks, bankQuestions,
  users, examSlots
} from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

// ═══════════════════════════════════════════════════════════════════
// EXAM MANAGEMENT (Admin/Staff)
// ═══════════════════════════════════════════════════════════════════

export async function createExam(data: {
  title: string;
  description?: string;
  durationMinutes?: number;
  totalMarks?: number;
  passingScore?: number;
  contextType: 'course' | 'admission' | 'external' | 'standalone';
  courseId?: number;
  moduleId?: number;
  lessonId?: number;
  admissionTemplateId?: number;
  programmeId?: number;
  examSlotId?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  requireAssignment?: boolean;
  proctoringEnabled?: boolean;
  maxAttempts?: number;
  includeInCa?: boolean;
  caWeight?: number;
  isPooled?: boolean;
  drawCount?: number;
  showResultsInstantly?: boolean;
  externalAccessCode?: string;
}) {
  try {
    const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const [result] = await db.insert(unifiedExams).values({
      title: data.title,
      description: data.description,
      durationMinutes: data.durationMinutes || 60,
      totalMarks: String(data.totalMarks || 100),
      passingScore: String(data.passingScore || 50),
      contextType: data.contextType,
      courseId: data.courseId,
      moduleId: data.moduleId,
      lessonId: data.lessonId,
      admissionTemplateId: data.admissionTemplateId,
      programmeId: data.programmeId,
      examSlotId: data.examSlotId,
      randomizeQuestions: data.randomizeQuestions ?? true,
      randomizeOptions: data.randomizeOptions ?? false,
      requireAssignment: data.requireAssignment ?? false,
      proctoringEnabled: data.proctoringEnabled ?? false,
      maxAttempts: data.maxAttempts ?? 1,
      includeInCa: data.includeInCa ?? false,
      caWeight: data.caWeight ? String(data.caWeight) : null,
      isPooled: data.isPooled ?? false,
      drawCount: data.drawCount,
      showResultsInstantly: data.showResultsInstantly ?? false,
      externalAccessCode: data.externalAccessCode,
    });

    const examId = (result as any).insertId;
    revalidatePath("/admin/cbt");
    return { success: true, examId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateExam(examId: number, data: Partial<{
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  passingScore: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  isActive: boolean;
  requireAssignment: boolean;
  proctoringEnabled: boolean;
  maxAttempts: number;
  examSlotId: number;
  availableFrom: Date;
  availableUntil: Date;
  includeInCa: boolean;
  caWeight: number;
  showResultsInstantly: boolean;
  resultsReleased: boolean;
}>) {
  try {
    const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const updateData: any = { ...data };
    if (data.totalMarks !== undefined) updateData.totalMarks = String(data.totalMarks);
    if (data.passingScore !== undefined) updateData.passingScore = String(data.passingScore);
    if (data.caWeight !== undefined) updateData.caWeight = String(data.caWeight);

    await db.update(unifiedExams).set(updateData).where(eq(unifiedExams.id, examId));
    revalidatePath("/admin/cbt");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getExamWithQuestions(examId: number) {
  try {
    const exams = await db.select().from(unifiedExams).where(eq(unifiedExams.id, examId)).limit(1);
    if (exams.length === 0) return null;

    const exam = exams[0];
    let questions = await db.select().from(unifiedExamQuestions)
      .where(eq(unifiedExamQuestions.examId, examId));

    // Resolve bank questions (copy inline data from bank if not overridden)
    questions = questions.map(q => {
      if (q.bankQuestionId && !q.questionText) {
        // Will be resolved in a real app via join; for now return as-is
        return q;
      }
      return q;
    });

    // Randomize if configured
    if (exam.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    return { ...exam, questions };
  } catch (error) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// QUESTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

export async function addExamQuestion(examId: number, data: {
  questionText: string;
  questionType?: string;
  options?: string;
  correctAnswer: string;
  points?: number;
  explanation?: string;
  containsLatex?: boolean;
  imagePath?: string;
  subjectName?: string;
  subjectOrder?: number;
  bankQuestionId?: number;
}) {
  try {
    const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized" };

    // Get current max order
    const existing = await db.select().from(unifiedExamQuestions)
      .where(eq(unifiedExamQuestions.examId, examId));
    const maxOrder = existing.reduce((max, q) => Math.max(max, q.displayOrder || 0), 0);

    const [result] = await db.insert(unifiedExamQuestions).values({
      examId,
      bankQuestionId: data.bankQuestionId,
      questionText: data.questionText,
      questionType: (data.questionType as any) || 'multiple_choice',
      options: data.options,
      correctAnswer: data.correctAnswer,
      points: String(data.points || 1),
      explanation: data.explanation,
      containsLatex: data.containsLatex ?? false,
      imagePath: data.imagePath,
      subjectName: data.subjectName,
      subjectOrder: data.subjectOrder ?? 0,
      displayOrder: maxOrder + 1,
    });

    revalidatePath("/admin/cbt");
    return { success: true, questionId: (result as any).insertId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteExamQuestion(questionId: number) {
  try {
    const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized" };

    await db.delete(unifiedExamQuestions).where(eq(unifiedExamQuestions.id, questionId));
    revalidatePath("/admin/cbt");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// QUESTION BANK MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

export async function createGlobalQuestionBank(data: { name: string; description?: string; tags?: string[] }) {
  try {
    const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const [result] = await db.insert(globalQuestionBanks).values({
      name: data.name,
      description: data.description,
      tags: data.tags ? JSON.stringify(data.tags) : null,
    });

    return { success: true, bankId: (result as any).insertId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getGlobalQuestionBanks() {
  try {
    return await db.select().from(globalQuestionBanks).orderBy(globalQuestionBanks.name);
  } catch {
    return [];
  }
}

export async function addBankQuestion(bankId: number, data: {
  questionText: string;
  questionType?: string;
  options?: string;
  correctAnswer: string;
  points?: number;
  explanation?: string;
  containsLatex?: boolean;
  difficultyLevel?: string;
  tags?: string[];
  imagePath?: string;
}) {
  try {
    const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const [result] = await db.insert(bankQuestions).values({
      bankId,
      questionText: data.questionText,
      questionType: (data.questionType as any) || 'multiple_choice',
      options: data.options,
      correctAnswer: data.correctAnswer,
      points: String(data.points || 1),
      explanation: data.explanation,
      containsLatex: data.containsLatex ?? false,
      difficultyLevel: (data.difficultyLevel as any) || 'medium',
      tags: data.tags ? JSON.stringify(data.tags) : null,
      imagePath: data.imagePath,
    });

    return { success: true, questionId: (result as any).insertId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBankQuestions(bankId: number) {
  try {
    return await db.select().from(bankQuestions).where(eq(bankQuestions.bankId, bankId));
  } catch {
    return [];
  }
}

export async function bulkAddBankQuestions(bankId: number, questions: Array<{
  questionText: string;
  questionType?: string;
  options?: string;
  correctAnswer: string;
  points?: number;
  explanation?: string;
  difficultyLevel?: string;
  tags?: string[];
}>) {
  try {
    const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const values = questions.map(q => ({
      bankId,
      questionText: q.questionText,
      questionType: (q.questionType as any) || 'multiple_choice',
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: String(q.points || 1),
      explanation: q.explanation,
      difficultyLevel: (q.difficultyLevel as any) || 'medium',
      tags: q.tags ? JSON.stringify(q.tags) : null,
    }));

    await db.insert(bankQuestions).values(values);
    return { success: true, count: questions.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function drawFromBank(bankId: number, count: number, filters?: { difficulty?: string; tags?: string[] }) {
  try {
    let questions = await db.select().from(bankQuestions).where(eq(bankQuestions.bankId, bankId));

    if (filters?.difficulty) {
      questions = questions.filter(q => q.difficultyLevel === filters.difficulty);
    }

    // Random draw
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// ATTEMPT LIFECYCLE
// ═══════════════════════════════════════════════════════════════════

export async function startExamAttempt(examId: number, taker: {
  userId?: number;
  applicantId?: number;
  externalCandidateId?: string;
}, mode: 'exam' | 'practice' = 'exam') {
  try {
    const exams = await db.select().from(unifiedExams).where(eq(unifiedExams.id, examId)).limit(1);
    if (exams.length === 0) return { success: false, error: "Exam not found" };

    const exam = exams[0];
    if (!exam.isActive) return { success: false, error: "Exam is not active" };

    // Check assignment requirement
    if (exam.requireAssignment) {
      const assignments = await db.select().from(unifiedExamAssignments)
        .where(eq(unifiedExamAssignments.examId, examId));
      
      const isAssigned = assignments.some(a => {
        if (taker.userId && a.userId === taker.userId) return true;
        if (taker.applicantId && a.applicantId === taker.applicantId) return true;
        if (taker.externalCandidateId && a.externalCandidateId === taker.externalCandidateId) return true;
        return false;
      });

      if (!isAssigned) return { success: false, error: "Access Denied: You are not assigned to this exam." };
    }

    // Check max attempts
    const existingAttempts = await db.select().from(unifiedExamAttempts)
      .where(eq(unifiedExamAttempts.examId, examId));
    
    const userAttempts = existingAttempts.filter(a => {
      if (taker.userId && a.userId === taker.userId) return true;
      if (taker.applicantId && a.applicantId === taker.applicantId) return true;
      if (taker.externalCandidateId && a.externalCandidateId === taker.externalCandidateId) return true;
      return false;
    }).filter(a => ['completed', 'auto_submitted'].includes(a.status || ''));

    if (userAttempts.length >= (exam.maxAttempts || 1)) {
      return { success: false, error: `Maximum attempts (${exam.maxAttempts}) reached.` };
    }

    // Create attempt
    const [result] = await db.insert(unifiedExamAttempts).values({
      examId,
      userId: taker.userId,
      applicantId: taker.applicantId,
      externalCandidateId: taker.externalCandidateId,
      mode,
      status: 'in_progress',
      score: '0.00',
      maxScore: exam.totalMarks || '100.00',
      tabSwitches: 0,
    });

    const attemptId = (result as any).insertId;

    // Auto-mark attendance for admission exams
    if (exam.contextType === 'admission' && exam.attendanceAutoMark && taker.applicantId) {
      try {
        const { admissionApplicationsV2 } = await import("@/db/schema");
        await db.update(admissionApplicationsV2)
          .set({ examAttendanceStatus: 'present' })
          .where(eq(admissionApplicationsV2.id, taker.applicantId));
      } catch (e) {
        console.warn("Failed to auto-mark attendance:", e);
      }
    }

    return { success: true, attemptId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitExamResponse(attemptId: number, questionId: number, selectedAnswer: string) {
  try {
    const questions = await db.select().from(unifiedExamQuestions)
      .where(eq(unifiedExamQuestions.id, questionId)).limit(1);
    if (questions.length === 0) return { success: false, error: "Question not found" };

    const q = questions[0];
    const isCorrect = q.correctAnswer === selectedAnswer;
    const marksAwarded = isCorrect ? q.points : '0.00';

    // Upsert
    const existing = await db.select().from(unifiedExamResponses)
      .where(eq(unifiedExamResponses.attemptId, attemptId));
    const res = existing.find(e => e.questionId === questionId);

    if (res) {
      await db.update(unifiedExamResponses).set({
        selectedAnswer,
        isCorrect,
        marksAwarded,
      }).where(eq(unifiedExamResponses.id, res.id));
    } else {
      await db.insert(unifiedExamResponses).values({
        attemptId,
        questionId,
        selectedAnswer,
        isCorrect,
        marksAwarded,
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function recordExamIncident(attemptId: number, type: string, metadata?: string) {
  try {
    await db.insert(unifiedExamIncidents).values({
      attemptId,
      type: type as any,
      metadata,
    });

    // Increment tab switches
    const attempts = await db.select().from(unifiedExamAttempts)
      .where(eq(unifiedExamAttempts.id, attemptId)).limit(1);
    if (attempts.length === 0) return { success: false, error: "Attempt not found" };

    const attempt = attempts[0];
    const newSwitches = (attempt.tabSwitches || 0) + 1;

    // Get security settings
    const { examSecuritySettings } = await import("@/db/schema");
    const [secSettings] = await db.select().from(examSecuritySettings).limit(1);

    if (secSettings?.autoSubmitOnTabSwitch && newSwitches < 3) {
      // Auto-submit
      const responses = await db.select().from(unifiedExamResponses)
        .where(eq(unifiedExamResponses.attemptId, attemptId));
      let totalScore = 0;
      responses.forEach(r => { totalScore += parseFloat(r.marksAwarded as string); });

      await db.update(unifiedExamAttempts).set({
        tabSwitches: newSwitches,
        status: 'auto_submitted',
        endTime: new Date(),
        score: totalScore.toFixed(2),
      }).where(eq(unifiedExamAttempts.id, attemptId));

      return { success: true, tabSwitches: newSwitches, flagged: true, autoSubmitted: true };
    }

    let newStatus = attempt.status;
    if (newSwitches >= 3) newStatus = 'flagged';

    await db.update(unifiedExamAttempts).set({
      tabSwitches: newSwitches,
      status: newStatus,
    }).where(eq(unifiedExamAttempts.id, attemptId));

    return { success: true, tabSwitches: newSwitches, flagged: newStatus === 'flagged' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function finalizeExamAttempt(attemptId: number) {
  try {
    const attempts = await db.select().from(unifiedExamAttempts)
      .where(eq(unifiedExamAttempts.id, attemptId)).limit(1);
    if (attempts.length === 0) return { success: false, error: "Attempt not found" };

    const attempt = attempts[0];
    if (attempt.status === 'completed') return { success: true, score: attempt.score };

    const responses = await db.select().from(unifiedExamResponses)
      .where(eq(unifiedExamResponses.attemptId, attemptId));
    
    let totalScore = 0;
    responses.forEach(r => { totalScore += parseFloat(r.marksAwarded as string); });

    const exams = await db.select().from(unifiedExams)
      .where(eq(unifiedExams.id, attempt.examId)).limit(1);
    const exam = exams[0];
    const passingScore = parseFloat(exam?.passingScore || '50');
    const totalMarks = parseFloat(exam?.totalMarks || '100');
    const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

    await db.update(unifiedExamAttempts).set({
      endTime: new Date(),
      status: 'completed',
      score: totalScore.toFixed(2),
      passed: percentage >= passingScore,
    }).where(eq(unifiedExamAttempts.id, attemptId));

    return { success: true, score: totalScore.toFixed(2), passed: percentage >= passingScore };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAttemptWithRemainingTime(attemptId: number) {
  try {
    const attempts = await db.select().from(unifiedExamAttempts)
      .where(eq(unifiedExamAttempts.id, attemptId)).limit(1);
    if (attempts.length === 0) return null;

    const attempt = attempts[0];
    const exams = await db.select().from(unifiedExams)
      .where(eq(unifiedExams.id, attempt.examId)).limit(1);
    if (exams.length === 0) return null;

    const exam = exams[0];
    const durationMs = (exam.durationMinutes || 60) * 60 * 1000;
    const extraMs = (attempt.extraTimeMinutes || 0) * 60 * 1000;
    const elapsed = attempt.startTime ? Date.now() - new Date(attempt.startTime).getTime() : 0;
    const remainingMs = Math.max(0, durationMs + extraMs - elapsed);

    return { ...attempt, durationMinutes: exam.durationMinutes, remainingMs, exam };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// RESULTS & ANALYTICS
// ═══════════════════════════════════════════════════════════════════

export async function getExamResults(examId: number) {
  try {
    return await db.select({
      attemptId: unifiedExamAttempts.id,
      userId: unifiedExamAttempts.userId,
      applicantId: unifiedExamAttempts.applicantId,
      externalCandidateId: unifiedExamAttempts.externalCandidateId,
      userName: users.name,
      userEmail: users.email,
      userMatricNumber: users.matricNumber,
      score: unifiedExamAttempts.score,
      maxScore: unifiedExamAttempts.maxScore,
      passed: unifiedExamAttempts.passed,
      startTime: unifiedExamAttempts.startTime,
      endTime: unifiedExamAttempts.endTime,
      status: unifiedExamAttempts.status,
      tabSwitches: unifiedExamAttempts.tabSwitches,
      mode: unifiedExamAttempts.mode,
    }).from(unifiedExamAttempts)
      .leftJoin(users, eq(unifiedExamAttempts.userId, users.id))
      .where(eq(unifiedExamAttempts.examId, examId))
      .orderBy(unifiedExamAttempts.endTime);
  } catch {
    return [];
  }
}

export async function getExamAnalytics(examId: number) {
  try {
    const exam = await db.select().from(unifiedExams).where(eq(unifiedExams.id, examId)).limit(1);
    if (exam.length === 0) return null;

    const questions = await db.select().from(unifiedExamQuestions)
      .where(eq(unifiedExamQuestions.examId, examId));
    const attempts = await db.select().from(unifiedExamAttempts)
      .where(eq(unifiedExamAttempts.examId, examId));
    const allResponses = await db.select().from(unifiedExamResponses);

    const completedAttempts = attempts.filter(a => ['completed', 'auto_submitted'].includes(a.status || ''));
    const totalScore = completedAttempts.reduce((sum, a) => sum + parseFloat(a.score || '0'), 0);
    const avgScore = completedAttempts.length > 0 ? totalScore / completedAttempts.length : 0;

    const questionStats = questions.map(q => {
      const qResponses = allResponses.filter(r => r.questionId === q.id);
      const correctCount = qResponses.filter(r => r.isCorrect).length;
      const totalCount = qResponses.length;
      const pValue = totalCount > 0 ? correctCount / totalCount : 0;

      return {
        questionId: q.id,
        questionText: q.questionText,
        subjectName: q.subjectName,
        pValue: Math.round(pValue * 100) / 100,
        responseCount: totalCount,
        correctCount,
      };
    });

    const avgPValue = questionStats.length > 0 ? questionStats.reduce((s, q) => s + q.pValue, 0) / questionStats.length : 0;

    return {
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      avgScore: Math.round(avgScore * 100) / 100,
      passRate: completedAttempts.length > 0
        ? Math.round((completedAttempts.filter(a => a.passed).length / completedAttempts.length) * 100)
        : 0,
      avgPValue: Math.round(avgPValue * 100) / 100,
      easyQuestions: questionStats.filter(q => q.pValue >= 0.7).length,
      moderateQuestions: questionStats.filter(q => q.pValue >= 0.3 && q.pValue < 0.7).length,
      difficultQuestions: questionStats.filter(q => q.pValue < 0.3).length,
      questionStats,
    };
  } catch {
    return null;
  }
}

export async function getCBTStats() {
  try {
    const exams = await db.select().from(unifiedExams);
    const attempts = await db.select().from(unifiedExamAttempts);

    const activeExams = exams.filter(e => e.isActive).length;
    const pendingGrading = attempts.filter(a => a.status === 'flagged' || a.status === 'auto_submitted').length;
    const completedAttempts = attempts.filter(a => ['completed', 'auto_submitted'].includes(a.status || ''));
    const passRate = completedAttempts.length > 0
      ? Math.round((completedAttempts.filter(a => a.passed).length / completedAttempts.length) * 100)
      : 0;

    const recentExams = exams.slice(-5).reverse().map(e => ({
      id: e.id,
      title: e.title,
      contextType: e.contextType,
      durationMinutes: e.durationMinutes,
    }));

    return {
      activeExams,
      totalExams: exams.length,
      pendingGrading,
      passRate,
      recentExams,
      totalAttempts: attempts.length,
    };
  } catch {
    return { activeExams: 0, totalExams: 0, pendingGrading: 0, passRate: 0, recentExams: [], totalAttempts: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════
// ASSIGNMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

export async function assignToExam(examId: number, taker: {
  userId?: number;
  applicantId?: number;
  externalCandidateId?: string;
}) {
  try {
    const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized" };

    // Check if already assigned
    const existing = await db.select().from(unifiedExamAssignments)
      .where(eq(unifiedExamAssignments.examId, examId));
    
    const alreadyAssigned = existing.some(a => {
      if (taker.userId && a.userId === taker.userId) return true;
      if (taker.applicantId && a.applicantId === taker.applicantId) return true;
      if (taker.externalCandidateId && a.externalCandidateId === taker.externalCandidateId) return true;
      return false;
    });

    if (alreadyAssigned) return { success: true };

    await db.insert(unifiedExamAssignments).values({
      examId,
      userId: taker.userId,
      applicantId: taker.applicantId,
      externalCandidateId: taker.externalCandidateId,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getExamAssignments(examId: number) {
  try {
    return await db.select({
      id: unifiedExamAssignments.id,
      userId: unifiedExamAssignments.userId,
      applicantId: unifiedExamAssignments.applicantId,
      externalCandidateId: unifiedExamAssignments.externalCandidateId,
      userName: users.name,
      userEmail: users.email,
      userMatricNumber: users.matricNumber,
    }).from(unifiedExamAssignments)
      .leftJoin(users, eq(unifiedExamAssignments.userId, users.id))
      .where(eq(unifiedExamAssignments.examId, examId));
  } catch {
    return [];
  }
}

export async function getExamsByContext(contextType: string, filters?: { courseId?: number; programmeId?: number; isActive?: boolean }) {
  try {
    const conditions = [eq(unifiedExams.contextType, contextType as any)];
    if (filters?.courseId) conditions.push(eq(unifiedExams.courseId, filters.courseId));
    if (filters?.programmeId) conditions.push(eq(unifiedExams.programmeId, filters.programmeId));
    if (filters?.isActive !== undefined) conditions.push(eq(unifiedExams.isActive, filters.isActive));

    return await db.select().from(unifiedExams).where(and(...conditions));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// GRANT EXTRA TIME
// ═══════════════════════════════════════════════════════════════════

export async function grantExamExtraTime(attemptId: number, mins: number) {
  try {
    const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const attempts = await db.select().from(unifiedExamAttempts)
      .where(eq(unifiedExamAttempts.id, attemptId)).limit(1);
    if (attempts.length === 0) return { success: false, error: "Attempt not found" };

    await db.update(unifiedExamAttempts)
      .set({ extraTimeMinutes: (attempts[0].extraTimeMinutes || 0) + mins })
      .where(eq(unifiedExamAttempts.id, attemptId));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
