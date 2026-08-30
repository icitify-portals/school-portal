"use server";

// ═══════════════════════════════════════════════════════════════════
// DATA MIGRATION SCRIPT
// Migrates existing CBT + LMS + Admission data to unified tables
// Run once: migrateExistingExamData()
// ═══════════════════════════════════════════════════════════════════

import { db } from "@/db/db";
import {
  cbtQuizzes, cbtQuestions, cbtAttempts, cbtResponses,
  quizzes, quizQuestions, quizAttempts, quizResponses,
  admissionEntranceExams, admissionExamSubjects, admissionExamQuestions, admissionExamResults,
  unifiedExams, unifiedExamQuestions, unifiedExamAttempts, unifiedExamResponses,
  globalQuestionBanks, bankQuestions,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function migrateExistingExamData() {
  const results = { cbt: 0, lms: 0, admission: 0, questions: 0, attempts: 0, responses: 0 };

  try {
    // ═══════════════════════════════════════════════════
    // 1. MIGRATE CBT ENGINE → unified_exams
    // ═══════════════════════════════════════════════════
    const cbtQuizList = await db.select().from(cbtQuizzes);
    
    for (const q of cbtQuizList) {
      const [result] = await db.insert(unifiedExams).values({
        title: q.title,
        description: q.description,
        durationMinutes: q.durationMinutes,
        totalMarks: q.totalMarks || '100.00',
        passingScore: '50.00',
        contextType: 'standalone',
        randomizeQuestions: q.randomizeQuestions ?? true,
        isActive: q.isActive ?? true,
        requireAssignment: q.requireAssignment ?? false,
      });

      const newExamId = (result as any).insertId;
      results.cbt++;

      // Migrate questions
      const cbtQuestionList = await db.select().from(cbtQuestions).where(eq(cbtQuestions.quizId, q.id));
      for (const cq of cbtQuestionList) {
        await db.insert(unifiedExamQuestions).values({
          examId: newExamId,
          questionText: cq.questionText,
          questionType: cq.questionType as any,
          options: cq.options,
          correctAnswer: cq.correctAnswer,
          points: cq.marks || '1.00',
          explanation: cq.explanation,
          containsLatex: cq.containsLatex ?? false,
          displayOrder: 0,
        });
        results.questions++;
      }

      // Migrate attempts and responses
      const cbtAttemptList = await db.select().from(cbtAttempts).where(eq(cbtAttempts.quizId, q.id));
      for (const ca of cbtAttemptList) {
        const [attResult] = await db.insert(unifiedExamAttempts).values({
          examId: newExamId,
          userId: ca.userId,
          startTime: ca.startTime,
          endTime: ca.endTime,
          status: ca.status as any,
          score: ca.score || '0.00',
          tabSwitches: ca.tabSwitches || 0,
        });

        const newAttemptId = (attResult as any).insertId;
        results.attempts++;

        // Migrate responses
        const cbtResponseList = await db.select().from(cbtResponses).where(eq(cbtResponses.attemptId, ca.id));
        for (const cr of cbtResponseList) {
          // Find corresponding new question
          const oldQuestion = cbtQuestionList.find(qq => qq.id === cr.questionId);
          if (!oldQuestion) continue;

          const newQuestions = await db.select().from(unifiedExamQuestions)
            .where(eq(unifiedExamQuestions.examId, newExamId));
          const newQ = newQuestions.find(qq => qq.questionText === oldQuestion.questionText);
          if (!newQ) continue;

          await db.insert(unifiedExamResponses).values({
            attemptId: newAttemptId,
            questionId: newQ.id,
            selectedAnswer: cr.selectedAnswer,
            isCorrect: cr.isCorrect ?? false,
            marksAwarded: cr.marksAwarded || '0.00',
          });
          results.responses++;
        }
      }
    }

    // ═══════════════════════════════════════════════════
    // 2. MIGRATE LMS QUIZZES → unified_exams
    // ═══════════════════════════════════════════════════
    const lmsQuizList = await db.select().from(quizzes);
    
    for (const q of lmsQuizList) {
      const [result] = await db.insert(unifiedExams).values({
        title: q.title,
        description: q.description,
        durationMinutes: q.timeLimitMinutes || 30,
        totalMarks: String(q.maxPoints || 100),
        passingScore: String(q.passingScore || 50),
        contextType: 'course',
        courseId: q.courseId,
        moduleId: q.moduleId,
        lessonId: q.lessonId,
        examSlotId: q.slotId,
        randomizeQuestions: q.randomizeQuestions ?? false,
        isPooled: q.isPooled ?? false,
        drawCount: q.drawCount,
        includeInCa: q.includeInCa ?? false,
        caAveragingMethod: q.caAveragingMethod as any || 'simple',
        proctoringEnabled: q.proctoringEnabled ?? false,
        gradingStrategy: q.gradingStrategy as any || 'absolute',
        isActive: true,
        availableFrom: q.availableFrom,
        availableUntil: q.availableUntil,
        gracePeriodMinutes: q.gracePeriodMinutes || 0,
        requireAssignment: false,
      });

      const newExamId = (result as any).insertId;
      results.lms++;

      // Migrate questions
      const lmsQuestionList = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, q.id));
      for (const lq of lmsQuestionList) {
        await db.insert(unifiedExamQuestions).values({
          examId: newExamId,
          questionText: lq.questionText,
          questionType: lq.type as any,
          options: lq.options,
          correctAnswer: lq.correctAnswer || '',
          points: String(lq.points || 1),
          explanation: lq.explanation,
          containsLatex: false,
          displayOrder: 0,
        });
        results.questions++;
      }

      // Migrate attempts (students are linked via users table)
      const lmsAttemptList = await db.select().from(quizAttempts).where(eq(quizAttempts.quizId, q.id));
      for (const la of lmsAttemptList) {
        // Get user_id from student
        const { students } = await import("@/db/schema");
        const studentList = await db.select().from(students).where(eq(students.id, la.studentId)).limit(1);
        const userId = studentList[0]?.userId || null;

        const [attResult] = await db.insert(unifiedExamAttempts).values({
          examId: newExamId,
          userId,
          startTime: la.startedAt,
          endTime: la.completedAt,
          status: la.status as any === 'submitted' ? 'completed' : la.status as any,
          score: String(la.score || 0),
          maxScore: String(la.maxScore || 0),
          passed: la.passed ?? false,
          mode: la.mode as any || 'exam',
          extraTimeMinutes: la.extraTimeMinutes || 0,
        });

        const newAttemptId = (attResult as any).insertId;
        results.attempts++;

        // Migrate responses
        const lmsResponseList = await db.select().from(quizResponses).where(eq(quizResponses.attemptId, la.id));
        for (const lr of lmsResponseList) {
          const newQuestions = await db.select().from(unifiedExamQuestions)
            .where(eq(unifiedExamQuestions.examId, newExamId));
          const newQ = newQuestions.find(qq => qq.questionText === (lmsQuestionList.find(lqq => lqq.id === lr.questionId))?.questionText);
          if (!newQ) continue;

          const isCorrect = newQ.correctAnswer === lr.studentAnswer;
          await db.insert(unifiedExamResponses).values({
            attemptId: newAttemptId,
            questionId: newQ.id,
            selectedAnswer: lr.studentAnswer,
            isCorrect,
            marksAwarded: isCorrect ? String(newQ.points) : '0.00',
          });
          results.responses++;
        }
      }
    }

    // ═══════════════════════════════════════════════════
    // 3. MIGRATE ADMISSION EXAMS → unified_exams
    // ═══════════════════════════════════════════════════
    const admExamList = await db.select().from(admissionEntranceExams);
    
    for (const ae of admExamList) {
      const [result] = await db.insert(unifiedExams).values({
        title: `Admission Exam #${ae.id}`,
        description: ae.instructions,
        durationMinutes: ae.duration,
        totalMarks: '100.00',
        passingScore: '0.00',
        contextType: 'admission',
        admissionTemplateId: ae.templateId,
        showResultsInstantly: ae.showResultsInstantly ?? false,
        resultsReleased: ae.resultsReleased ?? false,
        attendanceAutoMark: true,
        randomizeQuestions: true,
        isActive: true,
        requireAssignment: false,
        maxAttempts: 1,
      });

      const newExamId = (result as any).insertId;
      results.admission++;

      // Migrate subjects → questions grouped by subject
      const subjects = await db.select().from(admissionExamSubjects).where(eq(admissionExamSubjects.examId, ae.id));
      
      for (const subject of subjects) {
        const questions = await db.select().from(admissionExamQuestions)
          .where(eq(admissionExamQuestions.subjectId, subject.id));

        for (let i = 0; i < questions.length; i++) {
          const aq = questions[i];
          await db.insert(unifiedExamQuestions).values({
            examId: newExamId,
            questionText: aq.questionText,
            questionType: aq.questionType as any,
            options: aq.options,
            correctAnswer: aq.correctAnswer,
            points: subject.marksPerQuestion || '1.00',
            explanation: aq.explanation,
            imagePath: aq.imagePath,
            subjectName: subject.name,
            subjectOrder: 0,
            displayOrder: i,
          });
          results.questions++;
        }
      }

      // Migrate results → attempts
      const admResults = await db.select().from(admissionExamResults)
        .where(eq(admissionExamResults.examId, ae.id));

      for (const ar of admResults) {
        const [attResult] = await db.insert(unifiedExamAttempts).values({
          examId: newExamId,
          applicantId: ar.applicationId,
          startTime: ar.startTime,
          endTime: ar.endTime,
          status: ar.status as any,
          score: ar.totalScore || '0.00',
          subjectScores: ar.subjectScores,
        });

        results.attempts++;
      }
    }

    return {
      success: true,
      message: `Migration complete: ${results.cbt} CBT, ${results.lms} LMS, ${results.admission} admission exams migrated. ${results.questions} questions, ${results.attempts} attempts, ${results.responses} responses.`,
      results,
    };
  } catch (error: any) {
    return { success: false, error: error.message, results };
  }
}
