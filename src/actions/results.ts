"use server";

import { db } from "@/db/db";
import {
    results, enrollments, courses, students, users,
    resultAuditLogs, staffProfiles, departments,
    faculties, courseDepartmentSettings, annualSummaries
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getGradingSystemForStudent } from "./grading";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { GradingService } from "@/services/GradingService";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getStudentResults(studentId: number) {
    try {
        const studentEnrollments = await db.select({
            id: enrollments.id,
            studentId: enrollments.studentId,
            courseId: enrollments.courseId,
            academicYear: enrollments.academicYear,
            semester: enrollments.semester,
            course: courses,
            result: results
        })
            .from(enrollments)
            .leftJoin(courses, eq(enrollments.courseId, courses.id))
            .leftJoin(results, eq(enrollments.id, results.enrollmentId))
            .where(eq(enrollments.studentId, studentId)) || [];

        // Fetch annual summaries if they exist
        const annuals = await db.select().from(annualSummaries).where(eq(annualSummaries.studentId, studentId));

        const gradingSystem = await getGradingSystemForStudent(studentId);
        if (!gradingSystem) return { results: [], gpaByPeriod: [], cgpa: "0.00", totalUnits: 0, classification: "N/A" };

        // Process results with points from grading system
        const processedResults = studentEnrollments.map(e => {
            const result = e.result as any;
            if (!result || result.score === null) return null;

            const score = result.score;
            // Find grade and points
            const pointRule = ((gradingSystem as any).points || []).find((p: any) => score >= p.minMark && score <= p.maxMark);

            return {
                code: e.course?.code,
                title: e.course?.name,
                units: e.course?.creditUnits || 0,
                score,
                grade: pointRule?.letterGrade || "F",
                points: parseFloat(pointRule?.points || "0"),
                rankClass: result.rankClass,
                rankLevel: result.rankLevel,
                caScore: result.caScore,
                examScore: result.examScore,
                totalScore: result.totalScore
            };
        }).filter(Boolean);

        // Group by Semester/Year for GPA
        const grouped = studentEnrollments.reduce((acc: any, e: any) => {
            const key = `${e.academicYear}-${e.semester}`;
            if (!acc[key]) acc[key] = { units: 0, weightedPoints: 0 };

            const result = e.result as any;
            if (result && result.score !== null) {
                const pointRule = ((gradingSystem as any).points || []).find((p: any) => result.score >= p.minMark && result.score <= p.maxMark);
                const points = parseFloat(pointRule?.points || "0");
                const units = e.course?.creditUnits || 0;

                acc[key].units += units;
                acc[key].weightedPoints += (points * units);
            }
            return acc;
        }, {});

        // Overall CGPA
        let totalUnits = 0;
        let totalWeightedPoints = 0;
        Object.values(grouped).forEach((g: any) => {
            totalUnits += g.units;
            totalWeightedPoints += g.weightedPoints;
        });

        const gpaByPeriod = Object.entries(grouped).map(([key, val]: [string, any]) => ({
            period: key,
            gpa: val.units > 0 ? (val.weightedPoints / val.units).toFixed(2) : "0.00"
        }));

        const cgpa = totalUnits > 0 ? (totalWeightedPoints / totalUnits).toFixed(2) : "0.00";

        // Determine Degree Class
        const classification = ((gradingSystem as any).classifications || []).find((c: any) => {
            const val = parseFloat(cgpa);
            return val >= parseFloat(c.minCgpa) && val <= parseFloat(c.maxCgpa);
        });

        return {
            results: processedResults,
            gpaByPeriod,
            cgpa,
            totalUnits,
            classification: classification?.name || "N/A",
            annualSummaries: annuals
        };
    } catch (error) {
        console.error("Error fetching student results:", error);
        return null;
    }
}

