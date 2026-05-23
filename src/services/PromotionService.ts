import { db } from "@/db/db";
import { 
    students, annualSummaries, results, enrollments, courses, academicSessions
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class PromotionService {
    
    /**
     * Evaluates whether a single student is promoted.
     * Mirrors the Result::isPromoted() logic in the Rust system.
     */
    static async isPromoted(
        admissionNumber: string, 
        sessionName: string, 
        term: string, 
        branchId?: number
    ): Promise<boolean> {
        
        // 1. Find the student
        const [student] = await db.select().from(students)
            .where(eq(students.matricNumber, admissionNumber))
            .limit(1);

        if (!student) {
            console.error(`Student with admission number ${admissionNumber} not found.`);
            return false;
        }

        // 2. Find the session
        const [session] = await db.select().from(academicSessions)
            .where(eq(academicSessions.name, sessionName))
            .limit(1);

        if (!session) {
            console.error(`Session ${sessionName} not found.`);
            return false;
        }

        // 3. Determine Context: K-12 vs Tertiary
        // If the student belongs to a tertiary programme, we would use CGPA.
        if (student.programmeId) {
            return await this.evaluateTertiary(student.id, session.id);
        } else {
            return await this.evaluateK12(student.id, session.id, student.currentLevel || 100);
        }
    }

    /**
     * Evaluates K-12 Promotion Rules.
     * Junior Secondary & Primary (Level < 400): Overall Average >= 50%
     * Senior Secondary (Level >= 400): Overall Average >= 50% AND Pass Math & English
     */
    private static async evaluateK12(studentId: number, sessionId: number, level: number): Promise<boolean> {
        // Fetch Annual Summary
        const [summary] = await db.select().from(annualSummaries)
            .where(and(
                eq(annualSummaries.studentId, studentId),
                eq(annualSummaries.sessionId, sessionId)
            ))
            .limit(1);

        if (!summary) return false;

        const average = parseFloat(summary.averageScore?.toString() || "0");
        
        // Base Requirement A: Average >= 50
        if (average < 50) return false;

        // Base Requirement B: If Senior Secondary, must pass Math and English
        if (level >= 400) {
            const hasPassedCore = await this.hasPassedCoreSubjects(studentId, sessionId);
            if (!hasPassedCore) return false;
        }

        return true;
    }

    /**
     * Checks if a K-12 student passed Math and English (>= 50).
     */
    private static async hasPassedCoreSubjects(studentId: number, sessionId: number): Promise<boolean> {
        // Find results for this student in this session for Math and English
        const coreResults = await db.select({
            score: results.totalScore,
            subjectCode: courses.code
        })
        .from(results)
        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .innerJoin(academicSessions, eq(academicSessions.name, enrollments.academicYear))
        .where(and(
            eq(enrollments.studentId, studentId),
            eq(academicSessions.id, sessionId)
        ));

        // Group by subject code and average across terms to get annual subject average
        const subjectTotals: Record<string, { sum: number, count: number }> = {};
        for (const res of coreResults) {
            const code = (res.subjectCode || "").toLowerCase();
            // Match Math or English
            if (code.includes('mth') || code.includes('math') || code.includes('eng')) {
                if (!subjectTotals[code]) subjectTotals[code] = { sum: 0, count: 0 };
                subjectTotals[code].sum += parseFloat(res.score?.toString() || "0");
                subjectTotals[code].count += 1;
            }
        }

        let passedMath = false;
        let passedEng = false;

        for (const [code, data] of Object.entries(subjectTotals)) {
            const annualSubjAvg = data.sum / 3; // Assuming 3 terms
            if (code.includes('math') || code.includes('mth')) {
                if (annualSubjAvg >= 50) passedMath = true;
            } else if (code.includes('eng')) {
                if (annualSubjAvg >= 50) passedEng = true;
            }
        }

        return passedMath && passedEng;
    }

    /**
     * Evaluates Tertiary Promotion Rules based on CGPA and Credits.
     */
    private static async evaluateTertiary(studentId: number, sessionId: number): Promise<boolean> {
        // Minimal tertiary implementation, relying on standard CGPA > 1.0 logic
        // This mirrors the bulk script logic
        const { semesterSummaries } = await import("@/db/schema");
        const summaries = await db.select().from(semesterSummaries)
            .where(and(
                eq(semesterSummaries.studentId, studentId),
                eq(semesterSummaries.sessionId, sessionId)
            ));

        const creditsEarned = summaries.reduce((total, s) => total + (s.tce || 0), 0);
        
        // Find latest CGPA
        const sem2 = summaries.find(s => s.semester === '2');
        const sem1 = summaries.find(s => s.semester === '1');
        const latest = sem2 || sem1;
        const cgpa = latest ? parseFloat(latest.cgpa?.toString() || "0") : 0;

        return cgpa > 1.0 && creditsEarned > 25;
    }
}
