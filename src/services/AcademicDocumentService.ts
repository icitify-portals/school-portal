import { db } from "@/db/db";
import { transcriptRequests, officialResultDownloads, students, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export class AcademicDocumentService {

    /**
     * Initializes a transcript request from a student.
     */
    static async requestTranscript(data: {
        studentId: number,
        applicantName: string,
        applicantEmail: string,
        matricNumber: string,
        destinationName: string,
        destinationAddress: string,
        deliveryMethod: 'email' | 'courier' | 'pickup',
        fee: number
    }) {
        return await db.insert(transcriptRequests).values({
            studentId: data.studentId,
            applicantName: data.applicantName,
            applicantEmail: data.applicantEmail,
            matricNumber: data.matricNumber,
            destinationName: data.destinationName,
            destinationAddress: data.destinationAddress,
            deliveryMethod: data.deliveryMethod,
            feePaid: data.fee.toFixed(2),
            paymentStatus: data.fee > 0 ? 'unpaid' : 'paid',
            approvalStatus: 'pending'
        });
    }

    /**
     * Logs the generation of an official result PDF for audit purposes.
     */
    static async logOfficialDownload(data: {
        studentId: number,
        sessionId: number,
        semester?: '1' | '2',
        downloadedBy: number,
        ipAddress?: string
    }) {
        return await db.insert(officialResultDownloads).values({
            studentId: data.studentId,
            sessionId: data.sessionId,
            semester: data.semester,
            downloadedBy: data.downloadedBy,
            ipAddress: data.ipAddress
        });
    }
}