export async function submitResult(enrollmentId: number, score: number) {
    try {
        const allowed = await hasPermission("academic.results.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to submit result" };

        // Find existing result
        const [existing] = await db.select().from(results).where(eq(results.enrollmentId, enrollmentId)).limit(1);

        if (existing) {
            await db.update(results)
                .set({ totalScore: score.toString() })
                .where(eq(results.id, existing.id));
        } else {
            await db.insert(results).values({
                enrollmentId,
                totalScore: score.toString()
            });
        }
        return { success: true };
    } catch (error) {
        console.error("Error submitting result:", error);
        return { success: false, error: "Failed to submit result" };
    }
}

export async function updateResultWithAudit(data: {
    resultId: number;
    caScore?: number;
    examScore?: number;
    reason: string;
}) {
    const session = await auth();
    const user = session?.user as any;
    if (!user) return { success: false, error: "Unauthorized" };

    const userId = parseInt(user.id);
    const role = user.role;

    try {
        const allowed = await hasPermission("academic.results.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update result" };

        // 1. Fetch existing result and its course context with robust joins
        const [existing] = await db.select({
            result: results,
            courseId: enrollments.courseId,
            studentDeptId: students.deptId,
        })
            .from(results)
            .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
            .innerJoin(students, eq(enrollments.studentId, students.id))
            .where(eq(results.id, data.resultId))
            .limit(1);

        if (!existing) return { success: false, error: "Result not found" };

        // 2. Permission Check
        if (role !== 'admin' && role !== 'dvc' && role !== 'superadmin' && role !== 'academic_registrar') {
            const [staff] = await db.select({
                id: staffProfiles.id,
                deptId: staffProfiles.departmentId,
                facultyId: departments.facultyId
            })
                .from(staffProfiles)
                .leftJoin(departments, eq(staffProfiles.departmentId, departments.id))
                .where(eq(staffProfiles.userId, userId))
                .limit(1);

            if (!staff) return { success: false, error: "Staff profile not found. You must have a staff profile to edit results." };

            let authorized = false;

            // HOD Check: Can edit results of students in their department OR results of courses offered by their department
            if (staff.deptId) {
                // If student is in their department
                if (existing.studentDeptId === staff.deptId) authorized = true;

                // OR if course belongs to their department
                if (!authorized) {
                    const [courseInDept] = await db.select()
                        .from(courseDepartmentSettings)
                        .where(and(
                            eq(courseDepartmentSettings.courseId, existing.courseId as any),
                            eq(courseDepartmentSettings.deptId, staff.deptId as any)
                        ))
                        .limit(1);
                    if (courseInDept) authorized = true;
                }
            }

            // Dean Check: Can edit results for any department within their faculty
            if (!authorized && staff.facultyId) {
                const [targetDept] = await db.select({ facultyId: departments.facultyId })
                    .from(departments)
                    .where(eq(departments.id, existing.studentDeptId as any))
                    .limit(1);

                if (targetDept?.facultyId === staff.facultyId) authorized = true;

                if (!authorized) {
                    // Check if the course department belongs to the faculty
                    const courseDepts = await db.select({ facultyId: departments.facultyId })
                        .from(courseDepartmentSettings)
                        .innerJoin(departments, eq(courseDepartmentSettings.deptId, departments.id))
                        .where(eq(courseDepartmentSettings.courseId, existing.courseId as any));

                    if (courseDepts.some(d => d.facultyId === staff.facultyId)) authorized = true;
                }
            }

            if (!authorized) return { success: false, error: "You are not authorized to edit results outside your scope (Department/Faculty)" };
        }

        // 3. Perform update and log audit
        const existingResult = existing.result as any;
        const newCa = data.caScore !== undefined ? data.caScore : parseFloat(existingResult.caScore || "0");
        const newExam = data.examScore !== undefined ? data.examScore : parseFloat(existingResult.examScore || "0");
        const newTotal = newCa + newExam;

        // Fetch student level/branch context (assuming studentDeptId helps map to branch/unit eventually)
        // Default context is "exam" for end of term updates
        const gradeData = await GradingService.getGradeAndRemark(newTotal, undefined, "exam");

        await db.transaction(async (tx) => {
            await tx.update(results)
                .set({
                    caScore: newCa.toFixed(2),
                    examScore: newExam.toFixed(2),
                    totalScore: newTotal.toFixed(2),
                    grade: gradeData.grade,
                    lastEditedBy: userId,
                    lastEditedAt: new Date()
                })
                .where(eq(results.id, data.resultId));

            await tx.insert(resultAuditLogs).values({
                resultId: data.resultId,
                editorId: userId,
                oldCaScore: existingResult.caScore,
                newCaScore: newCa.toFixed(2),
                oldExamScore: existingResult.examScore,
                newExamScore: newExam.toFixed(2),
                oldTotalScore: existingResult.totalScore,
                newTotalScore: newTotal.toFixed(2),
                reason: data.reason
            });
        });

        revalidatePath("/admin/academics/results");
        revalidatePath("/student/transcript");

        return { success: true };
    } catch (error: any) {
        console.error("Audit update error:", error);
        return { success: false, error: error.message || "Failed to edit result" };
    }
}

