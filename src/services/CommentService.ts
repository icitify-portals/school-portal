import { db } from "@/db/db";
import { systemSettings, results, semesterSummaries } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class CommentService {
    
    /**
     * The global fallback threshold mapping.
     */
    static defaultThresholds = [
        { min: 90, comment: "An outstanding performance! Keep it up." },
        { min: 80, comment: "Excellent result. You have done very well." },
        { min: 70, comment: "A very good result. Keep pushing harder." },
        { min: 60, comment: "A good result, but there is room for improvement." },
        { min: 50, comment: "A fair performance. You need to work harder." },
        { min: 40, comment: "A weak performance. Please consult with your teachers." },
        { min: 0,  comment: "Needs significant improvement. Close monitoring is required." }
    ];

    /**
     * Dynamically generates the Head of Academics / Principal's comment based on average score.
     */
    static async generateComment(average: number, branchId?: number): Promise<string> {
        let thresholds = this.defaultThresholds;

        // In a real multi-tenant scenario, we check if the branch has custom settings.
        // E.g. finding 'grading.comments' setting for the specific branch.
        if (branchId) {
            const customSetting = await db.select().from(systemSettings)
                .where(and(
                    eq(systemSettings.settingKey, `grading.comments_branch_${branchId}`)
                )).limit(1);

            if (customSetting.length > 0 && customSetting[0].settingValue) {
                try {
                    thresholds = JSON.parse(customSetting[0].settingValue);
                    // Ensure it is sorted descending by min value
                    thresholds.sort((a, b) => b.min - a.min);
                } catch (e) {
                    console.error(`Failed to parse custom comment settings for branch ${branchId}`);
                }
            }
        }

        for (const t of thresholds) {
            if (average >= t.min) {
                return t.comment;
            }
        }
        
        return "Result processed successfully.";
    }

    /**
     * Updates the subject-specific remark for a student's result.
     */
    static async updateSubjectRemark(resultId: number, remark: string) {
        return await db.update(results)
            .set({ teacherRemark: remark })
            .where(eq(results.id, resultId));
    }

    /**
     * Updates the class teacher's terminal comment.
     */
    static async updateTeacherComment(studentId: number, sessionId: number, term: number, comment: string) {
        return await db.update(semesterSummaries)
            .set({ teacherComment: comment })
            .where(and(
                eq(semesterSummaries.studentId, studentId),
                eq(semesterSummaries.sessionId, sessionId),
                eq(semesterSummaries.semester, term.toString() as any)
            ));
    }

    /**
     * Updates the Principal / Head of Academics' terminal comment.
     */
    static async updatePrincipalComment(studentId: number, sessionId: number, term: number, comment: string) {
        return await db.update(semesterSummaries)
            .set({ principalComment: comment })
            .where(and(
                eq(semesterSummaries.studentId, studentId),
                eq(semesterSummaries.sessionId, sessionId),
                eq(semesterSummaries.semester, term.toString() as any)
            ));
    }

    /**
     * Retrieves all comments (Teacher & Principal) for a student's terminal result.
     * Matches 'teacher_comment()' and 'hoa_comment()' logic from Rust.
     */
    static async getStudentComments(studentId: number, sessionId: number, term: number) {
        const [summary] = await db.select({
            teacher: semesterSummaries.teacherComment,
            principal: semesterSummaries.principalComment
        })
        .from(semesterSummaries)
        .where(and(
            eq(semesterSummaries.studentId, studentId),
            eq(semesterSummaries.sessionId, sessionId),
            eq(semesterSummaries.semester, term.toString() as any)
        ))
        .limit(1);

        return summary || { teacher: null, principal: null };
    }
}
