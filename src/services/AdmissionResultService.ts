import { db } from "@/db/db";
import { admissionExamResults, admissionApplicationsV2 } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class AdmissionResultService {

    /**
     * Authenticates an applicant for result checking.
     * Matches 'Result::authenticate' from Rust.
     */
    static async authenticate(registrationNumber: string, pin: string) {
        const applicationId = parseInt(registrationNumber);
        
        const [application] = await db.select()
            .from(admissionApplicationsV2)
            .where(eq(admissionApplicationsV2.id, applicationId))
            .limit(1);

        if (!application) throw new Error("Invalid Registration Number");

        // Simple auth check - matching Rust logic
        if (application.pin && application.pin !== pin) {
            throw new Error("Invalid Authentication PIN");
        }

        return {
            authenticated: true,
            applicationId: application.id,
            status: application.status
        };
    }

    /**
     * Checks the admission status and exam scores for an applicant.
     * Matches 'Result::check()' from Rust.
     */
    static async check(applicationId: number) {
        const [application] = await db.select()
            .from(admissionApplicationsV2)
            .where(eq(admissionApplicationsV2.id, applicationId))
            .limit(1);

        if (!application) throw new Error("Record not found");

        const results = await db.select()
            .from(admissionExamResults)
            .where(eq(admissionExamResults.applicationId, applicationId));

        return {
            admissionStatus: application.status,
            examResults: results.map(r => ({
                examId: r.examId,
                totalScore: r.totalScore,
                status: r.status,
                completedAt: r.endTime
            })),
            notes: application.admissionNotes
        };
    }
}
