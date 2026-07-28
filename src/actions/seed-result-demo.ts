"use server";

import { db } from "@/db";
import {
  gradingScales, resultBatches, studentResults, courses,
  students, users, programmes, departments, academicSessions,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { resolveGrade, publishResultBatch } from "@/services/results.service";

const DEMO_STUDENTS = [
  { firstName: "Adebayo", lastName: "Ogunlesi", matricNumber: "DEMO/ND/COM/001" },
  { firstName: "Chioma", lastName: "Okonkwo", matricNumber: "DEMO/ND/COM/002" },
  { firstName: "Emeka", lastName: "Nwachukwu", matricNumber: "DEMO/ND/COM/003" },
];

const FIRST_SEMESTER_COURSES = [
  { code: "COM 111", name: "Introduction to Computing", cu: 3 },
  { code: "COM 112", name: "Computer Programming I", cu: 3 },
  { code: "MTH 111", name: "Algebra & Trigonometry", cu: 3 },
  { code: "MTH 112", name: "Calculus I", cu: 3 },
  { code: "GNS 101", name: "Use of English I", cu: 2 },
  { code: "STA 111", name: "Descriptive Statistics", cu: 3 },
];

const SECOND_SEMESTER_COURSES = [
  { code: "COM 121", name: "Computer Programming II", cu: 3 },
  { code: "COM 122", name: "Data Structures", cu: 3 },
  { code: "COM 123", name: "Digital Logic Design", cu: 3 },
  { code: "MTH 121", name: "Calculus II", cu: 3 },
  { code: "GNS 102", name: "Use of English II", cu: 2 },
  { code: "STA 121", name: "Probability Theory", cu: 3 },
];

const STUDENT_SCORES: Record<string, Record<string, number[]>> = {
  "DEMO/ND/COM/001": {
    "COM 111": [85, 78], "COM 112": [72, 80], "MTH 111": [68, 70], "MTH 112": [75, 72],
    "GNS 101": [90, 88], "STA 111": [70, 75],
    "COM 121": [82, 85], "COM 122": [76, 78], "COM 123": [70, 72], "MTH 121": [73, 76],
    "GNS 102": [88, 85], "STA 121": [74, 70],
  },
  "DEMO/ND/COM/002": {
    "COM 111": [60, 65], "COM 112": [55, 62], "MTH 111": [70, 68], "MTH 112": [65, 60],
    "GNS 101": [75, 80], "STA 111": [58, 62],
    "COM 121": [64, 68], "COM 122": [60, 65], "COM 123": [55, 58], "MTH 121": [62, 66],
    "GNS 102": [78, 82], "STA 121": [60, 64],
  },
  "DEMO/ND/COM/003": {
    "COM 111": [45, 50], "COM 112": [42, 48], "MTH 111": [55, 52], "MTH 112": [48, 50],
    "GNS 101": [65, 70], "STA 111": [50, 55],
    "COM 121": [48, 52], "COM 122": [44, 50], "COM 123": [40, 45], "MTH 121": [50, 54],
    "GNS 102": [68, 72], "STA 121": [46, 52],
  },
};

export async function seedResultDemo() {
  try {
    const rules = `[{"min":75,"max":100,"grade":"AA","point":4.0},{"min":70,"max":74,"grade":"A","point":3.5},{"min":65,"max":69,"grade":"AB","point":3.25},{"min":60,"max":64,"grade":"B","point":3.0},{"min":55,"max":59,"grade":"BC","point":2.75},{"min":50,"max":54,"grade":"C","point":2.5},{"min":45,"max":49,"grade":"CD","point":2.25},{"min":40,"max":44,"grade":"D","point":2.0},{"min":0,"max":39,"grade":"F","point":0.0}]`;

    // Ensure grading scale exists
    let [scale] = await db.select().from(gradingScales).where(eq(gradingScales.name, "FSS Standard 4.0 Scale")).limit(1);
    if (!scale) {
      const [r] = await db.insert(gradingScales).values({
        name: "FSS Standard 4.0 Scale",
        description: "Standard FSS Ibadan grading scale",
        maxCgpa: "4.00",
        rules,
      });
      const sid = (r as any)[0]?.insertId ?? (r as any).insertId;
      scale = { id: sid, rules } as any;
    }

    // Get academic session (2025/2026)
    let [session] = await db.select().from(academicSessions).where(eq(academicSessions.name, "2025/2026")).limit(1);
    if (!session) {
      const [r] = await db.insert(academicSessions).values({ name: "2025/2026", startDate: new Date("2025-09-01"), endDate: new Date("2026-08-31"), isCurrent: true });
      const sid = (r as any)[0]?.insertId ?? (r as any).insertId;
      session = { id: sid, name: "2025/2026" } as any;
    }

    // Get programme and department
    let [prog] = await db.select().from(programmes).where(eq(programmes.code, "COM")).limit(1);
    if (!prog) {
      const [r] = await db.insert(programmes).values({ name: "ND Computer Science", code: "COM", deptId: 54, programmeType: "ND", durationMonths: 24, durationYears: 2 });
      const pid = (r as any)[0]?.insertId ?? (r as any).insertId;
      prog = { id: pid, name: "ND Computer Science" } as any;
    }

    // Create demo students
    const createdStudentIds: number[] = [];
    for (const ds of DEMO_STUDENTS) {
      const existing = await db.select({ id: students.id }).from(students).where(eq(students.matricNumber, ds.matricNumber)).limit(1);
      if (existing.length > 0) { createdStudentIds.push(existing[0].id); continue; }

      const email = `${ds.matricNumber.toLowerCase()}@demo.edu`;
      const [uRes] = await db.insert(users).values({ name: `${ds.firstName} ${ds.lastName}`, firstName: ds.firstName, surname: ds.lastName, email, password: sql`SHA2(${ds.matricNumber}, 256)`, role: "student" });
      const uid = (uRes as any)[0]?.insertId ?? (uRes as any).insertId;

      const [sRes] = await db.insert(students).values({ userId: uid, firstName: ds.firstName, lastName: ds.lastName, matricNumber: ds.matricNumber, programmeId: prog.id, deptId: 54 });
      const sid = (sRes as any)[0]?.insertId ?? (sRes as any).insertId;
      createdStudentIds.push(sid);
    }

    // Create courses
    async function ensureCourses(list: { code: string; name: string; cu: number }[]) {
      const ids: number[] = [];
      for (const c of list) {
        const [existing] = await db.select({ id: courses.id }).from(courses).where(eq(courses.code, c.code)).limit(1);
        if (existing.length > 0) { ids.push(existing[0].id); continue; }
        const [r] = await db.insert(courses).values({ name: c.name, code: c.code, creditUnits: c.cu });
        const cid = (r as any)[0]?.insertId ?? (r as any).insertId;
        ids.push(cid);
      }
      return ids;
    }
    const firstSemCourseIds = await ensureCourses(FIRST_SEMESTER_COURSES);
    const secondSemCourseIds = await ensureCourses(SECOND_SEMESTER_COURSES);
    const allCourseCodes = [...FIRST_SEMESTER_COURSES, ...SECOND_SEMESTER_COURSES].map(c => c.code);

    // Create semester 1 batch
    const [b1Res] = await db.insert(resultBatches).values({
      adminId: 1, academicSessionId: session.id, semester: "1", gradingScaleId: scale.id, status: "pending",
    });
    const batch1Id = (b1Res as any)[0]?.insertId ?? (b1Res as any).insertId;

    // Add results for semester 1
    const s1g = scale.rules || rules;
    for (const sid of createdStudentIds) {
      const student = DEMO_STUDENTS.find(ds => {
        const s = createdStudentIds.indexOf(sid);
        return createdStudentIds[s] === sid;
      });
      const matric = DEMO_STUDENTS[createdStudentIds.indexOf(sid)]?.matricNumber || "";
      for (let ci = 0; ci < FIRST_SEMESTER_COURSES.length; ci++) {
        const c = FIRST_SEMESTER_COURSES[ci];
        const cid = firstSemCourseIds[ci];
        const scores = STUDENT_SCORES[matric]?.[c.code] || [60, 65];
        const score = scores[0];

        const { grade, gradePoint } = resolveGrade(score, s1g);
        await db.insert(studentResults).values({
          studentId: sid, courseId: cid, batchId: batch1Id,
          score: score.toString(), grade, gradePoint: gradePoint.toString(),
          creditLoad: c.cu,
        });
      }
    }

    // Publish semester 1
    await publishResultBatch(batch1Id);

    // Create semester 2 batch
    const [b2Res] = await db.insert(resultBatches).values({
      adminId: 1, academicSessionId: session.id, semester: "2", gradingScaleId: scale.id, status: "pending",
    });
    const batch2Id = (b2Res as any)[0]?.insertId ?? (b2Res as any).insertId;

    // Add results for semester 2
    for (const sid of createdStudentIds) {
      const matric = DEMO_STUDENTS[createdStudentIds.indexOf(sid)]?.matricNumber || "";
      for (let ci = 0; ci < SECOND_SEMESTER_COURSES.length; ci++) {
        const c = SECOND_SEMESTER_COURSES[ci];
        const cid = secondSemCourseIds[ci];
        const scores = STUDENT_SCORES[matric]?.[c.code] || [60, 65];
        const score = scores[1];

        const { grade, gradePoint } = resolveGrade(score, s1g);
        await db.insert(studentResults).values({
          studentId: sid, courseId: cid, batchId: batch2Id,
          score: score.toString(), grade, gradePoint: gradePoint.toString(),
          creditLoad: c.cu,
        });
      }
    }

    // Publish semester 2
    await publishResultBatch(batch2Id);

    revalidatePath("/admin/result-module");
    return {
      success: true,
      batch1Id,
      batch2Id,
      students: createdStudentIds.length,
      firstSemesterCourses: firstSemCourseIds.length,
      secondSemesterCourses: secondSemCourseIds.length,
    };
  } catch (e: any) {
    console.error("Demo seed error:", e);
    return { success: false, error: e.message };
  }
}
