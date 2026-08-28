import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  resultBatches,
  studentResults,
  studentTranscripts,
  gradingScales,
  users,
  students,
  courses,
  academicSessions,
  enrollments,
  results,
  semesterSummaries,
  resultMarks,
} from "@/db/schema";

export type GradeRule = { min: number; max: number; grade: string; point: number };

/**
 * Resolve a numeric score to a grade and point using a scale's rules (JSON array)
 */
export function resolveGrade(
  score: number,
  rulesJson: string
): { grade: string; gradePoint: number } {
  let rules: GradeRule[] = [];
  try {
    rules = JSON.parse(rulesJson);
  } catch {
    throw new Error("Invalid grading scale rules format");
  }
  const match = rules.find((r) => score >= r.min && score <= r.max);
  if (!match) return { grade: "F", gradePoint: 0 };
  return { grade: match.grade, gradePoint: match.point };
}

/**
 * Calculate cumulative CGPA for a student across all published batches
 */
export async function calculateCumulativeCGPA(studentId: number) {
  const allPublishedResults = await db
    .select({
      gradePoint: studentResults.gradePoint,
      creditLoad: studentResults.creditLoad,
    })
    .from(studentResults)
    .innerJoin(resultBatches, eq(studentResults.batchId, resultBatches.id))
    .where(
      and(
        eq(studentResults.studentId, studentId),
        eq(resultBatches.status, "published")
      )
    );

  let totalCredits = 0;
  let totalPoints = 0;
  for (const r of allPublishedResults) {
    totalCredits += r.creditLoad;
    totalPoints += Number(r.gradePoint) * r.creditLoad;
  }
  const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  return { cgpa: Number(cgpa.toFixed(2)), totalCredits };
}

/**
 * Calculate semester GPA for results in one batch for one student
 */
export function calculateSemesterGPA(
  results: { gradePoint: string | null; creditLoad: number }[]
) {
  let credits = 0;
  let points = 0;
  for (const r of results) {
    credits += r.creditLoad;
    points += Number(r.gradePoint) * r.creditLoad;
  }
  const gpa = credits > 0 ? points / credits : 0;
  return { gpa: Number(gpa.toFixed(2)), credits };
}

/**
 * Publish a result batch: mark batch as published, upsert student_transcripts
 */
export async function publishResultBatch(batchId: number) {
  const batch = await db.query.resultBatches.findFirst({
    where: eq(resultBatches.id, batchId),
    with: { gradingScale: true, academicSession: true },
  });
  if (!batch) throw new Error("Batch not found");

  await db
    .update(resultBatches)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(resultBatches.id, batchId));

  const batchResults = await db
    .select()
    .from(studentResults)
    .where(eq(studentResults.batchId, batchId));

  const uniqueStudentIds = Array.from(new Set(batchResults.map((r) => r.studentId)));
  const semesterNum = parseInt(batch.semester) as 1 | 2 | 3;

  for (const sId of uniqueStudentIds) {
    const studentBatchResults = batchResults.filter((r) => r.studentId === sId);
    const { gpa, credits } = calculateSemesterGPA(studentBatchResults);
    const { cgpa, totalCredits } = await calculateCumulativeCGPA(sId);

    const existing = await db.query.studentTranscripts.findFirst({
      where: and(
        eq(studentTranscripts.studentId, sId),
        eq(studentTranscripts.academicSessionId, batch.academicSessionId),
        eq(studentTranscripts.semester, batch.semester)
      ),
    });

    const data = {
      cgpa: cgpa.toFixed(2),
      gpa: gpa.toFixed(2),
      totalCreditsEarned: totalCredits,
      totalCreditsAttempted: credits,
      isPublished: true,
      publishedAt: new Date(),
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(studentTranscripts)
        .set(data)
        .where(eq(studentTranscripts.id, existing.id));
    } else {
      await db.insert(studentTranscripts).values({
        studentId: sId,
        academicSessionId: batch.academicSessionId,
        semester: batch.semester,
        ...data,
      });
    }

    // Bridge: create enrollments + results so the student transcript page
    // (which reads from the LMS pipeline) also picks up these results.
    const academicYear = batch.academicSession?.name || "Unknown";

    for (const r of studentBatchResults) {
      try {
        // Find or create enrollment for this student+course+session+semester
        let [enrollment] = await db
          .select({ id: enrollments.id })
          .from(enrollments)
          .where(
            and(
              eq(enrollments.studentId, sId),
              eq(enrollments.courseId, r.courseId),
              eq(enrollments.sessionId, batch.academicSessionId),
              eq(enrollments.semester, semesterNum)
            )
          )
          .limit(1);

        if (!enrollment) {
          const [newEnrollment] = await db.insert(enrollments).values({
            studentId: sId,
            courseId: r.courseId,
            sessionId: batch.academicSessionId,
            academicYear,
            semester: semesterNum,
            status: "approved",
          });
          enrollment = { id: (newEnrollment as any).insertId ?? (newEnrollment as any)[0]?.insertId };
        }

        // Create result record if none exists for this enrollment
        const [existingResult] = await db
          .select({ id: results.id })
          .from(results)
          .where(eq(results.enrollmentId, enrollment.id))
          .limit(1);

        if (!existingResult) {
          await db.insert(results).values({
            enrollmentId: enrollment.id,
            totalScore: r.score,
            score: parseInt(r.score) || 0,
            grade: r.grade,
            gradePoint: r.gradePoint,
            status: "published",
          });
        }

        // Also write to resultMarks for graduate-documents / TeacherService compatibility
        try {
          const [existingMark] = await db
            .select({ id: resultMarks.id })
            .from(resultMarks)
            .where(
              and(
                eq(resultMarks.studentId, sId),
                eq(resultMarks.courseId, r.courseId),
                eq(resultMarks.sessionId, batch.academicSessionId),
                eq(resultMarks.semester, batch.semester as "1" | "2")
              )
            )
            .limit(1);

          if (!existingMark) {
            await db.insert(resultMarks).values({
              studentId: sId,
              courseId: r.courseId,
              sessionId: batch.academicSessionId,
              semester: batch.semester as "1" | "2",
              totalScore: r.score,
              grade: r.grade,
              gradePoint: r.gradePoint,
              isVerified: true,
            });
          }
        } catch (e) {
          console.error("publishResultBatch: resultMarks write error", e);
        }
      } catch (e) {
        // Non-fatal: enrollment/result bridge is supplemental
        console.error("publishResultBatch: enrollment bridge error", e);
      }
    }

    // Upsert semester summary so the transcript page shows GPA/CGPA
    // (semesterSummaries only accepts '1' or '2' — skip for semester '3')
    if (batch.semester === "1" || batch.semester === "2") {
      try {
        const totalWGP = (gpa * credits).toFixed(2);
        const [existingSummary] = await db
          .select({ id: semesterSummaries.id })
          .from(semesterSummaries)
          .where(
            and(
              eq(semesterSummaries.studentId, sId),
              eq(semesterSummaries.sessionId, batch.academicSessionId),
              eq(semesterSummaries.semester, batch.semester as "1" | "2")
            )
          )
          .limit(1);

        const summaryData = {
          tcr: credits,
          tce: credits,
          twgp: totalWGP,
          gpa: gpa.toFixed(2),
          cgpa: cgpa.toFixed(2),
          approvalStatus: "published" as const,
        };

        if (existingSummary) {
          await db
            .update(semesterSummaries)
            .set(summaryData)
            .where(eq(semesterSummaries.id, existingSummary.id));
        } else {
          await db.insert(semesterSummaries).values({
            studentId: sId,
            sessionId: batch.academicSessionId,
            semester: batch.semester as "1" | "2",
            ...summaryData,
          });
        }
      } catch (e) {
        console.error("publishResultBatch: semester summary error", e);
      }
    }
  }
  return { published: uniqueStudentIds.length };
}

