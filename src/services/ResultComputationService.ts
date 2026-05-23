import { db } from "@/db/db";
import { 
    resultMarks, 
    semesterSummaries, 
    courses, 
    students, 
    gradePoints, 
    gradingSystems,
    gradingSystemSessions 
} from "@/db/schema";
import { eq, and, sql, desc, sum } from "drizzle-orm";

export class ResultComputationService {

    /**
     * Maps a numeric score to a Letter Grade and Grade Point based on the institutional scale.
     */
    static async getGradeForScore(gradingSystemId: number, score: number) {
        const grade = await db.select()
            .from(gradePoints)
            .where(and(
                eq(gradePoints.gradingSystemId, gradingSystemId),
                sql`${score} >= ${gradePoints.minMark}`,
                sql`${score} <= ${gradePoints.maxMark}`
            ))
            .limit(1);
        
        return grade[0] || null;
    }

    /**
     * Computes the GPA for a specific student, session, and semester.
     */
    static async computeSemesterGPA(studentId: number, sessionId: number, semester: '1' | '2') {
        // 1. Identify the active grading system for this session
        const config = await db.select()
            .from(gradingSystemSessions)
            .where(eq(gradingSystemSessions.sessionId, sessionId))
            .limit(1);
        
        if (!config[0]) throw new Error("No grading system configured for this session.");
        const gradingSystemId = config[0].gradingSystemId;

        // 2. Fetch all marks for this semester
        const marks = await db.select({
            id: resultMarks.id,
            totalScore: resultMarks.totalScore,
            units: courses.creditUnits
        })
        .from(resultMarks)
        .innerJoin(courses, eq(resultMarks.courseId, courses.id))
        .where(and(
            eq(resultMarks.studentId, studentId),
            eq(resultMarks.sessionId, sessionId),
            eq(resultMarks.semester, semester)
        ));

        let totalTCR = 0;
        let totalTCE = 0;
        let totalTWGP = 0;

        for (const m of marks) {
            const score = parseFloat(m.totalScore || "0");
            const units = m.units || 0;
            const grade = await this.getGradeForScore(gradingSystemId, score);

            if (grade) {
                const points = parseFloat(grade.points);
                const wgp = points * units;

                totalTCR += units;
                if (grade.letterGrade !== 'F') {
                    totalTCE += units;
                }
                totalTWGP += wgp;

                // Update individual mark entry with grade/points
                await db.update(resultMarks)
                    .set({ 
                        grade: grade.letterGrade, 
                        gradePoint: grade.points 
                    })
                    .where(eq(resultMarks.id, m.id));
            }
        }

        const gpa = totalTCR > 0 ? totalTWGP / totalTCR : 0;

        // 3. Update Semester Summary
        await db.insert(semesterSummaries).values({
            studentId,
            sessionId,
            semester,
            tcr: totalTCR,
            tce: totalTCE,
            twgp: totalTWGP.toFixed(2),
            gpa: gpa.toFixed(2)
        }).onDuplicateKeyUpdate({
            set: {
                tcr: totalTCR,
                tce: totalTCE,
                twgp: totalTWGP.toFixed(2),
                gpa: gpa.toFixed(2)
            }
        });

        // 4. Trigger CGPA Recomputation
        await this.computeCGPA(studentId);

        return { gpa, tcr: totalTCR, tce: totalTCE };
    }

    /**
     * Computes the Cumulative GPA (CGPA) across all finalized semesters.
     */
    static async computeCGPA(studentId: number) {
        const summaries = await db.select({
            tcr: semesterSummaries.tcr,
            twgp: semesterSummaries.twgp
        })
        .from(semesterSummaries)
        .where(eq(semesterSummaries.studentId, studentId));

        let cumulativeTCR = 0;
        let cumulativeTWGP = 0;

        for (const s of summaries) {
            cumulativeTCR += s.tcr || 0;
            cumulativeTWGP += parseFloat(s.twgp || "0");
        }

        const cgpa = cumulativeTCR > 0 ? cumulativeTWGP / cumulativeTCR : 0;

        // Update all summaries with the new CGPA (or the latest one)
        await db.update(semesterSummaries)
            .set({ cgpa: cgpa.toFixed(2) })
            .where(eq(semesterSummaries.studentId, studentId));

        return cgpa;
    }
}
