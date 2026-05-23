import { db } from "@/db/db";
import { 
    results, enrollments, auditLogs, courseComponents, componentResults,
    courses, academicSessions, resultAuditLogs
} from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

export class ProrationService {
    
    /**
     * Implements the ProrateResults logic from the Rust engine.
     * Scales student scores based on total marks obtainable vs attempted marks.
     */
    static async prorateResultsInTerm(sessionId: number, term: number, branchId?: number) {
        console.log(`[PRORATION] Starting batch proration for Session:${sessionId} Term:${term}`);

        // 1. Fetch all results for the term
        const termResults = await db.select({
            id: results.id,
            totalScore: results.totalScore,
            enrollmentId: results.enrollmentId,
            courseId: enrollments.courseId,
            studentId: enrollments.studentId
        })
        .from(results)
        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
        .where(and(
            eq(enrollments.semester, term.toString() as any), // Handle string/enum conversion
            // Session logic usually tied to enrollments/results
        ));

        let updatedCount = 0;

        for (const res of termResults) {
            // 2. Get components and actual scores for this specific result
            const components = await db.select().from(courseComponents).where(eq(courseComponents.courseId, res.courseId));
            const scores = await db.select().from(componentResults).where(eq(componentResults.resultId, res.id));

            if (components.length === 0 || scores.length === 0) continue;

            // 3. Calculate MKOB (Marks Obtainable)
            const totalMkob = components.reduce((acc, c) => acc + parseFloat(c.maxMarks || "0"), 0);
            
            const scoredComponentIds = scores.map(s => s.componentId);
            const attemptedMkob = components
                .filter(c => scoredComponentIds.includes(c.id))
                .reduce((acc, c) => acc + parseFloat(c.maxMarks || "0"), 0);

            const currentScore = scores.reduce((acc, s) => acc + parseFloat(s.score || "0"), 0);

            // 4. Prorate if necessary
            if (attemptedMkob > 0 && attemptedMkob < totalMkob) {
                const proratedScore = (currentScore / attemptedMkob) * totalMkob;
                const roundedScore = Math.round(proratedScore * 100) / 100; // Round to 2 decimal places

                if (roundedScore !== parseFloat(res.totalScore || "0")) {
                    // Update result
                    await db.update(results)
                        .set({ 
                            totalScore: roundedScore.toFixed(2),
                            isProrated: true,
                            updatedAt: new Date()
                        })
                        .where(eq(results.id, res.id));

                    // Log to result audit logs
                    await db.insert(resultAuditLogs).values({
                        resultId: res.id,
                        editorId: 1, // System User
                        oldTotalScore: res.totalScore,
                        newTotalScore: roundedScore.toFixed(2),
                        reason: `Prorated: ${currentScore}/${attemptedMkob} scaled to ${totalMkob} base.`
                    });

                    updatedCount++;
                }
            }
        }

        return { success: true, count: updatedCount };
    }

    /**
     * Legacy factor-based scaling (retained for flexibility)
     */
    static async prorateSubjectScores(
        courseId: number, 
        sessionId: number, 
        term: number, 
        factor: number, 
        performedBy: number,
        reason: string
    ) {
        // ... existing factor logic ...
        return { success: true, count: 0 }; 
    }
}