/**
 * Fetch complete transcript data for a student including signatures
 */
export async function getStudentTranscriptData(studentId: number, options?: { sessionId?: number, semester?: string, viewForStudent?: boolean }) {
  const conditions = [
    eq(studentTranscripts.studentId, studentId),
    // Admin print: isPublished; Student dashboard: isViewable
    options?.viewForStudent
      ? eq(studentTranscripts.isViewable, true)
      : eq(studentTranscripts.isPublished, true),
  ];

  if (options?.sessionId !== undefined) {
    conditions.push(eq(studentTranscripts.academicSessionId, options.sessionId));
  }
  if (options?.semester !== undefined) {
    conditions.push(eq(studentTranscripts.semester, options.semester));
  }

  const transcriptRows = await db.query.studentTranscripts.findMany({
    where: and(...conditions),
    with: { academicSession: true },
    orderBy: (t, { asc }) => [asc(t.academicSessionId), asc(t.semester)],
  });

  // For each transcript, fetch the detailed course results
  const enriched = await Promise.all(
    transcriptRows.map(async (tr) => {
      const batch = await db.query.resultBatches.findFirst({
        where: and(
          eq(resultBatches.academicSessionId, tr.academicSessionId),
          eq(resultBatches.semester, tr.semester),
          eq(resultBatches.status, "published")
        ),
      });

      const results = batch
        ? await db
            .select({
              courseCode: courses.code,
              courseTitle: courses.name,
              creditLoad: studentResults.creditLoad,
              score: studentResults.score,
              grade: studentResults.grade,
              gradePoint: studentResults.gradePoint,
            })
            .from(studentResults)
            .innerJoin(courses, eq(studentResults.courseId, courses.id))
            .where(
              and(
                eq(studentResults.studentId, studentId),
                eq(studentResults.batchId, batch.id)
              )
            )
        : [];

      return { ...tr, results };
    })
  );

  // Fetch student info
  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
    with: { user: true, programme: true },
  });

  if (!student) {
    return {
      student: null,
      transcripts: [],
      signatures: { registrarName: "Registrar", registrarSignature: null, hodName: "HOD", hodSignature: null },
    };
  }

  // Fetch Registrar signature
  const registrar = await db.query.users.findFirst({
    where: eq(users.role, "registrar"),
  });

  // Fetch HOD signature for student's programme department
  const hod = await db.query.users.findFirst({
    where: eq(users.role, "hod"),
  });

  return {
    student,
    transcripts: enriched,
    signatures: {
      registrarName: registrar?.name || "Registrar",
      registrarSignature: registrar?.signatureUrl || null,
      hodName: hod?.name || "HOD",
      hodSignature: hod?.signatureUrl || null,
    },
  };
}
