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
    with: { gradingScale: true },
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
  }
  return { published: uniqueStudentIds.length };
}

/**
 * Fetch complete transcript data for a student including signatures
 */
export async function getStudentTranscriptData(studentId: number) {
  const transcriptRows = await db.query.studentTranscripts.findMany({
    where: and(
      eq(studentTranscripts.studentId, studentId),
      eq(studentTranscripts.isPublished, true)
    ),
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
              courseTitle: courses.title,
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
