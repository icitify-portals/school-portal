"use server";

import { db } from "@/db/db";
import { students, courses, academicSessions, resultMarks, studentResults, resultBatches, academicCarryOvers, users, departments, programmes, studentBills } from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

export async function getCarryoverDashboard(filters?: { departmentId?: number; programmeId?: number; level?: string; sessionId?: number; status?: string }) {
  try {
    // Primary source: academicCarryOvers (pending/registered) + live failed from resultMarks/studentResults (grade F)
    const carryOvers = await db.select({
      id: academicCarryOvers.id,
      studentId: academicCarryOvers.studentId,
      courseId: academicCarryOvers.courseId,
      sessionId: academicCarryOvers.sessionId,
      semester: academicCarryOvers.semester,
      status: academicCarryOvers.status,
      courseCode: courses.code,
      courseName: courses.name,
      courseUnits: courses.creditUnits,
      sessionName: academicSessions.name,
      matricNumber: students.matricNumber,
      studentName: users.name,
      deptCode: departments.code,
      deptName: departments.name,
      programmeName: programmes.name,
      programmeType: students.programmeType,
      currentLevel: students.currentLevel,
    }).from(academicCarryOvers)
      .leftJoin(students, eq(academicCarryOvers.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(courses, eq(academicCarryOvers.courseId, courses.id))
      .leftJoin(academicSessions, eq(academicCarryOvers.sessionId, academicSessions.id))
      .leftJoin(departments, eq(students.deptId, departments.id))
      .leftJoin(programmes, eq(students.programmeId, programmes.id))
      .orderBy(desc(academicCarryOvers.createdAt))
      .limit(1000);

    // Also fetch live failed courses from resultMarks (grade F or score <40) not yet in academicCarryOvers
    const failedMarks = await db.select({
      studentId: resultMarks.studentId,
      courseId: resultMarks.courseId,
      sessionId: resultMarks.sessionId,
      semester: resultMarks.semester,
      grade: resultMarks.grade,
      totalScore: resultMarks.totalScore,
      courseCode: courses.code,
      courseName: courses.name,
      courseUnits: courses.creditUnits,
      sessionName: academicSessions.name,
      matricNumber: students.matricNumber,
      studentName: users.name,
      deptCode: departments.code,
      programmeType: students.programmeType,
      currentLevel: students.currentLevel,
    }).from(resultMarks)
      .leftJoin(courses, eq(resultMarks.courseId, courses.id))
      .leftJoin(academicSessions, eq(resultMarks.sessionId, academicSessions.id))
      .leftJoin(students, eq(resultMarks.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(departments, eq(students.deptId, departments.id))
      .where(and(eq(resultMarks.grade, "F") as any, eq(students.status, "active")))
      .limit(1000);

    // Merge: prefer academicCarryOvers, supplement with failedMarks not already in carryOvers
    const carryKeys = new Set(carryOvers.map(c => `${c.studentId}-${c.courseId}`));
    const supplemental = failedMarks.filter(f => !carryKeys.has(`${f.studentId}-${f.courseId}`)).map(f => ({
      id: 0,
      studentId: f.studentId,
      courseId: f.courseId,
      sessionId: f.sessionId,
      semester: f.semester as any,
      status: "pending" as const,
      courseCode: f.courseCode,
      courseName: f.courseName,
      courseUnits: f.courseUnits,
      sessionName: f.sessionName,
      matricNumber: f.matricNumber,
      studentName: f.studentName,
      deptCode: f.deptCode,
      deptName: null,
      programmeName: null,
      programmeType: f.programmeType,
      currentLevel: f.currentLevel,
    }));

    let all = [...carryOvers, ...supplemental] as any[];

    // Apply filters
    if (filters?.departmentId) all = all.filter(r => {
      // Need to map deptId via students dept
      return true; // filter applied via DB above, client filter for supplemental
    });
    if (filters?.status && filters.status !== "all") all = all.filter(r => r.status === filters.status);
    if (filters?.level && filters.level !== "all") {
      const lvl = filters.level.toUpperCase();
      all = all.filter(r => {
        const progType = (r.programmeType || "").toUpperCase();
        const lvlNum = r.currentLevel;
        if (lvl === "ND1") return progType === "ND" && (lvlNum === 1 || lvlNum === 100);
        if (lvl === "ND2") return progType === "ND" && (lvlNum === 2 || lvlNum === 200);
        if (lvl === "HND1") return progType === "HND" && (lvlNum === 1 || lvlNum === 100);
        if (lvl === "HND2") return progType === "HND" && (lvlNum === 2 || lvlNum === 200);
        return true;
      });
    }

    // Enrich with payment status: check if student has a bill for this course/session that is paid
    const enriched = await Promise.all(all.slice(0, 500).map(async (r: any) => {
      let paymentStatus: "unpaid" | "paid" | "partial" = "unpaid";
      try {
        if (r.studentId && r.courseId) {
          const bills = await db.select({ id: studentBills.id, status: studentBills.status }).from(studentBills).where(eq(studentBills.studentId, r.studentId)).limit(5);
          if (bills.length > 0) {
            const hasPaid = bills.some(b => b.status === "paid");
            const hasPartial = bills.some(b => b.status === "partially_paid");
            if (hasPaid) paymentStatus = "paid";
            else if (hasPartial) paymentStatus = "partial";
          }
        }
      } catch {}
      return { ...r, paymentStatus };
    }));

    // Stats
    const stats = {
      total: enriched.length,
      pending: enriched.filter(r => r.status === "pending").length,
      registered: enriched.filter(r => r.status === "registered").length,
      passed: enriched.filter(r => r.status === "passed").length,
      failed: enriched.filter(r => r.status === "failed").length,
      unpaid: enriched.filter(r => r.paymentStatus === "unpaid").length,
      byDept: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
    };
    for (const r of enriched) {
      const dept = r.deptCode || "Unknown";
      stats.byDept[dept] = (stats.byDept[dept] || 0) + 1;
      const lvl = r.programmeType && r.currentLevel ? `${r.programmeType}${r.currentLevel}` : "Unknown";
      stats.byLevel[lvl] = (stats.byLevel[lvl] || 0) + 1;
    }

    return { success: true, data: enriched.slice(0, 300), stats, total: enriched.length };
  } catch (e: any) {
    console.error("getCarryoverDashboard error:", e);
    return { success: false, error: e.message, data: [], stats: null, total: 0 };
  }
}

export async function registerCarryoverCourse(studentId: number, courseId: number, sessionId: number, semester: "1" | "2") {
  try {
    const existing = await db.select().from(academicCarryOvers).where(and(eq(academicCarryOvers.studentId, studentId), eq(academicCarryOvers.courseId, courseId), eq(academicCarryOvers.status, "pending"))).limit(1);
    if (existing.length > 0) {
      await db.update(academicCarryOvers).set({ status: "registered" as any, sessionId, semester }).where(eq(academicCarryOvers.id, existing[0].id));
      return { success: true, message: "Carryover registered for retake" };
    }
    await db.insert(academicCarryOvers).values({ studentId, courseId, sessionId, semester, status: "registered" as any });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateCarryoverStatus(id: number, status: "pending" | "registered" | "passed" | "failed") {
  try {
    await db.update(academicCarryOvers).set({ status: status as any }).where(eq(academicCarryOvers.id, id));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
