import { db } from "@/db/db";
import { transcriptRequests, officialResultDownloads, transactions, students, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class AcademicDocumentService {

    /**
     * Initializes a transcript request.
     * Status starts as 'unpaid'.
     */
    static async requestTranscript(data: {
        studentId: number,
        destinationName: string,
        destinationAddress: string,
        deliveryMethod: 'email' | 'courier' | 'pickup',
        fee: number
    }) {
        return await db.insert(transcriptRequests).values({
            studentId: data.studentId,
            destinationName: data.destinationName,
            destinationAddress: data.destinationAddress,
            deliveryMethod: data.deliveryMethod,
            feePaid: data.fee.toFixed(2),
            paymentStatus: 'unpaid',
            approvalStatus: 'pending'
        });
    }

    /**
     * Confirms payment for a transcript and moves it to 'processing'.
     */
    static async confirmTranscriptPayment(requestId: number, transactionId: number) {
        return await db.update(transcriptRequests)
            .set({
                paymentStatus: 'paid',
                approvalStatus: 'processing',
                transactionId: transactionId
            })
            .where(eq(transcriptRequests.id, requestId));
    }

    /**
     * Finalizes and dispatches a transcript.
     */
    static async dispatchTranscript(requestId: number, dispatcherId: number) {
        return await db.update(transcriptRequests)
            .set({
                approvalStatus: 'dispatched',
                dispatchedBy: dispatcherId,
                dispatchedAt: new Date()
            })
            .where(eq(transcriptRequests.id, requestId));
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
