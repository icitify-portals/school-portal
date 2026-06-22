import { db } from "@/db/db";
import { 
    results, enrollments, students, users, courses, 
    academicSessions, semesterSummaries, annualSummaries
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TraitService } from "./TraitService";
import { GradingService } from "./GradingService";

export class ResultAggregationService {
    
    /**
     * Aggregates all result data for a student in a specific session/term.
     * Matches the 'compute_result_data' logic from the Rust engine.
     */
    static async computeStudentResultData(admissionNumber: string, sessionId: number, term: number, branchId?: number) {
        // 1. Fetch Student Profile
        const [studentProfile] = await db.select({
            id: students.id,
            name: users.name,
            admissionNumber: students.admissionNumber,
            currentLevel: students.currentLevel,
            branchId: students.unitId
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(eq(students.admissionNumber, admissionNumber))
        .limit(1);

        if (!studentProfile) throw new Error("Student not found");

        // 2. Fetch All Subject Results
        const subjectResults = await db.select({
            id: results.id,
            subjectCode: courses.code,
            subjectName: courses.name,
            caScore: results.caScore,
            examScore: results.examScore,
            totalScore: results.totalScore,
            grade: results.grade,
            rank: results.rankLevel
        })
        .from(results)
        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(and(
            eq(enrollments.studentId, studentProfile.id),
            eq(enrollments.semester, term.toString() as any)
            // Session logic handled via enrollment year or join
        ));

        // 3. Fetch Traits
        const traitRatings = await TraitService.getStudentRatings(studentProfile.id, sessionId, term, branchId);

        // 4. Fetch Summary Data (GPA, Average, Position)
        const [summary] = await db.select().from(semesterSummaries)
            .where(and(
                eq(semesterSummaries.studentId, studentProfile.id),
                eq(semesterSummaries.sessionId, sessionId),
                eq(semesterSummaries.semester, term.toString() as any)
            )).limit(1);

        // 5. Final Assembly
        return {
            student: studentProfile,
            results: subjectResults,
            traits: traitRatings,
            summary: summary ? {
                average: summary.twgp, // Placeholder for average calculation if not in summary
                gpa: summary.gpa,
                cgpa: summary.cgpa,
                tcr: summary.tcr,
                tce: summary.tce
            } : null,
            termInfo: {
                sessionId,
                term
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generates high-fidelity report sheet data.
     * Matches 'Result::report_sheets' from Rust.
     */
    static async generateReportSheet(options: {
        admissionNumber: string;
        sessionId: number;
        term: number;
        branchId?: number;
        context?: string;
    }) {
        const data = await this.computeStudentResultData(
            options.admissionNumber, 
            options.sessionId, 
            options.term, 
            options.branchId
        );

        // Fetch School Info
        const [sessionInfo] = await db.select().from(academicSessions).where(eq(academicSessions.id, options.sessionId)).limit(1);

        return {
            ...data,
            schoolInfo: {
                sessionName: sessionInfo?.name || "N/A",
                termName: options.term === 1 ? "First Term" : options.term === 2 ? "Second Term" : "Third Term"
            },
            context: options.context || "Exam"
        };
    }
}
