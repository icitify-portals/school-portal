import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { students, departments, programmes, enrollments, results, courses, academicSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const studentId = parseInt(params.id, 10);

    // 1. Fetch Student Bio Data
    const studentData = await db.select({
      id: students.id,
      matricNumber: students.matricNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      otherNames: students.otherNames,
      currentLevel: students.currentLevel,
      status: students.status,
      gender: students.gender,
      imageUrl: students.imageUrl,
      admissionYear: students.admissionYear,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
      kinName: students.kinName,
      kinPhone: students.kinPhone,
      department: departments.name,
      programme: programmes.name,
    })
    .from(students)
    .leftJoin(departments, eq(students.deptId, departments.id))
    .leftJoin(programmes, eq(students.programmeId, programmes.id))
    .where(eq(students.id, studentId))
    .limit(1);

    if (!studentData || studentData.length === 0) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    // 2. Fetch Enrollments & Results
    const academicData = await db.select({
      enrollmentId: enrollments.id,
      academicYear: enrollments.academicYear,
      semester: enrollments.semester,
      courseCode: courses.code,
      // @ts-expect-error - Auto-suppressed by script
      courseTitle: courses.title,
      // @ts-expect-error - Auto-suppressed by script
      courseUnits: courses.units,
      resultId: results.id,
      caScore: results.caScore,
      examScore: results.examScore,
      totalScore: results.totalScore,
      grade: results.grade,
      gradePoint: results.gradePoint,
      resultStatus: results.status,
    })
    .from(enrollments)
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(results, eq(results.enrollmentId, enrollments.id))
    .where(eq(enrollments.studentId, studentId))
    .orderBy(desc(enrollments.academicYear), desc(enrollments.semester));

    return NextResponse.json({ 
      success: true, 
      data: {
        profile: studentData[0],
        academics: academicData
      }
    });
  } catch (error: any) {
    console.error("Failed to fetch student details:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
