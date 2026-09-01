"use server";

import { hasRole, hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mail";
import { db } from "@/db";
import { auth } from "@/auth";
import {
  gradingScales,
  resultBatches,
  studentResults,
  studentTranscripts,
  courses,
  students,
  academicSessions,
  users,
  programmes,
  departments,
  enrollments,
  results,
  semesterSummaries,
  resultMarks,
  transcriptAuditLogs,
} from "@/db/schema";
import { eq, inArray, and, like, or, sql, isNotNull } from "drizzle-orm";
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
  semester: "1" | "2";
  gradingScaleId: number;
}) {
  try {
    if (!data.academicSessionId) return { success: false, error: "Academic session is required." };
    if (!data.gradingScaleId) return { success: false, error: "Grading scale is required. Grades will not reflect without a grading scale." };

    // Enforce: only one result batch per semester+session
    const existingBatch = await db.query.resultBatches.findFirst({
      where: and(
        eq(resultBatches.academicSessionId, data.academicSessionId),
        eq(resultBatches.semester, data.semester),
      ),
      with: { academicSession: true },
    });

    if (existingBatch) {
      const sessionName = existingBatch.academicSession?.name || `Session #${existingBatch.academicSessionId}`;
      const semLabel = data.semester === "1" ? "First" : "Second";
      return {
        success: false,
        error: `A result batch already exists for ${semLabel} Semester, ${sessionName}. You can update the existing batch instead of creating a new one.`,
        existingBatchId: existingBatch.id,
      };
    }

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

    // Check if student view is enabled for this batch's session+semester
    if (batch) {
      const viewableTranscript = await db.query.studentTranscripts.findFirst({
        where: and(
          eq(studentTranscripts.academicSessionId, batch.academicSessionId),
          eq(studentTranscripts.semester, batch.semester),
          eq(studentTranscripts.isViewable, true)
        ),
        columns: { id: true }
      });
      (batch as any).isStudentViewable = !!viewableTranscript;
    }

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

export async function addBulkResultsViaIdentifier(
  batchId: number,
  courseId: number,
  rows: { identifier: string; score: number }[],
  gradingScaleRules: string
) {
  try {
    // Get course credit load
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId)
    });
    if (!course) throw new Error("Course not found");
    const creditLoad = course.creditUnits || 0;

    // Get all students to map identifiers
    const allStudents = await db.query.students.findMany();
    
    const toInsert: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const identifier = String(row.identifier).trim().toLowerCase();
      
      const student = allStudents.find(
        (s) => 
          s.matricNumber?.toLowerCase() === identifier || 
          s.admissionNumber?.toLowerCase() === identifier
      );

      if (!student) {
        errors.push(`Row ${i + 2}: Student not found for ID '${row.identifier}'`);
        continue;
      }

      const { grade, gradePoint } = resolveGrade(row.score, gradingScaleRules);
      
      toInsert.push({
        studentId: student.id,
        courseId,
        batchId,
        score: row.score.toString(),
        grade,
        gradePoint: gradePoint.toString(),
        creditLoad,
      });
    }

    if (toInsert.length > 0) {
      await db.insert(studentResults).values(toInsert);
    }

    revalidatePath(`/admin/result-module/${batchId}`);
    return { 
      success: true, 
      count: toInsert.length,
      errors 
    };
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
    const term = `%${query}%`;
    const isNumeric = /^\d+$/.test(query.trim());

    // Match students by matric number, admission number
    const rows = await db.query.students.findMany({
      where: or(
        like(students.matricNumber, term),
        like(students.admissionNumber, term),
        isNumeric ? eq(students.id, Number(query.trim())) : undefined,
      ),
      with: { user: true, programme: true, department: true },
      limit: 20,
    });

    // Also search by name or email via users table
    const byName = await db.query.users.findMany({
      where: and(
        or(
          like(users.name, term),
          like(users.email, term),
        ),
        eq(users.role, "student")
      ),
      limit: 10,
    });

    // Merge results, de-duplicate by student id
    const seen = new Set(rows.map(r => r.id));
    for (const u of byName) {
      if (seen.has(u.id)) continue;
      const stu = await db.query.students.findFirst({
        where: eq(students.userId, u.id),
        with: { user: true, programme: true, department: true },
      });
      if (stu && !seen.has(stu.id)) {
        rows.push(stu);
        seen.add(stu.id);
      }
    }

    // Also search by programme name (e.g. typing "ND Computer Science")
    const byProg = await db.query.programmes.findMany({
      where: like(programmes.name, term),
      limit: 5,
    });
    if (byProg.length > 0) {
      const progIds = byProg.map(p => p.id);
      const progStudents = await db.query.students.findMany({
        where: inArray(students.programmeId, progIds),
        with: { user: true, programme: true, department: true },
        limit: 20,
      });
      for (const s of progStudents) {
        if (!seen.has(s.id)) {
          rows.push(s);
          seen.add(s.id);
        }
      }
    }

    return { success: true, data: rows.slice(0, 20) };
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

