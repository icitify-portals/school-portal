import { db } from "@/db/db";
import { 
    courseEvaluations, 
    courses, 
    staffProfiles, 
    users, 
    studentCourseRegistrations 
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class EvaluationService {

    /**
     * Submits a student evaluation for a specific course.
     */
    static async submitEvaluation(data: {
        studentId: number,
        courseId: number,
        sessionId: number,
        semester: '1' | '2',
        ratings: Record<string, number>,
        comments?: string,
        isAnonymous?: boolean
    }) {
        // 1. Verify the student was actually registered for this course
        const registration = await db.select()
            .from(studentCourseRegistrations)
            .where(and(
                eq(studentCourseRegistrations.studentId, data.studentId),
                eq(studentCourseRegistrations.courseId, data.courseId),
                eq(studentCourseRegistrations.sessionId, data.sessionId)
            )).limit(1);

        if (!registration[0]) throw new Error("Unauthorized: You were not registered for this course.");

        // 2. Fetch the lecturer for this course (Assuming 1 lecturer for now)
        // In a real app, you'd lookup staff_subject_assignments
        const staffId = 1; // Placeholder

        return await db.insert(courseEvaluations).values({
            studentId: data.studentId,
            courseId: data.courseId,
            staffId: staffId,
            sessionId: data.sessionId,
            semester: data.semester,
            ratings: JSON.stringify(data.ratings),
            comments: data.comments,
            isAnonymous: data.isAnonymous ?? true
        });
    }

    /**
     * Retrieves aggregated evaluation data for a course/lecturer.
     */
    static async getCourseEvaluationSummary(courseId: number) {
        const evaluations = await db.select()
            .from(courseEvaluations)
            .where(eq(courseEvaluations.courseId, courseId));

        if (evaluations.length === 0) return null;

        // Compute average ratings
        const totals: Record<string, number> = {};
        evaluations.forEach(ev => {
            const r = JSON.parse(ev.ratings || "{}");
            Object.entries(r).forEach(([key, val]) => {
                totals[key] = (totals[key] || 0) + (val as number);
            });
        });

        const averages: Record<string, number> = {};
        Object.entries(totals).forEach(([key, val]) => {
            averages[key] = parseFloat((val / evaluations.length).toFixed(2));
        });

        return {
            count: evaluations.length,
            averages,
            comments: evaluations.map(ev => ev.comments).filter(Boolean)
        };
    }
}
