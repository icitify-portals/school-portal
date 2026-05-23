import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { results, enrollments, courses, students } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { withApiAuth } from "@/lib/api-auth";

async function handler(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const studentId = searchParams.get('student_id');
        const enrollmentId = searchParams.get('enrollment_id');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = (page - 1) * limit;

        let conditions: any[] = [];
        if (enrollmentId) conditions.push(eq(results.enrollmentId, parseInt(enrollmentId)));
        if (status) conditions.push(eq(results.status, status as any));
        if (studentId) conditions.push(eq(enrollments.studentId, parseInt(studentId)));

        const data = await db.select({
            id: results.id,
            enrollmentId: results.enrollmentId,
            caScore: results.caScore,
            examScore: results.examScore,
            totalScore: results.totalScore,
            grade: results.grade,
            gradePoint: results.gradePoint,
            status: results.status,
            courseCode: courses.code,
            courseName: courses.name,
            creditUnits: courses.creditUnits,
            matricNumber: students.matricNumber,
        })
            .from(results)
            .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .innerJoin(students, eq(enrollments.studentId, students.id))
            .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
            .orderBy(results.id)
            .limit(limit)
            .offset(offset);

        const [countResult] = await db.select({ count: sql<number>`count(*)` })
            .from(results)
            .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
            .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined);

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total: countResult?.count || 0,
                totalPages: Math.ceil((countResult?.count || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error("API Results Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export const GET = withApiAuth(handler);
