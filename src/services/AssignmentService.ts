import { db } from "@/db/db";
import {
    assignments,
    assignmentSubmissions,
    gradingRubrics,
    rubricCriteria,
    submissionRubricGrades
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class AssignmentService {
    /**
     * Submit an assignment with validation for deadlines and cut-off dates.
     */
    static async submitAssignment(data: {
        assignmentId: number;
        studentId: number;
        fileUrl?: string;
        onlineText?: string;
        audioUrl?: string;
        externalLinks?: string; // JSON string
        cloudFileUrl?: string;
        cloudFileType?: string;
    }) {
        const [assignment] = await db.select().from(assignments).where(eq(assignments.id, data.assignmentId)).limit(1);

        if (!assignment) throw new Error("Assignment not found");

        const now = new Date();

        // Check Cut-off Date
        if (assignment.cutOffDate && now > assignment.cutOffDate) {
            throw new Error("The cut-off date for this assignment has passed. No more submissions are allowed.");
        }

        // Check Resubmission Policy
        const [existing] = await db.select().from(assignmentSubmissions).where(and(
            eq(assignmentSubmissions.assignmentId, data.assignmentId),
            eq(assignmentSubmissions.studentId, data.studentId)
        )).limit(1);

        if (existing && !assignment.allowResubmission && (assignment.dueDate && now > assignment.dueDate)) {
            throw new Error("Resubmissions are not allowed after the due date for this assignment.");
        }

        // Determine Status (Submitted vs Late)
        let status: 'submitted' | 'late' = 'submitted';
        if (assignment.dueDate && now > assignment.dueDate) {
            status = 'late';
        }

        // Validate Submission Types
        const allowedTypes = JSON.parse(assignment.submissionTypes || '["file"]');
        if (data.fileUrl && !allowedTypes.includes('file')) throw new Error("File submissions are not allowed.");
        if (data.onlineText && !allowedTypes.includes('text')) throw new Error("Text submissions are not allowed.");
        if (data.audioUrl && !allowedTypes.includes('audio')) throw new Error("Audio submissions are not allowed.");
        if (data.externalLinks && !allowedTypes.includes('link')) throw new Error("URL submissions are not allowed.");
        if (data.cloudFileUrl && !allowedTypes.includes('cloud')) throw new Error("Cloud file submissions are not allowed.");

        const submissionData = {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
            fileUrl: data.fileUrl,
            onlineText: data.onlineText,
            audioUrl: data.audioUrl,
            externalLinks: data.externalLinks,
            cloudFileUrl: data.cloudFileUrl,
            cloudFileType: data.cloudFileType,
            submittedAt: now,
            status
        };

        if (existing) {
            await db.update(assignmentSubmissions)
                .set(submissionData)
                .where(eq(assignmentSubmissions.id, existing.id));
            
            return { success: true, submissionId: existing.id, status };
        } else {
            const [res] = await db.insert(assignmentSubmissions).values(submissionData);
            const submissionId = res.insertId;

            // Trigger Plagiarism Check for text
            if (data.onlineText) await this.checkPlagiarism(submissionId, data.onlineText);

            return { success: true, submissionId, status };
        }
    }

    /**
     * Mock plagiarism check logic.
     */
    static async checkPlagiarism(submissionId: number, text?: string) {
        if (!text) return;

        // Simulating some AI check
        const mockScore = Math.floor(Math.random() * 20); // 0-20% random similarity
        await db.update(assignmentSubmissions)
            .set({ plagiarismScore: mockScore })
            .where(eq(assignmentSubmissions.id, submissionId));
    }

    /**
     * Grade a submission using a rubric or simple scoring.
     */
    static async gradeSubmission(data: {
        submissionId: number;
        gradedBy: number;
        score?: number;
        feedback?: string;
        annotations?: any[]; // JSON for inline feedback
        rubricGrades?: { criterionId: number; points: number; feedback?: string }[];
    }) {
        const submissionRows = await db.select({
            submission: assignmentSubmissions,
            assignment: assignments
        })
            .from(assignmentSubmissions)
            .leftJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
            .where(eq(assignmentSubmissions.id, data.submissionId))
            .limit(1);

        const submission = submissionRows[0] ? {
            ...submissionRows[0].submission,
            assignment: submissionRows[0].assignment
        } : null;

        if (!submission) throw new Error("Submission not found");

        let finalScore = data.score;

        // If rubric grades are provided, calculate total score
        if (data.rubricGrades && data.rubricGrades.length > 0) {
            finalScore = data.rubricGrades.reduce((acc, g) => acc + g.points, 0);

            // Save individual rubric grades
            await db.transaction(async (tx) => {
                // Clear old rubric grades if any
                await tx.delete(submissionRubricGrades).where(eq(submissionRubricGrades.submissionId, data.submissionId));

                for (const grade of data.rubricGrades!) {
                    await tx.insert(submissionRubricGrades).values({
                        submissionId: data.submissionId,
                        criterionId: grade.criterionId,
                        points: grade.points,
                        feedback: grade.feedback
                    });
                }
            });
        }

        await db.update(assignmentSubmissions)
            .set({
                score: finalScore,
                feedback: data.feedback,
                annotations: data.annotations ? JSON.stringify(data.annotations) : undefined,
                gradedBy: data.gradedBy,
                gradedAt: new Date()
            })
            .where(eq(assignmentSubmissions.id, data.submissionId));

        return { success: true, score: finalScore };
    }

    /**
     * Create a rubric with criteria.
     */
    static async createRubric(data: {
        title: string;
        description?: string;
        courseId?: number;
        criteria: { title: string; description?: string; weight: number; levels: any[]; order: number }[];
    }) {
        return await db.transaction(async (tx) => {
            const [res] = await tx.insert(gradingRubrics).values({
                title: data.title,
                description: data.description,
                courseId: data.courseId
            });
            const rubricId = res.insertId;

            for (const crit of data.criteria) {
                await tx.insert(rubricCriteria).values({
                    rubricId,
                    title: crit.title,
                    description: crit.description,
                    weight: crit.weight,
                    levels: JSON.stringify(crit.levels),
                    order: crit.order
                });
            }

            return { success: true, rubricId };
        });
    }
}
