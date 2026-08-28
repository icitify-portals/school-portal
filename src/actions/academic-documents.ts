"use server";

import { AcademicDocumentService } from "@/services/AcademicDocumentService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { transcriptRequests, users, students } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { hasRole, hasPermission } from "@/lib/rbac";
import { auth } from "@/auth";

async function getCurrentStudentId(): Promise<number | null> {
    const session = await auth();
    if (!session?.user) return null;
    const userId = parseInt((session.user as any).id);
    if (isNaN(userId)) return null;
    const [student] = await db.select({ id: students.id }).from(students).where(eq(students.userId, userId)).limit(1);
    return student?.id ?? null;
}

export async function submitTranscriptRequestAction(data: {
    destinationName: string;
    destinationAddress: string;
    deliveryMethod: 'email' | 'courier' | 'pickup';
}) {
    try {
        const studentId = await getCurrentStudentId();
        if (!studentId) throw new Error("You must be logged in as a student to request a transcript");

        const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
        if (!student) throw new Error("Student record not found");

        const [user] = await db.select().from(users).where(eq(users.id, student.userId!)).limit(1);

        const result = await AcademicDocumentService.requestTranscript({
            studentId,
            applicantName: user?.name || "Student",
            applicantEmail: user?.email || "",
            matricNumber: student.matricNumber || "",
            destinationName: data.destinationName,
            destinationAddress: data.destinationAddress,
            deliveryMethod: data.deliveryMethod,
            fee: 0
        });
        revalidatePath("/student/transcripts");
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getTranscriptRequestsAction() {
    try {
        const studentId = await getCurrentStudentId();
        if (!studentId) return { success: true, data: [] };

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
        .where(eq(transcriptRequests.studentId, studentId))
        .orderBy(desc(transcriptRequests.requestedAt));

        return { success: true, data: requests };
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
        const session = await auth();
        const userId = session?.user ? parseInt((session.user as any).id) : 0;
        await AcademicDocumentService.logOfficialDownload({
            ...data,
            downloadedBy: userId
        });
        
        return { success: true, message: "Official PDF Generated and Logged" };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
