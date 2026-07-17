"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  gradingScales,
  resultBatches,
  studentResults,
  courses,
  students,
  academicSessions,
  users,
} from "@/db/schema";
import { eq, and, like, or } from "drizzle-orm";
import {
  resolveGrade,
  publishResultBatch,
  getStudentTranscriptData,
} from "@/services/results.service";

// ──────────────────────────────────────────────
// GRADING SCALES
// ──────────────────────────────────────────────

export async function getGradingScales() {
  try {
    const scales = await db.query.gradingScales.findMany({
      orderBy: (g, { desc }) => [desc(g.createdAt)],
    });
    return { success: true, data: scales };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createGradingScale(data: {
  name: string;
  description?: string;
  maxCgpa: string;
  rules: string; // JSON string
}) {
  try {
    // Validate JSON
    JSON.parse(data.rules);
    const [inserted] = await db.insert(gradingScales).values({
      name: data.name,
      description: data.description,
      maxCgpa: data.maxCgpa,
      rules: data.rules,
    });
    revalidatePath("/admin/result-module/scales");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteGradingScale(id: number) {
  try {
    await db.delete(gradingScales).where(eq(gradingScales.id, id));
    revalidatePath("/admin/result-module/scales");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// RESULT BATCHES
// ──────────────────────────────────────────────

export async function getResultBatches() {
  try {
    const batches = await db.query.resultBatches.findMany({
      with: {
        academicSession: true,
        gradingScale: true,
        admin: true,
      },
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
    return { success: true, data: batches };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createResultBatch(data: {
  adminId: number;
  academicSessionId: number;
  semester: "1" | "2" | "3";
  gradingScaleId: number;
}) {
  try {
    const result = await db.insert(resultBatches).values({
      adminId: data.adminId,
      academicSessionId: data.academicSessionId,
      semester: data.semester,
      gradingScaleId: data.gradingScaleId,
      status: "pending",
    });
    const batchId = (result as any)[0]?.insertId ?? (result as any).insertId;
    revalidatePath("/admin/result-module");
    return { success: true, batchId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getBatchDetails(batchId: number) {
  try {
    const batch = await db.query.resultBatches.findFirst({
      where: eq(resultBatches.id, batchId),
      with: {
        academicSession: true,
        gradingScale: true,
        admin: true,
        studentResults: {
          with: {
            student: {
              with: { user: true },
            },
            course: true,
          },
        },
      },
    });
    return { success: true, data: batch };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// ADDING RESULTS (Single Student)
// ──────────────────────────────────────────────

export async function addSingleStudentResult(data: {
  batchId: number;
  studentId: number;
  courseId: number;
  score: number;
  creditLoad: number;
  gradingScaleRules: string;
}) {
  try {
    const { grade, gradePoint } = resolveGrade(
      data.score,
      data.gradingScaleRules
    );
    await db.insert(studentResults).values({
      studentId: data.studentId,
      courseId: data.courseId,
      batchId: data.batchId,
      score: data.score.toString(),
      grade,
      gradePoint: gradePoint.toString(),
      creditLoad: data.creditLoad,
    });
    revalidatePath(`/admin/result-module/${data.batchId}`);
    return { success: true, grade, gradePoint };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// ADDING RESULTS (Bulk CSV)
// ──────────────────────────────────────────────

export async function addBulkResults(
  batchId: number,
  rows: {
    studentId: number;
    courseId: number;
    score: number;
    creditLoad: number;
  }[],
  gradingScaleRules: string
) {
  try {
    const toInsert = rows.map((r) => {
      const { grade, gradePoint } = resolveGrade(r.score, gradingScaleRules);
      return {
        studentId: r.studentId,
        courseId: r.courseId,
        batchId,
        score: r.score.toString(),
        grade,
        gradePoint: gradePoint.toString(),
        creditLoad: r.creditLoad,
      };
    });
    await db.insert(studentResults).values(toInsert);
    revalidatePath(`/admin/result-module/${batchId}`);
    return { success: true, count: toInsert.length };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// PUBLISH BATCH
// ──────────────────────────────────────────────

export async function approveAndPublishBatch(batchId: number) {
  try {
    const result = await publishResultBatch(batchId);
    revalidatePath("/admin/result-module");
    revalidatePath(`/admin/result-module/${batchId}`);
    return { success: true, ...result };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// HELPER: Search students
// ──────────────────────────────────────────────

export async function searchStudents(query: string) {
  try {
    const res = await db.query.students.findMany({
      with: { user: true, programme: true },
      limit: 20,
    });
    const filtered = res.filter(
      (s) =>
        s.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
        s.admissionNumber?.toLowerCase().includes(query.toLowerCase()) ||
        s.matricNumber?.toLowerCase().includes(query.toLowerCase())
    );
    return { success: true, data: filtered };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getAcademicSessions() {
  try {
    const sessions = await db.query.academicSessions.findMany({
      orderBy: (s, { desc }) => [desc(s.id)],
    });
    return { success: true, data: sessions };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getCoursesList() {
  try {
    const c = await db
      .select({ id: courses.id, name: courses.name, code: courses.code, creditUnits: courses.creditUnits })
      .from(courses)
      .orderBy(courses.code);
    return { success: true, data: c };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// STUDENT: Get own transcript
// ──────────────────────────────────────────────

export async function getMyTranscript(studentId: number) {
  try {
    const data = await getStudentTranscriptData(studentId);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// Add new course on-the-fly
// ──────────────────────────────────────────────

export async function createCourseOnTheFly(data: {
  name: string;
  code: string;
  creditUnits: number;
}) {
  try {
    const result = await db.insert(courses).values({
      name: data.name,
      code: data.code,
      creditUnits: data.creditUnits,
    });
    const courseId = (result as any)[0]?.insertId ?? (result as any).insertId;
    return { success: true, courseId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
