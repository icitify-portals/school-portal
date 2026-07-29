"use server";

import { hasRole, hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mail";
import { db } from "@/db";
import {
  gradingScales,
  resultBatches,
  studentResults,
  courses,
  students,
  academicSessions,
  users,
  programmes,
  departments,
} from "@/db/schema";
import { eq, inArray, and, like, or, sql } from "drizzle-orm";
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

    // Match students by matric number, admission number, or name via user join
    const rows = await db.query.students.findMany({
      where: or(
        like(students.matricNumber, term),
        like(students.admissionNumber, term),
      ),
      with: { user: true, programme: true },
      limit: 20,
    });

    // Also search by name via users table
    const byName = await db.query.users.findMany({
      where: and(
        like(users.name, term),
        eq(users.role, "student")
      ),
      limit: 10,
    });

    // Merge results, de-duplicate by student id
    const seen = new Set(rows.map(r => r.id));
    for (const u of byName) {
      const stu = await db.query.students.findFirst({
        where: eq(students.userId, u.id),
        with: { user: true, programme: true },
      });
      if (stu && !seen.has(stu.id)) {
        rows.push(stu);
        seen.add(stu.id);
      }
    }

    return { success: true, data: rows };
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

export async function getBulkTranscripts(filters: { programmeId?: number, departmentId?: number, facultyId?: number, studentIds?: number[], all?: boolean }) {
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
        // Find all departments in this faculty
        const depts = await db.query.departments.findMany({
          where: eq(departments.facultyId, filters.facultyId),
          columns: { id: true }
        });
        const deptIds = depts.map(d => d.id);
        if (deptIds.length > 0) {
          queryConditions.push(inArray(students.deptId, deptIds));
        } else {
          // Empty faculty
          queryConditions.push(eq(students.id, 0)); 
        }
      }
    }

    const matchingStudents = await db.query.students.findMany({
      where: queryConditions.length > 0 ? and(...queryConditions) : undefined,
      with: { user: true }
    });
    
    // Process in batches so we don't overload the DB
    const results = [];
    for (const student of matchingStudents) {
      try {
        const tData = await getStudentTranscriptData(student.id);
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
// ADDING RESULTS (Multi-Course Bulk CSV)
// ──────────────────────────────────────────────

export async function addMultiCourseBulkResults(
  batchId: number,
  rows: { identifier: string; courseCode: string; score: number }[],
  gradingScaleRules: string,
  autoCreateCourses: boolean = false
) {
  try {
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