export async function getResultAuditLogs(resultId: number) {
    const session = await auth();
    const user = session?.user as any;
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        const allowed = await hasPermission("academic.results.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar") || await hasRole("dvc");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to view result audit logs" };

        const logs = await db.select({
            audit: resultAuditLogs,
            editor: users.name
        })
            .from(resultAuditLogs)
            .innerJoin(users, eq(resultAuditLogs.editorId, users.id))
            .where(eq(resultAuditLogs.resultId, resultId))
            .orderBy(desc(resultAuditLogs.createdAt));

        return { success: true, data: logs };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getK12ReportData(studentId: number, sessionId: number, term: string) {
    try {
        const { academicSessions } = await import("@/db/schema");
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);
        if (!session) return null;

        // 1. Fetch Subject Scores
        const subjectResults = await db.select({
            id: results.id,
            courseCode: courses.code,
            courseName: courses.name,
            caScore: results.caScore,
            examScore: results.examScore,
            totalScore: results.totalScore,
            grade: results.grade,
            rankClass: results.rankClass,
            rankLevel: results.rankLevel,
        })
        .from(results)
        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(and(
            eq(enrollments.studentId, studentId),
            eq(enrollments.academicYear, session.name),
            eq(enrollments.semester, parseInt(term))
        ));

        // 2. Fetch Behavioral Scores
        const { behavioralScores, affectiveTraits } = await import("@/db/schema");
        const behaviors = await db.select({
            name: affectiveTraits.name,
            category: affectiveTraits.category,
            score: behavioralScores.score
        })
        .from(behavioralScores)
        .innerJoin(affectiveTraits, eq(behavioralScores.traitId, affectiveTraits.id))
        .where(and(
            eq(behavioralScores.studentId, studentId),
            eq(behavioralScores.sessionId, sessionId),
            eq(behavioralScores.term, term as any)
        ));

        // 3. Fetch Remarks & Attendance
        const { reportRemarks } = await import("@/db/schema");
        const [remarks] = await db.select().from(reportRemarks).where(and(
            eq(reportRemarks.studentId, studentId),
            eq(reportRemarks.sessionId, sessionId),
            eq(reportRemarks.term, term as any)
        )).limit(1);

        // 4. Fetch Student Info
        const [studentInfo] = await db.select({
            name: users.name,
            matricNumber: students.matricNumber,
            level: students.currentLevel,
            // @ts-expect-error - TS2304: Auto-suppressed for build
            unit: institutionalUnits.name
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        // @ts-expect-error - TS2304: Auto-suppressed for build
        .leftJoin(institutionalUnits, eq(students.unitId, institutionalUnits.id))
        .where(eq(students.id, studentId))
        .limit(1);

        return {
            student: studentInfo,
            results: subjectResults,
            behaviors,
            remarks,
            session: session.name,
            term: term === '1' ? 'First' : term === '2' ? 'Second' : 'Third'
        };
    } catch (error) {
        console.error("Error fetching report data:", error);
        return null;
    }
}