export async function getMyTranscript(studentId: number, options?: { viewForStudent?: boolean }) {
  try {
    const data = await getStudentTranscriptData(studentId, options);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getBulkTranscripts(filters: { programmeId?: number, departmentId?: number, facultyId?: number, studentIds?: number[], all?: boolean, level?: string, sessionId?: number, semester?: string }) {
  try {
    let queryConditions = [];
    
    if (filters.studentIds && filters.studentIds.length > 0) {
      queryConditions.push(inArray(students.id, filters.studentIds));
    } else if (!filters.all) {
      if (filters.programmeId) {
        queryConditions.push(eq(students.programmeId, filters.programmeId));
      } else if (filters.departmentId) {
        queryConditions.push(eq(students.deptId, filters.departmentId));
      } else if (filters.facultyId) {
        const depts = await db.query.departments.findMany({
          where: eq(departments.facultyId, filters.facultyId),
          columns: { id: true }
        });
        const deptIds = depts.map(d => d.id);
        if (deptIds.length > 0) {
          queryConditions.push(inArray(students.deptId, deptIds));
        } else {
          queryConditions.push(eq(students.id, 0)); 
        }
      }
    }

    // Level filter: ND1, ND2, HND1, HND2
    if (filters.level && filters.level !== "all") {
      const levelMap: Record<string, { programmeType: string; currentLevel: number }> = {
        "ND1": { programmeType: "ND", currentLevel: 1 },
        "ND2": { programmeType: "ND", currentLevel: 2 },
        "HND1": { programmeType: "HND", currentLevel: 1 },
        "HND2": { programmeType: "HND", currentLevel: 2 },
      };
      const lvl = levelMap[filters.level];
      if (lvl) {
        queryConditions.push(eq(students.programmeType, lvl.programmeType as any));
        queryConditions.push(eq(students.currentLevel, lvl.currentLevel));
      }
    }

    const matchingStudents = await db.query.students.findMany({
      where: queryConditions.length > 0 ? and(...queryConditions) : undefined,
      with: { user: true, programme: true, department: true },
      orderBy: (s, { asc }) => [asc(sql`RIGHT(${s.matricNumber}, 3)`)],
    });
    
    // Process in batches so we don't overload the DB
    const results = [];
    for (const student of matchingStudents) {
      try {
        const tData = await getStudentTranscriptData(student.id, { sessionId: filters.sessionId, semester: filters.semester });
        if (tData.transcripts && tData.transcripts.length > 0) {
          results.push(tData);
        }
      } catch (e) {
        console.error("Failed to fetch transcript for student", student.id, e);
      }
    }
    
    return { success: true, data: results };
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

// ──────────────────────────────────────────────
// EMAIL TRANSCRIPT
// ──────────────────────────────────────────────

export async function sendStudentTranscriptEmail(email: string, pdfBase64: string, studentName: string) {
  try {
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Official Academic Transcript</h2>
        <p>Dear ${studentName},</p>
        <p>Please find attached your official academic transcript from FSS Ibadan.</p>
        <p>If you have any questions or require further assistance, please contact the registrar's office.</p>
        <br />
        <p>Best regards,</p>
        <p><strong>FSS Ibadan Registry</strong></p>
      </div>
    `;

    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");

    const res = await sendEmail(
      email,
      "Your Official Academic Transcript - FSS Ibadan",
      html,
      undefined,
      undefined,
      [
        {
          filename: `Transcript_${studentName.replace(/\s+/g, "_")}.pdf`,
          content: Buffer.from(base64Data, "base64"),
        }
      ]
    );

    return res;
  } catch (e: any) {
    console.error("Transcript email error:", e);
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// CSV IMPORT PREVIEW (Smart Validation)
// ──────────────────────────────────────────────

export async function previewBulkImport(
  batchId: number,
  rows: { identifier: string; courseCode: string; score: number }[]
) {
  try {
    const MAX_BATCH_SIZE = 300;
    if (rows.length > MAX_BATCH_SIZE) {
      return {
        success: false,
        error: `Batch size exceeds limit of ${MAX_BATCH_SIZE} records. Please split your data into smaller batches.`,
        preview: [],
        errors: [],
        warnings: [],
        anomalies: [],
        summary: null,
      };
    }
    const allStudents = await db.query.students.findMany({
      columns: { id: true, matricNumber: true, admissionNumber: true, name: true, firstName: true, lastName: true, programmeType: true, deptId: true, level: true },
    });

    const batch = await db.query.resultBatches.findFirst({ where: eq(resultBatches.id, batchId) });
    const gradingRules = batch?.gradingScale?.rules || '[]';
    const rules: { min: number; max: number; grade: string; point: number }[] = JSON.parse(gradingRules);

    function gradeScore(score: number) {
      const match = rules.find(r => score >= r.min && score <= r.max);
      return match ? { grade: match.grade, gradePoint: match.point } : { grade: 'F', gradePoint: 0 };
    }

    // Import the smart matching modules
    const { parseMatric, validateScore: validateScoreFn, extractSerial } = await import('@/lib/matric-parser');
    const { matchStudent } = await import('@/lib/student-matcher');

    const previewRows: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const anomalies: string[] = [];

    // Track CSV-level duplicates
    const seenIdentifiers = new Map<string, number[]>();
    rows.forEach((row, i) => {
      const id = (row.identifier || '').trim().toLowerCase();
      if (!id) return;
      if (!seenIdentifiers.has(id)) seenIdentifiers.set(id, []);
      seenIdentifiers.get(id)!.push(i);
    });

    // Report duplicates
    for (const [id, indices] of seenIdentifiers) {
      if (indices.length > 1) {
        anomalies.push(`Duplicate in CSV: '${rows[indices[0]].identifier}' appears ${indices.length} times (rows ${indices.map(x => x + 2).join(', ')})`);
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const id = (row.identifier || '').trim();

      if (!id) {
        errors.push(`Row ${i + 2}: Missing identifier`);
        continue;
      }

      // Smart student matching
      const match = matchStudent(id, allStudents);

      // Validate score
      const scoreValidation = validateScoreFn(row.score, 100);
      const { grade, gradePoint } = gradeScore(row.score);

      previewRows.push({
        rowIndex: i + 2,
        identifier: id,
        matchedStudent: match.student ? {
          id: match.student.id,
          name: match.student.name || `${match.student.firstName} ${match.student.lastName}`,
          matricNumber: match.student.matricNumber,
        } : null,
        matchConfidence: match.confidence,
        matchStrategy: match.strategy,
        courseCode: row.courseCode,
        score: row.score,
        grade,
        gradePoint,
        isValid: scoreValidation.isValid && !!match.student,
        warning: scoreValidation.warning,
        status: !match.student ? 'error' : match.confidence < 0.8 ? 'review' : 'ready',
      });

      if (!match.student) {
        const serial = extractSerial(id, 5);
        errors.push(`Row ${i + 2}: Student not found for '${id}'${serial ? ` (serial: ${serial})` : ''}`);
      } else if (match.confidence < 0.8) {
        warnings.push(`Row ${i + 2}: Low confidence match for '${id}' → ${match.student.name} (${match.strategy}, ${Math.round(match.confidence * 100)}%)`);
      }

      if (scoreValidation.warning) {
        warnings.push(`Row ${i + 2}: ${scoreValidation.warning} for ${row.courseCode}`);
      }
    }

    const summary = {
      totalRows: rows.length,
      autoImport: previewRows.filter(r => r.status === 'ready').length,
      needsReview: previewRows.filter(r => r.status === 'review').length,
      willFail: previewRows.filter(r => r.status === 'error').length,
      duplicateCount: anomalies.length,
    };

    return {
      success: true,
      preview: previewRows,
      errors,
      warnings,
      anomalies,
      summary,
    };
  } catch (e: any) {
    return { success: false, error: e.message, preview: [], errors: [], warnings: [], anomalies: [], summary: null };
  }
}

// ──────────────────────────────────────────────
// ADDING RESULTS (Multi-Course Bulk CSV)
// ──────────────────────────────────────────────

export async function addMultiCourseBulkResults(
  batchId: number,
  rows: { identifier: string; courseCode: string; score: number }[],
  gradingScaleRules: string,
  autoCreateCourses: boolean = false
) {
  try {
    const MAX_BATCH_SIZE = 300;
    if (rows.length > MAX_BATCH_SIZE) {
      return {
        success: false,
        error: `Batch size exceeds limit of ${MAX_BATCH_SIZE} records. Please split your data into smaller batches.`,
        count: 0,
        errors: [],
        createdCourses: [],
      };
    }

    const allStudents = await db.query.students.findMany();
    const allCourses = await db.query.courses.findMany();

    const errors: string[] = [];
    const toInsert: any[] = [];
    const createdCourses: { code: string; id: number }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const identifier = String(row.identifier).trim().toLowerCase();
      const courseCode = String(row.courseCode).trim().toUpperCase();

      if (!identifier) { errors.push(`Row ${i + 2}: missing matric_number`); continue; }
      if (!courseCode) { errors.push(`Row ${i + 2}: missing course_code`); continue; }
      if (isNaN(row.score)) { errors.push(`Row ${i + 2}: invalid score '${row.score}'`); continue; }

      const student = allStudents.find(
        (s) =>
          s.matricNumber?.toLowerCase() === identifier ||
          s.admissionNumber?.toLowerCase() === identifier
      );
      if (!student) {
        errors.push(`Row ${i + 2}: Student not found for '${row.identifier}'`);
        continue;
      }

      let course = allCourses.find((c) => c.code.toUpperCase() === courseCode);
      if (!course) {
        if (autoCreateCourses) {
          const result = await db.insert(courses).values({
            name: courseCode,
            code: courseCode,
            creditUnits: 3,
          });
          const courseId = (result as any)[0]?.insertId ?? (result as any).insertId;
          allCourses.push({ id: courseId, code: courseCode, name: courseCode, creditUnits: 3 } as any);
          createdCourses.push({ code: courseCode, id: courseId });
          course = allCourses[allCourses.length - 1];
        } else {
          errors.push(`Row ${i + 2}: Course '${row.courseCode}' not found`);
          continue;
        }
      }

      const creditLoad = course.creditUnits || 3;
      const { grade, gradePoint } = resolveGrade(row.score, gradingScaleRules);

      toInsert.push({
        studentId: student.id,
        courseId: course.id,
        batchId,
        score: row.score.toString(),
        grade,
        gradePoint: gradePoint.toString(),
        creditLoad,
      });
    }

    if (toInsert.length > 0) {
      await db.insert(studentResults).values(toInsert);
    }

    revalidatePath(`/admin/result-module/${batchId}`);
    return {
      success: true,
      count: toInsert.length,
      errors: errors.length > 0 ? errors : undefined,
      createdCourses,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// CREATE STUDENT (standalone)
// ──────────────────────────────────────────────

export async function createStudent(data: {
  firstName: string;
  lastName: string;
  email: string;
  matricNumber: string;
  programmeId: number;
  deptId: number;
}) {
  try {
    const email = data.email || `${data.matricNumber.toLowerCase()}@student.edu`;

    const [existing] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.matricNumber, data.matricNumber))
      .limit(1);

    if (existing) {
      return { success: false, error: "A student with this matric number or email already exists" };
    }

    const [insertedUser] = await db.insert(users).values({
      name: `${data.firstName} ${data.lastName}`,
      firstName: data.firstName,
      surname: data.lastName,
      email,
      password: sql`SHA2(${data.matricNumber}, 256)`,
      role: "student",
    });

    const userId = (insertedUser as any)[0]?.insertId ?? (insertedUser as any).insertId;

    const [insertedStudent] = await db.insert(students).values({
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      matricNumber: data.matricNumber,
      programmeId: data.programmeId,
      deptId: data.deptId,
    });

    const studentId = (insertedStudent as any)[0]?.insertId ?? (insertedStudent as any).insertId;

    revalidatePath("/admin/result-module");
    return { success: true, studentId, userId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getProgrammesList() {
  try {
    const p = await db.query.programmes.findMany({
      with: { department: true },
    });
    return { success: true, data: p };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getDepartmentsList() {
  try {
    const d = await db.query.departments.findMany();
    return { success: true, data: d };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getFacultiesList() {
  try {
    const f = await db.query.faculties.findMany();
    return { success: true, data: f };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// RESULT UPLOAD TEMPLATE (downloadable roster)
// ──────────────────────────────────────────────

export async function getResultTemplateStudents(filters: {
  programmeId?: number;
  departmentId?: number;
  facultyId?: number;
  all?: boolean;
  level?: string;
}) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasRole("registrar") || await hasRole("record_officer") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to download result template" };

    const queryConditions: any[] = [];

    if (filters.programmeId) {
      queryConditions.push(eq(students.programmeId, filters.programmeId));
    } else if (filters.departmentId) {
      queryConditions.push(eq(students.deptId, filters.departmentId));
    } else if (filters.facultyId) {
      const depts = await db.query.departments.findMany({
        where: eq(departments.facultyId, filters.facultyId),
        columns: { id: true },
      });
      const deptIds = depts.map(d => d.id);
      queryConditions.push(deptIds.length > 0 ? inArray(students.deptId, deptIds) : eq(students.id, 0));
    }

    // Level filter: ND1, ND2, HND1, HND2
    if (filters.level && filters.level !== "all") {
      const levelMap: Record<string, { programmeType: string; currentLevel: number }> = {
        "ND1": { programmeType: "ND", currentLevel: 1 },
        "ND2": { programmeType: "ND", currentLevel: 2 },
        "HND1": { programmeType: "HND", currentLevel: 1 },
        "HND2": { programmeType: "HND", currentLevel: 2 },
      };
      const lvl = levelMap[filters.level];
      if (lvl) {
        queryConditions.push(eq(students.programmeType, lvl.programmeType as any));
        queryConditions.push(eq(students.currentLevel, lvl.currentLevel));
      }
    }

    // Only students with a matric/admission number can be matched on upload
    queryConditions.push(or(isNotNull(students.matricNumber), isNotNull(students.admissionNumber)));

    const matchingStudents = await db.query.students.findMany({
      where: queryConditions.length > 0 ? and(...queryConditions) : undefined,
      with: {
        user: true,
        programme: true,
      },
      orderBy: (s, { asc }) => [asc(sql`RIGHT(${s.matricNumber}, 3)`)],
    });

    const rows = matchingStudents.map(s => ({
      matricNumber: s.matricNumber || s.admissionNumber || "",
      name: s.user?.name || `${s.firstName || ""} ${s.lastName || ""}`.trim() || "",
      programme: s.programme?.name || "",
    }));

    const MAX_ROWS = 5000;
    const truncated = rows.length > MAX_ROWS;

    return {
      success: true,
      data: truncated ? rows.slice(0, MAX_ROWS) : rows,
      total: rows.length,
      truncated,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// BULK STUDENT CSV IMPORT
// ──────────────────────────────────────────────

export async function bulkImportStudents(
  rows: { firstName: string; lastName: string; email: string; matricNumber: string; programmeId: number; deptId: number }[]
) {
  try {
    const created: number[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.matricNumber) { errors.push({ row: i + 2, error: "missing matricNumber" }); continue; }

        const [existing] = await db
          .select({ id: students.id })
          .from(students)
          .where(eq(students.matricNumber, r.matricNumber))
          .limit(1);

        if (existing) { errors.push({ row: i + 2, error: `matric '${r.matricNumber}' already exists` }); continue; }

        const email = r.email || `${r.matricNumber.toLowerCase()}@student.edu`;

        const [insertedUser] = await db.insert(users).values({
          name: `${r.firstName} ${r.lastName}`,
          firstName: r.firstName,
          surname: r.lastName,
          email,
          password: sql`SHA2(${r.matricNumber}, 256)`,
          role: "student",
        });
        const userId = (insertedUser as any)[0]?.insertId ?? (insertedUser as any).insertId;

        const [insertedStudent] = await db.insert(students).values({
          userId,
          firstName: r.firstName,
          lastName: r.lastName,
          matricNumber: r.matricNumber,
          programmeId: r.programmeId || null,
          deptId: r.deptId || null,
        });
        const studentId = (insertedStudent as any)[0]?.insertId ?? (insertedStudent as any).insertId;
        created.push(studentId);
      } catch (e: any) {
        errors.push({ row: i + 2, error: e.message });
      }
    }

    revalidatePath("/admin/result-module");
    return { success: true, created: created.length, errors };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createStudentRm(data: any) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };
    
    // Simplistic creation of user + student
    const [userRes] = await db.insert(users).values({
      name: data.name,
      email: (data.matricNumber || "unknown") + "@fssibadan.edu.ng",
      password: "hashed_password",
      role: "student"
    });
    
    await db.insert(students).values({
      userId: userRes.insertId,
      matricNumber: data.matricNumber,
    });
    
    revalidatePath("/admin/result-module/students");
    return { success: true };
  } catch(e) {
    return { success: false, error: "Failed to create student. " + String(e) };
  }
}

export async function deleteStudentRm(id: number) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };
    
    const [stu] = await db.select().from(students).where(eq(students.id, id));
    if (stu) {
      await db.delete(students).where(eq(students.id, id));
      await db.delete(users).where(eq(users.id, stu.userId));
    }
    
    revalidatePath("/admin/result-module/students");
    return { success: true };
  } catch(e) {
    return { success: false, error: "Failed to delete student. " + String(e) };
  }
}

export async function updateStudentRm(id: number, data: any) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };
    
    await db.update(students).set({
      matricNumber: data.matricNumber,
    }).where(eq(students.id, id));
    
    const [stu] = await db.select().from(students).where(eq(students.id, id));
    if (stu) {
      await db.update(users).set({ name: data.name }).where(eq(users.id, stu.userId));
    }
    
    revalidatePath("/admin/result-module/students");
    return { success: true };
  } catch(e) {
    return { success: false, error: "Failed to update student. " + String(e) };
  }
}

// ──────────────────────────────────────────────
// EDIT / MODIFY RESULT RECORD
// ──────────────────────────────────────────────

export async function updateStudentResult(resultId: number, data: { score: number; creditLoad?: number; courseId?: number }) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasRole("registrar") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const resultRow = await db.query.studentResults.findFirst({
      where: eq(studentResults.id, resultId),
      with: {
        batch: {
          with: { gradingScale: true }
        }
      }
    });

    if (!resultRow) return { success: false, error: "Result record not found" };

    const gradingScaleRules = resultRow.batch?.gradingScale?.rules || "[]";
    const { grade, gradePoint } = resolveGrade(data.score, gradingScaleRules);

    const updatePayload: any = {
      score: data.score.toString(),
      grade,
      gradePoint: gradePoint.toString(),
    };

    if (data.creditLoad !== undefined) {
      updatePayload.creditLoad = data.creditLoad;
    }
    if (data.courseId !== undefined) {
      updatePayload.courseId = data.courseId;
    }

    await db.update(studentResults)
      .set(updatePayload)
      .where(eq(studentResults.id, resultId));

    revalidatePath(`/admin/result-module/${resultRow.batchId}`);
    return { success: true, grade, gradePoint };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// DELETE SINGLE RESULT RECORD
// ──────────────────────────────────────────────

export async function deleteStudentResult(resultId: number) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasRole("registrar") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const resultRow = await db.query.studentResults.findFirst({
      where: eq(studentResults.id, resultId)
    });

    if (!resultRow) return { success: false, error: "Result record not found" };

    await db.delete(studentResults).where(eq(studentResults.id, resultId));

    revalidatePath(`/admin/result-module/${resultRow.batchId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// CLEAR ALL RESULTS IN A BATCH
// ──────────────────────────────────────────────

export async function clearBatchResults(batchId: number) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasRole("registrar") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };

    await db.delete(studentResults).where(eq(studentResults.batchId, batchId));

    revalidatePath(`/admin/result-module/${batchId}`);
    revalidatePath("/admin/result-module");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// DELETE ENTIRE RESULT BATCH
// ──────────────────────────────────────────────

export async function deleteResultBatch(batchId: number) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasRole("registrar") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };

    await db.delete(studentResults).where(eq(studentResults.batchId, batchId));
    await db.delete(resultBatches).where(eq(resultBatches.id, batchId));

    revalidatePath("/admin/result-module");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// TOGGLE BATCH PUBLICATION (Display on Student Dashboard)
// ──────────────────────────────────────────────

export async function toggleBatchPublication(batchId: number, publish: boolean) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasRole("registrar") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const batch = await db.query.resultBatches.findFirst({
      where: eq(resultBatches.id, batchId)
    });

    if (!batch) return { success: false, error: "Batch not found" };

    if (publish) {
      // Publish batch & generate/enable transcripts
      await publishResultBatch(batchId);
    } else {
      // Unpublish batch & hide from student dashboard
      await db.update(resultBatches)
        .set({ status: "pending" })
        .where(eq(resultBatches.id, batchId));

      await db.update(studentTranscripts)
        .set({ isPublished: false, isViewable: false })
        .where(
          and(
            eq(studentTranscripts.academicSessionId, batch.academicSessionId),
            eq(studentTranscripts.semester, batch.semester)
          )
        );

      // Clean up LMS bridge data so students can't see results
      // Delete enrollments for this batch's session+semester
      const batchEnrollments = await db.select({ id: enrollments.id })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.sessionId, batch.academicSessionId),
            eq(enrollments.semester, parseInt(batch.semester))
          )
        );

      if (batchEnrollments.length > 0) {
        const enrollIds = batchEnrollments.map(e => e.id);
        // Delete results linked to these enrollments
        await db.delete(results).where(inArray(results.enrollmentId, enrollIds));
        // Delete the enrollments themselves
        await db.delete(enrollments).where(inArray(enrollments.id, enrollIds));
      }

      // Delete semester summaries for this session+semester
      await db.delete(semesterSummaries).where(
        and(
          eq(semesterSummaries.sessionId, batch.academicSessionId),
          eq(semesterSummaries.semester, batch.semester as "1" | "2")
        )
      );

      // Clean up resultMarks for this batch's students+session+semester
      const batchResultsList = await db.select({ studentId: studentResults.studentId, courseId: studentResults.courseId })
        .from(studentResults)
        .where(eq(studentResults.batchId, batchId));

      for (const br of batchResultsList) {
        await db.delete(resultMarks).where(
          and(
            eq(resultMarks.studentId, br.studentId),
            eq(resultMarks.courseId, br.courseId),
            eq(resultMarks.sessionId, batch.academicSessionId),
            eq(resultMarks.semester, batch.semester as "1" | "2")
          )
        );
      }
    }

    revalidatePath("/admin/result-module");
    revalidatePath(`/admin/result-module/${batchId}`);

    await logTranscriptActivity({
      action: publish ? "publish" : "unpublish",
      targetType: "batch",
      targetId: batchId,
      targetLabel: `Batch #${batchId} (${batch.academicSessionId}/Sem ${batch.semester})`,
      details: { semester: batch.semester, sessionId: batch.academicSessionId },
    });

    return { success: true, isPublished: publish };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// TOGGLE STUDENT VIEW (separate from publish)
// ──────────────────────────────────────────────

export async function toggleStudentView(batchId: number, viewable: boolean) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasRole("registrar") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const batch = await db.query.resultBatches.findFirst({
      where: eq(resultBatches.id, batchId)
    });
    if (!batch) return { success: false, error: "Batch not found" };

    // Update student_transcripts isViewable for this batch's session+semester
    await db.update(studentTranscripts)
      .set({ isViewable: viewable, updatedAt: new Date() })
      .where(
        and(
          eq(studentTranscripts.academicSessionId, batch.academicSessionId),
          eq(studentTranscripts.semester, batch.semester)
        )
      );

    revalidatePath("/admin/result-module");
    revalidatePath(`/admin/result-module/${batchId}`);

    await logTranscriptActivity({
      action: viewable ? "toggle_student_view_on" : "toggle_student_view_off",
      targetType: "batch",
      targetId: batchId,
      targetLabel: `Batch #${batchId} (${batch.academicSessionId}/Sem ${batch.semester})`,
      details: { semester: batch.semester, sessionId: batch.academicSessionId, viewable },
    });

    return { success: true, isViewable: viewable };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────
// AUDIT LOGGING
// ──────────────────────────────────────────────

export async function logTranscriptActivity(data: {
  action: string;
  targetType: string;
  targetId?: number;
  targetLabel?: string;
  details?: Record<string, any>;
}) {
  try {
    const session = await auth() as any;
    const actorId = session?.user?.id;
    const actorName = session?.user?.name || session?.user?.email || "Unknown";
    const actorRole = session?.user?.role || "user";

    await db.insert(transcriptAuditLogs).values({
      actorId: actorId || 0,
      actorName,
      actorRole,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId || null,
      targetLabel: data.targetLabel || null,
      details: data.details ? JSON.stringify(data.details) : null,
    });

    return { success: true };
  } catch (e: any) {
    console.error("Audit log error:", e);
    return { success: false, error: e.message };
  }
}

export async function getTranscriptAuditLogs(filters?: {
  action?: string;
  targetType?: string;
  actorId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasRole("registrar");
    if (!allowed) return { success: false, error: "Unauthorized" };

    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 50, 100);
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.action) conditions.push(eq(transcriptAuditLogs.action, filters.action));
    if (filters?.targetType) conditions.push(eq(transcriptAuditLogs.targetType, filters.targetType));
    if (filters?.actorId) conditions.push(eq(transcriptAuditLogs.actorId, filters.actorId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, countResult] = await Promise.all([
      db.query.transcriptAuditLogs.findMany({
        where: whereClause,
        orderBy: (l, { desc }) => [desc(l.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(transcriptAuditLogs)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count || 0;

    return {
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}


