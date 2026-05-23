import { db } from "@/db/db";
import { semesterSummaries, annualSummaries, academicSessions, students } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export class ResultService {
    
    /**
     * Retrieves all available report sheets (terminal and annual) for a student.
     * Matches 'student.available_report_sheets' from Rust.
     */
    static async getAvailableReportSheets(studentId: number) {
        // 1. Fetch Terminal Summaries
        const terminalSummaries = await db.select({
            sessionId: semesterSummaries.sessionId,
            sessionName: academicSessions.name,
            term: semesterSummaries.semester,
            status: semesterSummaries.principalComment // or a dedicated 'status' field if added
        })
        .from(semesterSummaries)
        .innerJoin(academicSessions, eq(semesterSummaries.sessionId, academicSessions.id))
        .where(eq(semesterSummaries.studentId, studentId))
        .orderBy(desc(semesterSummaries.sessionId), desc(semesterSummaries.semester));

        // 2. Fetch Annual Summaries
        const yearlySummaries = await db.select({
            sessionId: annualSummaries.sessionId,
            sessionName: academicSessions.name,
            status: annualSummaries.status
        })
        .from(annualSummaries)
        .innerJoin(academicSessions, eq(annualSummaries.sessionId, academicSessions.id))
        .where(eq(annualSummaries.studentId, studentId))
        .orderBy(desc(annualSummaries.sessionId));

        return {
            terminal: terminalSummaries.map(s => ({
                id: `${s.sessionId}_${s.term}`,
                session: s.sessionName,
                term: s.term,
                type: "Terminal",
                isPublished: true // Logic for publication can be added
            })),
            annual: yearlySummaries.map(s => ({
                id: `${s.sessionId}_annual`,
                session: s.sessionName,
                type: "Annual",
                isPublished: s.status === 'published'
            }))
        };
    }

    /**
     * Resolves student ID from admission number.
     */
    static async getStudentIdByAdmissionNumber(admissionNumber: string) {
        const [student] = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.admissionNumber, admissionNumber))
            .limit(1);
        return student?.id;
    }
}
