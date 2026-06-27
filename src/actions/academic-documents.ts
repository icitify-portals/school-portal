"use server";

import { AcademicDocumentService } from "@/services/AcademicDocumentService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { transcriptRequests, users, students } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { hasRole, hasPermission } from "@/lib/rbac";

export async function submitTranscriptRequestAction(data: any) {
    try {
        const result = await AcademicDocumentService.requestTranscript(data);
        revalidatePath("/student/transcripts");
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getTranscriptRequestsAction() {
    try {
        const requests = await db.select({
            id: transcriptRequests.id,
            studentName: users.name,
            destination: transcriptRequests.destinationName,
            status: transcriptRequests.approvalStatus,
            payment: transcriptRequests.paymentStatus,
            requestedAt: transcriptRequests.requestedAt
        })
        .from(transcriptRequests)
        .innerJoin(students, eq(transcriptRequests.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .orderBy(desc(transcriptRequests.requestedAt));

        return { success: true, data: requests };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function approveAndDispatchTranscriptAction(requestId: number) {
    try {
        const isRegistrar = await hasPermission("academic.sign_transcript") || await hasRole("registrar") || await hasRole("admin") || await hasRole("superadmin");
        if (!isRegistrar) throw new Error("Unauthorized: Registrar access required");
        
        const userId = 1; // Current User
        await AcademicDocumentService.dispatchTranscript(requestId, userId);
        revalidatePath("/admin/academic/transcripts");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function generateOfficialResultPdfAction(data: {
    studentId: number,
    sessionId: number,
    semester?: '1' | '2'
}) {
    try {
        const userId = 1; // Current User
        await AcademicDocumentService.logOfficialDownload({
            ...data,
            downloadedBy: userId
        });
        
        // In a real app, this would return a PDF buffer or URL
        return { success: true, message: "Official PDF Generated and Logged" };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
