import { db } from "@/db/db";
import { admissionEntranceExams, admissionApplicationsV2, admissionFormTemplates, admissionExamSubjects, admissionExamResults } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class EntranceExamService {

    /**
     * Authenticates an applicant for the entrance examination.
     * Matches 'EntranceExamination::authenticate' from Rust.
     */
    static async authenticate(registrationNumber: string, auth: string) {
        const applicationId = parseInt(registrationNumber);
        
        const [application] = await db.select({
            id: admissionApplicationsV2.id,
            status: admissionApplicationsV2.status,
            templateId: admissionApplicationsV2.templateId
        })
        .from(admissionApplicationsV2)
        .where(eq(admissionApplicationsV2.id, applicationId))
        .limit(1);

        if (!application) throw new Error("Invalid Registration Number");
        
        // Use the application's PIN if set
        const [fullApp] = await db.select({ pin: admissionApplicationsV2.pin })
            .from(admissionApplicationsV2)
            .where(eq(admissionApplicationsV2.id, applicationId))
            .limit(1);

        if (fullApp?.pin && fullApp.pin !== auth) throw new Error("Invalid Authentication Token/PIN");

        return {
            authenticated: true,
            applicationId: application.id,
            templateId: application.templateId
        };
    }

    /**
     * Retrieves instructions for the entrance examination.
     */
    static async getInstructions(applicationId: number) {
        const [application] = await db.select({ templateId: admissionApplicationsV2.templateId })
            .from(admissionApplicationsV2)
            .where(eq(admissionApplicationsV2.id, applicationId))
            .limit(1);

        if (!application) throw new Error("Application not found");

        const [exam] = await db.select({ instructions: admissionEntranceExams.instructions })
            .from(admissionEntranceExams)
            .where(eq(admissionEntranceExams.templateId, application.templateId))
            .limit(1);

        return exam?.instructions || "No instructions provided for this examination.";
    }

    /**
     * Retrieves examination metadata for an applicant, including session timing.
     * Matches 'entrance_examination.metadata().get()' from Rust.
     */
    static async getMetadata(applicationId: number) {
        const [application] = await db.select({ templateId: admissionApplicationsV2.templateId })
            .from(admissionApplicationsV2)
            .where(eq(admissionApplicationsV2.id, applicationId))
            .limit(1);

        if (!application) throw new Error("Application not found");

        const [exam] = await db.select()
            .from(admissionEntranceExams)
            .where(eq(admissionEntranceExams.templateId, application.templateId))
            .limit(1);

        if (!exam) throw new Error("Examination template not found");

        const [session] = await db.select()
            .from(admissionExamResults)
            .where(and(
                eq(admissionExamResults.applicationId, applicationId),
                eq(admissionExamResults.examId, exam.id)
            ))
            .limit(1);

        return {
            examId: exam.id,
            duration: exam.duration,
            instructions: exam.instructions,
            session: session ? {
                startTime: session.startTime,
                endTime: session.endTime,
                status: session.status
            } : null
        };
    }

    /**
     * Updates examination session metadata (e.g., Start/Stop times).
     * Matches 'entrance_examination.metadata().update(options)' from Rust.
     */
    static async updateMetadata(applicationId: number, options: { startTime?: Date, endTime?: Date }) {
        const metadata = await this.getMetadata(applicationId);
        
        // Upsert session
        const existingSession = metadata.session;

        if (existingSession) {
            await db.update(admissionExamResults)
                .set({
                    startTime: options.startTime || undefined,
                    endTime: options.endTime || undefined,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(admissionExamResults.applicationId, applicationId),
                    eq(admissionExamResults.examId, metadata.examId)
                ));
        } else {
            await db.insert(admissionExamResults).values({
                applicationId: applicationId,
                examId: metadata.examId,
                startTime: options.startTime || new Date(),
                endTime: options.endTime || undefined,
                status: 'started'
            });
        }

        return { success: true };
    }

    /**
     * Retrieves the examination data structure (subjects & questions) for the applicant.
     * Matches 'EntranceExamination::writeData()' from Rust.
     */
    static async getWriteData(applicationId: number) {
        const metadata = await this.getMetadata(applicationId);
        if (!metadata || !metadata.examId) return [];

        const examId = metadata.examId;

        return await db.query.admissionExamSubjects.findMany({
            where: eq(admissionExamSubjects.examId, examId),
            with: {
                questions: true
            }
        });
    }

    /**
     * Submits the examination results for an applicant.
     * Matches 'EntranceExamination::submit(writeObject)' from Rust.
     */
    static async submit(applicationId: number, writeObject: any) {
        const [examResult] = await db.insert(admissionExamResults).values({
            applicationId: applicationId,
            examId: writeObject.examId,
            subjectScores: JSON.stringify(writeObject.subjectScores),
            totalScore: (writeObject.totalScore || 0).toString(),
            status: 'completed',
            endTime: new Date()
        });

        return { success: true, resultId: (examResult as any).insertId };
    }
}
