import { db } from "@/db/db";
import {
    results,
    enrollments,
    courses,
    students,
    users,
    programmes,
    departments,
    faculties,
    academicSessions,
    semesterSummaries,
    gradingSystems,
    gradePoints,
    courseDepartmentSettings,
    institutionalUnits
} from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { GradingService } from "./GradingService";

export interface TranscriptData {
    student: {
        name: string;
        matricNumber: string;
        dob: string | null;
        gender: string | null;
        nationality: string | null;
        admissionYear: number | null;
        modeOfEntry: string | null;
        programme: string;
        department: string;
        faculty: string;
        institution: string;
        graduatedAt: Date | null;
        classOfDegree: string | null;
    };
    results: {
        sessionId: number;
        sessionName: string;
        semester: number;
        courses: {
            code: string;
            title: string;
            units: number;
            status: string; // C/R/E
            score: number;
            grade: string;
            gp: number;
            wgp: number;
            remarks: string;
            resultId?: number;
            caScore?: string;
            examScore?: string;
        }[];
        semesterSummary?: {
            tcr: number;
            tce: number;
            twgp: number;
            gpa: number;
            cgpa: number;
        };
    }[];
    totals: {
        tcr: number;
        tce: number;
        twgp: number;
        cgpa: number;
    };
}

export class TranscriptService {
    static async getStudentTranscript(studentId: number, options: { sessionId?: number, semester?: number } = {}) {
        try {
            // 1. Fetch Student Metadata
            const studentInfo = await db.select({
                student: students,
                user: users,
                prog: programmes,
                dept: departments,
                fac: faculties,
                unit: institutionalUnits
            })
                .from(students)
                .innerJoin(users, eq(students.userId, users.id))
                .leftJoin(programmes, eq(students.programmeId, programmes.id))
                .leftJoin(departments, eq(students.deptId, departments.id))
                .leftJoin(faculties, eq(departments.facultyId, faculties.id))
                .leftJoin(institutionalUnits, eq(students.unitId, institutionalUnits.id))
                .where(eq(students.id, studentId))
                .limit(1);

            if (studentInfo.length === 0) throw new Error("Student not found");
            const s = studentInfo[0];

            // 2. Fetch Enrollments & Results
            const conditions = [eq(enrollments.studentId, studentId)];
            if (options.sessionId) {
                conditions.push(eq(academicSessions.id, options.sessionId));
            }
            if (options.semester) {
                conditions.push(eq(enrollments.semester, options.semester));
            }

            const query = db.select({
                enrollment: enrollments,
                result: results,
                course: courses,
                session: academicSessions,
                deptSetting: courseDepartmentSettings
            })
                .from(enrollments)
                .innerJoin(students, eq(enrollments.studentId, students.id))
                .innerJoin(courses, eq(enrollments.courseId, courses.id))
                .innerJoin(academicSessions, eq(enrollments.academicYear, academicSessions.name))
                .leftJoin(results, eq(enrollments.id, results.enrollmentId))
                .leftJoin(courseDepartmentSettings, and(
                    eq(courses.id, courseDepartmentSettings.courseId),
                    eq(students.deptId, courseDepartmentSettings.deptId),
                    sql`${enrollments.semester} = ${courseDepartmentSettings.semester}`
                ))
                .where(and(...conditions))
                .orderBy(desc(academicSessions.name), desc(enrollments.semester));

            const rawResults = await query;

            // 3. Fetch Semester Summaries
            const summaries = await db.select()
                .from(semesterSummaries)
                .where(eq(semesterSummaries.studentId, studentId));

            // 4. Transform into grouped format
            const sessionsMap = new Map<string, TranscriptData['results'][0]>();

            rawResults.forEach(r => {
                const key = `${r.session.id}-${r.enrollment.semester}`;
                if (!sessionsMap.has(key)) {
                    const summary = summaries.find(sum =>
                        sum.sessionId === r.session.id &&
                        sum.semester === r.enrollment.semester.toString()
                    );

                    sessionsMap.set(key, {
                        sessionId: r.session.id,
                        sessionName: r.session.name,
                        semester: r.enrollment.semester,
                        courses: [],
                        semesterSummary: summary ? {
                            tcr: summary.tcr || 0,
                            tce: summary.tce || 0,
                            twgp: parseFloat(summary.twgp?.toString() || '0'),
                            gpa: parseFloat(summary.gpa?.toString() || '0'),
                            cgpa: parseFloat(summary.cgpa?.toString() || '0')
                        } : undefined
                    });
                }

                const group = sessionsMap.get(key)!;
                const score = parseFloat(r.result?.totalScore?.toString() || '0');
                const units = r.course.creditUnits;
                const gp = parseFloat(r.result?.gradePoint?.toString() || '0');

                group.courses.push({
                    code: r.course.code,
                    title: r.course.name,
                    units: units,
                    status: r.deptSetting?.status === 'compulsory' ? 'C' : r.deptSetting?.status === 'required' ? 'R' : 'E',
                    score: score,
                    grade: r.result?.grade || 'F',
                    gp: gp,
                    wgp: units * gp,
                    remarks: r.result?.grade === 'F' ? 'Failed' : 'Passed',
                    resultId: r.result?.id,
                    caScore: r.result?.caScore || "0.00",
                    examScore: r.result?.examScore || "0.00"
                });
            });

            const transcriptResults = Array.from(sessionsMap.values());

            // 5. Calculate Grand Totals
            let totalTCR = 0;
            let totalTCE = 0;
            let totalTWGP = 0;

            summaries.forEach(sum => {
                totalTCR += sum.tcr || 0;
                totalTCE += sum.tce || 0;
                totalTWGP += parseFloat(sum.twgp?.toString() || '0');
            });

            const finalCGPA = totalTCR > 0 ? totalTWGP / totalTCR : 0;

            return {
                student: {
                    name: s.user.name,
                    matricNumber: s.student.matricNumber || "N/A",
                    dob: s.student.dob,
                    gender: s.student.gender,
                    nationality: (s.student as any).nationality,
                    admissionYear: s.student.admissionYear,
                    modeOfEntry: (s.student as any).modeOfEntry,
                    programme: s.prog?.name || "N/A",
                    department: s.dept?.name || "N/A",
                    faculty: s.fac?.name || "N/A",
                    institution: s.unit?.name || "University Registry",
                    graduatedAt: (s.student as any).graduatedAt,
                    classOfDegree: (s.student as any).classOfDegree
                },
                results: transcriptResults,
                totals: {
                    tcr: totalTCR,
                    tce: totalTCE,
                    twgp: totalTWGP,
                    cgpa: parseFloat(finalCGPA.toFixed(2))
                }
            };

        } catch (error) {
            console.error("Transcript generation error:", error);
            throw error;
        }
    }

    static async getDepartmentalTranscripts(deptId: number, sessionId?: number) {
        // Implementation for HOD to query results
        // This would return a list of students with their summaries
        const studentsInDept = await db.select({
            id: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            level: students.currentLevel
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.deptId, deptId));

        return studentsInDept;
    }
}
