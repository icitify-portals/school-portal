import { db } from "@/db/db";
import { gradingSystems, gradePoints, gradingSystemSessions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class GradingService {
    
    /**
     * Dynamically calculates the Grade and Remark based on the system's grading rubrics.
     * Maps to Result::grade and Result::remark in the Rust system.
     */
    static async getGradeAndRemark(
        score: number, 
        levelId?: string | number, 
        context: string = "exam", 
        branchId?: number, 
        sessionId?: number
    ): Promise<{ grade: string, remark: string }> {
        
        let gradingSystemIdToUse: number | null = null;

        // In a fully dynamic system, we look up the specific grading system 
        // assigned to the session, branch, or class level.
        if (sessionId) {
            const activeSystem = await db.select().from(gradingSystemSessions)
                .where(eq(gradingSystemSessions.sessionId, sessionId))
                .limit(1);
            if (activeSystem.length > 0) {
                gradingSystemIdToUse = activeSystem[0].gradingSystemId;
            }
        }

        // Fallback to default grading system if none mapped specifically
        if (!gradingSystemIdToUse) {
            const defaultSystem = await db.select().from(gradingSystems)
                .where(eq(gradingSystems.isDefault, true))
                .limit(1);
            if (defaultSystem.length > 0) {
                gradingSystemIdToUse = defaultSystem[0].id;
            } else {
                // Hard fallback if database is empty
                return this.getFallbackGrade(score);
            }
        }

        // Fetch Grade Points configured for this Grading System
        const points = await db.select().from(gradePoints)
            .where(eq(gradePoints.gradingSystemId, gradingSystemIdToUse));

        // Math mapping
        for (const pt of points) {
            if (score >= pt.minMark && score <= pt.maxMark) {
                return {
                    grade: pt.letterGrade,
                    remark: pt.description || "Satisfactory" // description acts as the context-aware Remark
                };
            }
        }

        // If score is somehow out of bounds (e.g. over 100 or negative)
        return { grade: "N/A", remark: "Invalid Score Range" };
    }

    /**
     * Mathematical fallback if the database grading systems are not fully seeded yet.
     */
    private static getFallbackGrade(score: number): { grade: string, remark: string } {
        if (score >= 70) return { grade: "A", remark: "Excellent" };
        if (score >= 60) return { grade: "B", remark: "Very Good" };
        if (score >= 50) return { grade: "C", remark: "Good" };
        if (score >= 45) return { grade: "D", remark: "Pass" };
        if (score >= 40) return { grade: "E", remark: "Poor" };
        return { grade: "F", remark: "Fail" };
    }
}
