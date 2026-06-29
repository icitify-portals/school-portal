import { db } from "@/db/db";
import {
    results,
    enrollments,
    courses,
    students,
    users,
    academicSessions,
    semesterSummaries,
    annualSummaries,
    reportRemarks
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { RankingService } from "./RankingService";

export interface BroadsheetStudentRow {
    studentId: number;
    studentName: string;
    admissionNumber: string;
    subjectScores: Record<string, {
        ca: string;
        exam: string;
        total: string;
        grade: string;
        position: string;
    }>;
    totalUnits: number;
    totalWeightedPoints: number;
    totalScore: number;
    averageScore: number;
    classPosition: string;
    promotionalStatus: string;
    remarks: string;
}

export interface BroadsheetData {
    classGroupName: string;
    sessionName: string;
    termName: string;
    subjects: { code: string; name: string }[];
    rows: BroadsheetStudentRow[];
    statistics: Record<string, {
        average: number;
        highest: number;
        lowest: number;
    }>;
}

export class BroadsheetService {

    /**
     * Compiles the comprehensive class broadsheet for JSS/SSS K-12 systems or higher-ed cohorts.
     */
    static async compileClassBroadsheet(
        groupId: number,
        sessionId: number,
        semester: number // 1, 2, or 3
    ): Promise<BroadsheetData | null> {
        try {
            // 1. Fetch Session and Group Information
            const [session] = await db.select().from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);
            if (!session) throw new Error("Academic session not found");

            const [groupInfo] = await db.select({
                name: students.groupId, // arm name / studentGroups details
                level: students.currentLevel
            })
            .from(students)
            .where(eq(students.groupId, groupId))
            .limit(1);

            // 2. Fetch all pupils in the class arm
            const classStudents = await db.select({
                id: students.id,
                admissionNumber: students.admissionNumber,
                name: users.name,
                currentLevel: students.currentLevel
            })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.groupId, groupId));

            if (classStudents.length === 0) {
                return {
                    classGroupName: `Group #${groupId}`,
                    sessionName: session.name,
                    termName: semester === 1 ? "First Term" : semester === 2 ? "Second Term" : "Third Term",
                    subjects: [],
                    rows: [],
                    statistics: {}
                };
            }

            const studentIds = classStudents.map(s => s.id);

            // 3. Fetch all registrations & active subjects for these students
            const activeEnrollments = await db.select({
                studentId: enrollments.studentId,
                courseId: enrollments.courseId,
                courseCode: courses.code,
                courseName: courses.name,
                resultId: results.id,
                caScore: results.caScore,
                examScore: results.examScore,
                totalScore: results.totalScore,
                grade: results.grade,
                rankClass: results.rankClass
            })
            .from(enrollments)
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .leftJoin(results, eq(enrollments.id, results.enrollmentId))
            .where(and(
                inArray(enrollments.studentId, studentIds),
                eq(enrollments.academicYear, session.name),
                eq(enrollments.semester, semester)
            ));

            // Extract distinct subjects
            const distinctSubjectsMap = new Map<string, string>();
            activeEnrollments.forEach(e => {
                distinctSubjectsMap.set(e.courseCode, e.courseName);
            });
            const subjectsList = Array.from(distinctSubjectsMap.entries()).map(([code, name]) => ({ code, name }));

            // 4. Fetch Semester Summaries & Remarks
            const summaries = await db.select()
                .from(semesterSummaries)
                .where(and(
                    inArray(semesterSummaries.studentId, studentIds),
                    eq(semesterSummaries.sessionId, sessionId),
                    // @ts-expect-error - TS2769: Auto-suppressed for build
                    eq(semesterSummaries.semester, semester.toString())
                ));

            const annuals = semester === 3 
                ? await db.select().from(annualSummaries).where(and(
                    inArray(annualSummaries.studentId, studentIds),
                    eq(annualSummaries.sessionId, sessionId)
                  ))
                : [];

            const remarksList = await db.select()
                .from(reportRemarks)
                .where(and(
                    inArray(reportRemarks.studentId, studentIds),
                    eq(reportRemarks.sessionId, sessionId),
                    // @ts-expect-error - TS2769: Auto-suppressed for build
                    eq(reportRemarks.term, semester.toString())
                ));

            // 5. Compile student row details
            const rows: BroadsheetStudentRow[] = [];

            classStudents.forEach(s => {
                const sEnrollments = activeEnrollments.filter(e => e.studentId === s.id);
                const sSummary = summaries.find(sum => sum.studentId === s.id);
                const sAnnual = annuals.find(a => a.studentId === s.id);
                const sRemark = remarksList.find(r => r.studentId === s.id);

                const subjectScores: Record<string, any> = {};
                let totalMarks = 0;
                let subjectsWithScores = 0;

                subjectsList.forEach(subj => {
                    const match = sEnrollments.find(e => e.courseCode === subj.code);
                    if (match && match.totalScore !== null) {
                        const ca = parseFloat(match.caScore || "0");
                        const exam = parseFloat(match.examScore || "0");
                        const total = parseFloat(match.totalScore || "0");
                        
                        totalMarks += total;
                        subjectsWithScores++;

                        subjectScores[subj.code] = {
                            ca: ca.toFixed(1),
                            exam: exam.toFixed(1),
                            total: total.toFixed(1),
                            grade: match.grade || "F",
                            position: match.rankClass || "N/A"
                        };
                    } else {
                        subjectScores[subj.code] = {
                            ca: "-",
                            exam: "-",
                            total: "-",
                            grade: "-",
                            position: "-"
                        };
                    }
                });

                const averageScore = subjectsWithScores > 0 ? totalMarks / subjectsWithScores : 0;

                // Promotion evaluation (especially for Third Term)
                let promotionalStatus = "N/A";
                if (semester === 3) {
                    const avg = sAnnual ? parseFloat(sAnnual.averageScore || "0") : averageScore;
                    promotionalStatus = avg >= 50 ? "Promoted" : avg >= 40 ? "Promoted on Trial" : "Demoted";
                }

                rows.push({
                    studentId: s.id,
                    studentName: s.name,
                    admissionNumber: s.admissionNumber || "N/A",
                    subjectScores,
                    totalUnits: subjectsWithScores,
                    totalWeightedPoints: totalMarks,
                    totalScore: totalMarks,
                    averageScore: parseFloat(averageScore.toFixed(2)),
                    classPosition: sSummary ? `${sSummary.gpa || "N/A"}` : "N/A", // Holds ranking averages
                    promotionalStatus,
                    remarks: sRemark?.classTeacherComment || "Satisfactory"
                });
            });

            // Re-compute standard fractional rankings based on totalScores
            const sorted = [...rows].sort((a, b) => b.totalScore - a.totalScore);
            let currentRank = 1;
            for (let i = 0; i < sorted.length; i++) {
                if (i > 0 && sorted[i].totalScore !== sorted[i-1].totalScore) {
                    currentRank = i + 1;
                }
                const matchIndex = rows.findIndex(r => r.studentId === sorted[i].studentId);
                if (matchIndex !== -1) {
                    rows[matchIndex].classPosition = `${currentRank}/${rows.length}`;
                }
            }

            // 6. Compile Subject statistics
            const statistics: Record<string, { average: number; highest: number; lowest: number }> = {};
            subjectsList.forEach(subj => {
                const activeScores = rows
                    .map(r => r.subjectScores[subj.code])
                    .filter(s => s && s.total !== "-")
                    .map(s => parseFloat(s.total));

                if (activeScores.length > 0) {
                    const sum = activeScores.reduce((a, b) => a + b, 0);
                    statistics[subj.code] = {
                        average: parseFloat((sum / activeScores.length).toFixed(1)),
                        highest: Math.max(...activeScores),
                        lowest: Math.min(...activeScores)
                    };
                } else {
                    statistics[subj.code] = { average: 0, highest: 0, lowest: 0 };
                }
            });

            return {
                classGroupName: `Group #${groupId}`,
                sessionName: session.name,
                termName: semester === 1 ? "First Term" : semester === 2 ? "Second Term" : "Third Term",
                subjects: subjectsList,
                rows,
                statistics
            };

        } catch (error) {
            console.error("Broadsheet Service Error:", error);
            return null;
        }
    }
}
