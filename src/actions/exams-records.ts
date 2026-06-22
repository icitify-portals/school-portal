"use server";

import { db } from "@/db/db";
import {
    students, users, programmes, departments,
    enrollments, results, academicSessions, semesterSummaries, courses,
    institutionalUnits, studentGroups, annualSummaries,
    affectiveTraits, behavioralScores, reportRemarks, studentVitals,
    systemAuditLogs, componentResults, courseComponents, quranMemorizationLogs,
    reportCardRubrics
} from "@/db/schema";
import { eq, and, sql, desc, or, inArray } from "drizzle-orm";
import { auth } from "@/auth";

/**
 * Fetches students who are likely in their final year or have graduated.
 * Logic: Current level matches or exceeds programme duration (assuming 100 level/year).
 */
export async function getGraduatingStudents(filters?: {
    programmeId?: number;
    deptId?: number;
    status?: string;
    search?: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const conditions = [
            or(
                eq(users.status, 'graduated'),
                // Simple heuristic for final year: level >= (duration/12 * 100)
                // e.g. 48 months / 12 = 4 years -> level 400
                sql`${students.currentLevel} >= (${programmes.durationMonths} / 12) * 100`
            )
        ];

        if (filters?.programmeId) {
            conditions.push(eq(students.programmeId, filters.programmeId));
        }
        if (filters?.deptId) {
            conditions.push(eq(students.deptId, filters.deptId));
        }
        if (filters?.status) {
            conditions.push(eq(users.status, filters.status as any));
        }
        if (filters?.search) {
            conditions.push(or(
                sql`${users.name} LIKE ${`%${filters.search}%`}`,
                sql`${students.matricNumber} LIKE ${`%${filters.search}%`}`
            ));
        }

        const data = await db.select({
            id: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            status: users.status,
            programme: programmes.name,
            programmeDuration: programmes.durationMonths,
            department: departments.name
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(programmes, eq(students.programmeId, programmes.id))
            .innerJoin(departments, eq(students.deptId, departments.id))
            .where(and(...conditions));

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching graduating students:", error);
        return { success: false, error: "Failed to fetch student records" };
    }
}

/**
 * Fetches detailed academic history for a student.
 */
export async function getStudentAcademicRecord(studentId: number) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        // 1. Student Info with Unit Tier and Class Arm
        const [student] = await db.select({
            id: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            programme: programmes.name,
            department: departments.name,
            admissionYear: students.admissionYear,
            status: users.status,
            classOfDegree: students.classOfDegree,
            currentLevel: students.currentLevel,
            academicTier: institutionalUnits.academicTier,
            groupName: studentGroups.name
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(institutionalUnits, eq(students.unitId, institutionalUnits.id))
            .leftJoin(studentGroups, eq(students.groupId, studentGroups.id))
            .where(eq(students.id, studentId))
            .limit(1);

        if (!student) return { success: false, error: "Student not found" };

        // 2. Semester Summaries
        const summaries = await db.select()
            .from(semesterSummaries)
            .where(eq(semesterSummaries.studentId, studentId))
            .orderBy(semesterSummaries.sessionId, semesterSummaries.semester);

        // 3. Course Results (with Rank and Detailed Scores)
        const allResults = await db.select({
            resultId: results.id,
            courseId: courses.id,
            code: courses.code,
            title: courses.name,
            units: courses.creditUnits,
            totalScore: results.totalScore,
            caScore: results.caScore,
            examScore: results.examScore,
            grade: results.grade,
            gp: results.gradePoint,
            rankClass: results.rankClass,
            rankLevel: results.rankLevel,
            sessionId: enrollments.sessionId,
            semester: enrollments.semester,
            sessionName: academicSessions.name
        })
            .from(results)
            .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .innerJoin(academicSessions, eq(enrollments.sessionId, academicSessions.id))
            .where(eq(enrollments.studentId, studentId))
            .orderBy(enrollments.sessionId, enrollments.semester);

        // Fetch component results for all result ids
        const resultIds = allResults.map(r => r.resultId).filter(Boolean) as number[];
        let componentScores: any[] = [];
        if (resultIds.length > 0) {
            componentScores = await db.select({
                resultId: componentResults.resultId,
                score: componentResults.score,
                componentName: courseComponents.name
            })
            .from(componentResults)
            .innerJoin(courseComponents, eq(componentResults.componentId, courseComponents.id))
            .where(inArray(componentResults.resultId, resultIds));
        }

        // Fetch quran logs
        const quranLogs = await db.select()
            .from(quranMemorizationLogs)
            .where(eq(quranMemorizationLogs.studentId, studentId));

        // Fetch cohort stats for student's level or group
        const courseIds = Array.from(new Set(allResults.map(r => r.courseId).filter(Boolean))) as number[];
        let cohortStats: any[] = [];
        if (courseIds.length > 0) {
            cohortStats = await db.select({
                courseId: enrollments.courseId,
                sessionId: enrollments.sessionId,
                semester: enrollments.semester,
                maxScore: sql<number>`max(${results.totalScore})`,
                minScore: sql<number>`min(${results.totalScore})`,
                avgScore: sql<number>`avg(${results.totalScore})`,
                count: sql<number>`count(${results.id})`
            })
            .from(results)
            .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
            .where(inArray(enrollments.courseId, courseIds))
            .groupBy(enrollments.courseId, enrollments.sessionId, enrollments.semester);
        }

        // Class sizes
        const [levelCountRes] = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .where(eq(students.currentLevel, student.currentLevel as number));
        const studentsInClassCount = levelCountRes?.count || 0;

        const [groupCountRes] = student.groupName ? await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .innerJoin(studentGroups, eq(students.groupId, studentGroups.id))
            .where(eq(studentGroups.name, student.groupName as string)) : [{ count: 0 }];
        const studentsInClassDivisionCount = groupCountRes?.count || 0;

        // Map results with components & cohort stats
        const mappedResults = allResults.map(r => {
            const resultComponents = componentScores.filter(cs => cs.resultId === r.resultId);
            const test1Comp = resultComponents.find(c => /1st|first|test\s*1/i.test(c.componentName)) || resultComponents[0];
            const test2Comp = resultComponents.find(c => /2nd|second|test\s*2/i.test(c.componentName)) || (resultComponents.length > 1 ? resultComponents[1] : null);

            const test1Val = test1Comp ? parseFloat(test1Comp.score?.toString() || '0') : parseFloat(r.caScore?.toString() || '0');
            const test2Val = test2Comp ? parseFloat(test2Comp.score?.toString() || '0') : 0;

            const stats = cohortStats.find(cs => cs.courseId === r.courseId && cs.sessionId === r.sessionId && cs.semester === r.semester);

            return {
                ...r,
                caScore: parseFloat(r.caScore?.toString() || '0'),
                examScore: parseFloat(r.examScore?.toString() || '0'),
                totalScore: parseFloat(r.totalScore?.toString() || '0'),
                test1: test1Val,
                test2: test2Val,
                highestScore: stats ? parseFloat(stats.maxScore?.toString() || '0') : parseFloat(r.totalScore?.toString() || '0'),
                lowestScore: stats ? parseFloat(stats.minScore?.toString() || '0') : parseFloat(r.totalScore?.toString() || '0'),
                classAverage: stats ? parseFloat(stats.avgScore?.toString() || '0') : parseFloat(r.totalScore?.toString() || '0'),
                subjectStudentsCount: stats ? stats.count : 1
            };
        });

        // 4. Annual Summaries
        const annuals = await db.select()
            .from(annualSummaries)
            .where(eq(annualSummaries.studentId, studentId))
            .orderBy(desc(annualSummaries.sessionId));

        return {
            success: true,
            data: {
                student,
                summaries,
                results: mappedResults,
                annualSummaries: annuals,
                quranLogs,
                studentsInClassCount,
                studentsInClassDivisionCount
            }
        };
    } catch (error) {
        console.error("Error fetching academic record:", error);
        return { success: false, error: "Failed to fetch record" };
    }
}
/**
 * Searches all students in the database.
 */
export async function searchAllStudents(filters: { search?: string; programmeId?: number; deptId?: number }) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        let query = db.select({
            id: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            status: users.status,
            programme: programmes.name,
            department: departments.name
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id));

        const conditions = [];
        if (filters.search) {
            conditions.push(or(
                sql`${users.name} LIKE ${`%${filters.search}%`}`,
                sql`${students.matricNumber} LIKE ${`%${filters.search}%`}`
            ));
        }
        if (filters.programmeId) {
            conditions.push(eq(students.programmeId, filters.programmeId));
        }
        if (filters.deptId) {
            conditions.push(eq(students.deptId, filters.deptId));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        const data = await query.limit(50);
        return { success: true, data };
    } catch (error) {
        console.error("Error searching students:", error);
        return { success: false, error: "Search failed" };
    }
}

/**
 * Fetches computed results for a specific level (class) and arm (group) within an academic session/term.
 * Also supports direct lookup by student admission number.
 */
export async function getGeneratedResultsForClass(filters: {
    sessionId: number;
    semester: number;
    level: number;
    groupId?: number;
    deptId?: number;
    admissionNumber?: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const conditions = [
            eq(semesterSummaries.sessionId, filters.sessionId),
            eq(semesterSummaries.semester, filters.semester.toString() as any)
        ];

        if (filters.admissionNumber) {
            conditions.push(or(
                eq(students.admissionNumber, filters.admissionNumber),
                eq(students.matricNumber, filters.admissionNumber)
            ) as any);
        } else {
            conditions.push(eq(students.currentLevel, filters.level));
            if (filters.groupId) {
                conditions.push(eq(students.groupId, filters.groupId));
            }
            if (filters.deptId) {
                conditions.push(eq(students.deptId, filters.deptId));
            }
        }

        const data = await db.select({
            studentId: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            groupName: studentGroups.name,
            departmentName: departments.name,
            tcr: semesterSummaries.tcr,
            tce: semesterSummaries.tce,
            gpa: semesterSummaries.gpa,
            cgpa: semesterSummaries.cgpa,
            teacherComment: semesterSummaries.teacherComment,
            principalComment: semesterSummaries.principalComment,
            approvalStatus: semesterSummaries.approvalStatus
        })
            .from(semesterSummaries)
            .innerJoin(students, eq(semesterSummaries.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(studentGroups, eq(students.groupId, studentGroups.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .where(and(...conditions))
            .orderBy(desc(semesterSummaries.gpa));

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching class results:", error);
        return { success: false, error: "Failed to fetch class results" };
    }
}

/**
 * Fetches detailed K-12 report details for a single student including behavior, attendance, and physical vitals.
 */
export async function getK12StudentReportData(studentId: number, sessionId: number, term: number) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        // 1. Student metadata
        const [student] = await db.select({
            id: students.id,
            name: users.name,
            firstName: students.firstName,
            lastName: students.lastName,
            otherNames: students.otherNames,
            admissionNumber: students.admissionNumber,
            matricNumber: students.matricNumber,
            gender: students.gender,
            currentLevel: students.currentLevel,
            groupName: studentGroups.name,
            groupId: students.groupId,
            imageUrl: students.imageUrl,
            unitId: students.unitId
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(studentGroups, eq(students.groupId, studentGroups.id))
            .where(eq(students.id, studentId))
            .limit(1);

        if (!student) return { success: false, error: "Student not found" };

        // 2. Class results details (CA, Exam, Total)
        const allResults = await db.select({
            resultId: results.id,
            courseId: courses.id,
            code: courses.code,
            title: courses.name,
            units: courses.creditUnits,
            caScore: results.caScore,
            examScore: results.examScore,
            totalScore: results.totalScore,
            grade: results.grade,
            rankClass: results.rankClass,
            rankLevel: results.rankLevel,
            teacherRemark: results.teacherRemark
        })
            .from(results)
            .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .where(and(
                eq(enrollments.studentId, studentId),
                eq(enrollments.sessionId, sessionId),
                eq(enrollments.semester, term)
            ));

        // Fetch component results for all result ids
        const resultIds = allResults.map(r => r.resultId).filter(Boolean) as number[];
        let componentScores: any[] = [];
        if (resultIds.length > 0) {
            componentScores = await db.select({
                resultId: componentResults.resultId,
                score: componentResults.score,
                componentName: courseComponents.name
            })
            .from(componentResults)
            .innerJoin(courseComponents, eq(componentResults.componentId, courseComponents.id))
            .where(inArray(componentResults.resultId, resultIds));
        }

        // Fetch Quran memorization summary
        const quranLogs = await db.select()
            .from(quranMemorizationLogs)
            .where(and(
                eq(quranMemorizationLogs.studentId, studentId),
                eq(quranMemorizationLogs.sessionId, sessionId),
                eq(quranMemorizationLogs.term, term.toString() as any)
            ));

        let quranMemorization = null;
        if (quranLogs.length > 0) {
            const memorized = quranLogs.filter(l => l.status === 'memorized').map(l => l.surahName);
            const inProgress = quranLogs.filter(l => l.status === 'in_progress').map(l => l.surahName);
            
            let juzText = "";
            if (memorized.length > 0) juzText += `Memorized: ${memorized.join(', ')}`;
            if (inProgress.length > 0) {
                if (juzText) juzText += " | ";
                juzText += `In Progress: ${inProgress.join(', ')}`;
            }
            if (!juzText) juzText = "No active logs";

            const totalTajweed = quranLogs.reduce((sum, l) => sum + (l.tajweedRating || 0), 0);
            const totalFluency = quranLogs.reduce((sum, l) => sum + (l.fluencyRating || 0), 0);
            const avgRating = (totalTajweed + totalFluency) / (2 * quranLogs.length);
            
            let readingAbility = "Good";
            if (avgRating >= 4.5) readingAbility = "Excellent";
            else if (avgRating >= 3.5) readingAbility = "Very Good";
            else if (avgRating >= 2.5) readingAbility = "Good";
            else if (avgRating >= 1.5) readingAbility = "Fair";
            else if (avgRating > 0) readingAbility = "Needs Improvement";

            const remarksList = quranLogs.map(l => l.teacherRemark).filter(Boolean);
            const remarkText = remarksList.length > 0 ? remarksList.join("; ") : "Reciting well.";

            quranMemorization = {
                juzId: juzText,
                readingAbility,
                remark: remarkText
            };
        }

        // Fetch cohort statistics
        const cohortCondition = student.groupId 
            ? eq(students.groupId, student.groupId as number)
            : eq(students.currentLevel, student.currentLevel as number);

        const cohortStats = await db.select({
            courseId: enrollments.courseId,
            maxScore: sql<number>`max(${results.totalScore})`,
            minScore: sql<number>`min(${results.totalScore})`,
            avgScore: sql<number>`avg(${results.totalScore})`,
            count: sql<number>`count(${results.id})`
        })
        .from(results)
        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(and(
            eq(enrollments.sessionId, sessionId),
            eq(enrollments.semester, term),
            cohortCondition
        ))
        .groupBy(enrollments.courseId);

        // Class sizes
        const [levelCountRes] = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .where(eq(students.currentLevel, student.currentLevel as number));
        const studentsInClassCount = levelCountRes?.count || 0;

        const [groupCountRes] = student.groupName ? await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .innerJoin(studentGroups, eq(students.groupId, studentGroups.id))
            .where(eq(studentGroups.name, student.groupName as string)) : [{ count: 0 }];
        const studentsInClassDivisionCount = groupCountRes?.count || 0;

        // Map results with component details and cohort stats
        const mappedResults = allResults.map(r => {
            const resultComponents = componentScores.filter(cs => cs.resultId === r.resultId);
            const test1Comp = resultComponents.find(c => /1st|first|test\s*1/i.test(c.componentName)) || resultComponents[0];
            const test2Comp = resultComponents.find(c => /2nd|second|test\s*2/i.test(c.componentName)) || (resultComponents.length > 1 ? resultComponents[1] : null);

            const test1Val = test1Comp ? parseFloat(test1Comp.score?.toString() || '0') : parseFloat(r.caScore?.toString() || '0');
            const test2Val = test2Comp ? parseFloat(test2Comp.score?.toString() || '0') : 0;

            const stats = cohortStats.find(cs => cs.courseId === r.courseId);

            return {
                code: r.code,
                title: r.title,
                units: r.units,
                caScore: parseFloat(r.caScore?.toString() || '0'),
                examScore: parseFloat(r.examScore?.toString() || '0'),
                totalScore: parseFloat(r.totalScore?.toString() || '0'),
                grade: r.grade || 'N/A',
                rankClass: r.rankClass || 'N/A',
                rankLevel: r.rankLevel || 'N/A',
                teacherRemark: r.teacherRemark || '',
                // Component scores
                test1: test1Val,
                test2: test2Val,
                // Cohort stats
                highestScore: stats ? parseFloat(stats.maxScore?.toString() || '0') : parseFloat(r.totalScore?.toString() || '0'),
                lowestScore: stats ? parseFloat(stats.minScore?.toString() || '0') : parseFloat(r.totalScore?.toString() || '0'),
                classAverage: stats ? parseFloat(stats.avgScore?.toString() || '0') : parseFloat(r.totalScore?.toString() || '0'),
                subjectStudentsCount: stats ? stats.count : 1
            };
        });

        // 3. Behavioral and Psychomotor ratings
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
                eq(behavioralScores.term, term.toString() as any)
            ));

        // 4. Attendance and comments
        const [remarks] = await db.select()
            .from(reportRemarks)
            .where(and(
                eq(reportRemarks.studentId, studentId),
                eq(reportRemarks.sessionId, sessionId),
                eq(reportRemarks.term, term.toString() as any)
            ))
            .limit(1);

        // 5. Height/Weight physical characteristics from vitals
        const [vitals] = await db.select({
            height: studentVitals.height,
            weight: studentVitals.weight
        })
            .from(studentVitals)
            .where(eq(studentVitals.studentId, studentId))
            .orderBy(desc(studentVitals.recordedAt))
            .limit(1);

        return {
            success: true,
            data: {
                student,
                results: mappedResults,
                behaviors: behaviors.map(b => ({
                    name: b.name,
                    category: b.category,
                    score: b.score
                })),
                remarks: remarks ? {
                    classTeacherComment: remarks.classTeacherComment || "",
                    headTeacherComment: remarks.headTeacherComment || "",
                    daysOpen: remarks.daysOpen || 0,
                    daysPresent: remarks.daysPresent || 0,
                    daysAbsent: remarks.daysAbsent || 0,
                    nextTermStarts: remarks.nextTermStarts ? remarks.nextTermStarts.toString() : "",
                    nextTermEnds: remarks.nextTermEnds ? remarks.nextTermEnds.toString() : ""
                } : null,
                vitals: vitals ? {
                    height: parseFloat(vitals.height?.toString() || '0'),
                    weight: parseFloat(vitals.weight?.toString() || '0')
                } : null,
                studentsInClassCount,
                studentsInClassDivisionCount,
                quranMemorization
            }
        };
    } catch (error) {
        console.error("Error in getK12StudentReportData:", error);
        return { success: false, error: (error as Error).message };
    }
}


/**
 * Fetches metadata filters (academic sessions, classes/levels, and arms/groups) for result viewing.
 */
export async function getResultFilterMetadata() {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const sessions = await db.select().from(academicSessions).orderBy(desc(academicSessions.name));
        const groups = await db.select().from(studentGroups).orderBy(studentGroups.level, studentGroups.name);
        const depts = await db.select().from(departments).orderBy(departments.name);
        const rubrics = await db.select().from(reportCardRubrics).orderBy(reportCardRubrics.name);
        
        // Extract unique levels
        const levels = Array.from(new Set(groups.map(g => g.level))).sort((a, b) => (a as number) - (b as number));

        return {
            success: true,
            data: {
                sessions,
                groups,
                levels,
                departments: depts,
                rubrics
            }
        };
    } catch (error) {
        console.error("Failed to fetch result filter metadata:", error);
        return { success: false, error: "Failed to load filters" };
    }
}

/**
 * Locks (Vectorizes) or unlocks (Rasterizes) student results for a term.
 */
export async function toggleResultLockAction(data: {
    studentId: number;
    sessionId: number;
    semester: number;
    lock: boolean;
    reason?: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const targetStatus = data.lock ? 'published' : 'pending';

        // Update the semester summary status
        await db.update(semesterSummaries)
            .set({
                approvalStatus: targetStatus as any
            })
            .where(and(
                eq(semesterSummaries.studentId, data.studentId),
                eq(semesterSummaries.sessionId, data.sessionId),
                eq(semesterSummaries.semester, data.semester.toString() as any)
            ));

        // Insert audit log entry
        await db.insert(systemAuditLogs).values({
            actorId: parseInt(session.user.id || '0'),
            action: data.lock ? "RESULT_VECTORIZED" : "RESULT_RASTERIZED",
            targetId: data.studentId.toString(),
            details: JSON.stringify({
                sessionId: data.sessionId,
                semester: data.semester,
                reason: data.reason || (data.lock ? "Locking term results (Vectorized)" : "Unlocking term results (Rasterized)")
            }),
            status: "success"
        });

        return { success: true };
    } catch (error) {
        console.error("Error toggling result lock status:", error);
        return { success: false, error: (error as Error).message };
    }
}
