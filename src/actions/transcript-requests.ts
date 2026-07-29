"use server";

import { db } from "@/db/db";
import { transcriptRequests, transactions, students, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { initiatePayment, verifyPayment } from "./payment-gateways";
import { sendEmail } from "@/lib/mail";

// Constants for Fees (Can be moved to DB settings later)
const TRANSCRIPT_FEE = 15000; // ALATPay fee
const PROCESSING_FEE = 5000;  // Paystack fee

export async function submitTranscriptApplication(data: {
    applicantName: string;
    matricNumber: string;
    applicantEmail: string;
    applicantPhone: string;
    destinationName: string;
    destinationAddress: string;
    deliveryMethod: 'email' | 'courier' | 'pickup';
}) {
    try {
        // Look up student by matric if they exist
        const [student] = await db.select().from(students).where(eq(students.matricNumber, data.matricNumber)).limit(1);

        const alatRef = `TR-ALAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const [result] = await db.insert(transcriptRequests).values({
            studentId: student?.id || null,
            applicantName: data.applicantName,
            matricNumber: data.matricNumber,
            applicantEmail: data.applicantEmail,
            applicantPhone: data.applicantPhone,
            destinationName: data.destinationName,
            destinationAddress: data.destinationAddress,
            deliveryMethod: data.deliveryMethod,
            alatpayRef: alatRef,
            alatpayStatus: 'unpaid',
            paystackStatus: 'unpaid',
            paymentStatus: 'unpaid',
            approvalStatus: 'pending'
        });

        const insertId = result.insertId;

        // Initialize ALATPay (Step 1)
        const initRes = await initiatePayment(alatRef, TRANSCRIPT_FEE, 'alatpay', data.applicantEmail, data.applicantName, '');
        if (initRes.error) {
            return { success: false, error: initRes.error };
        }

        return { success: true, url: initRes.paymentUrl, requestId: insertId };
    } catch (e: any) {
        console.error("submitTranscriptApplication error:", e);
        return { success: false, error: e.message || "Failed to submit application" };
    }
}

export async function verifyTranscriptAlatpay(reference: string) {
    try {
        const [req] = await db.select().from(transcriptRequests).where(eq(transcriptRequests.alatpayRef, reference)).limit(1);
        if (!req) return { success: false, error: "Request not found" };

        if (req.alatpayStatus === 'paid') {
            return preparePaystackStep(req);
        }

        const verify = await verifyPayment('alatpay', reference);
        if (verify.error) {
            return { success: false, error: verify.error };
        }

        await db.update(transcriptRequests)
            .set({ alatpayStatus: 'paid', paymentStatus: 'partial' })
            .where(eq(transcriptRequests.id, req.id));

        return preparePaystackStep(req);
    } catch (e: any) {
        console.error("verifyTranscriptAlatpay error:", e);
        return { success: false, error: e.message || "Failed to verify ALATPay payment" };
    }
}

async function preparePaystackStep(req: any) {
    const paystackRef = req.paystackRef || `TR-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    if (!req.paystackRef) {
        await db.update(transcriptRequests).set({ paystackRef }).where(eq(transcriptRequests.id, req.id));
    }

    const initRes = await initiatePayment(paystackRef, PROCESSING_FEE, 'paystack', req.applicantEmail, req.applicantName, '');
    if (initRes.error) {
        return { success: false, error: initRes.error };
    }

    return { success: true, nextStep: 'paystack', url: initRes.paymentUrl };
}


export async function verifyTranscriptPaystack(reference: string) {
    try {
        const [req] = await db.select().from(transcriptRequests).where(eq(transcriptRequests.paystackRef, reference)).limit(1);
        if (!req) return { success: false, error: "Request not found" };

        if (req.paystackStatus === 'paid') {
            return { success: true, data: req };
        }

        const verify = await verifyPayment('paystack', reference);
        if (verify.error) {
            return { success: false, error: verify.error };
        }

        await db.update(transcriptRequests)
            .set({ 
                paystackStatus: 'paid', 
                paymentStatus: 'paid',
                feePaid: (TRANSCRIPT_FEE + PROCESSING_FEE).toString()
            })
            .where(eq(transcriptRequests.id, req.id));

        return { success: true, data: req };
    } catch (e: any) {
        console.error("verifyTranscriptPaystack error:", e);
        return { success: false, error: e.message || "Failed to verify Paystack payment" };
    }
}

export async function getAdminTranscriptRequests() {
    try {
        // Return only paid ones for processing
        return { 
            success: true, 
            data: await db.select().from(transcriptRequests)
                        .where(eq(transcriptRequests.paymentStatus, 'paid'))
                        .orderBy(desc(transcriptRequests.requestedAt)) 
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function dispatchTranscript(requestId: number, dispatchedByUserId: number, pdfBufferBase64: string) {
    try {
        const [req] = await db.select().from(transcriptRequests).where(eq(transcriptRequests.id, requestId)).limit(1);
        if (!req) return { success: false, error: "Request not found" };

        // 1. Update status
        await db.update(transcriptRequests)
            .set({ 
                approvalStatus: 'dispatched', 
                dispatchedAt: new Date(),
                dispatchedBy: dispatchedByUserId
            })
            .where(eq(transcriptRequests.id, requestId));

        // 2. Email student copy
        if (req.applicantEmail) {
            const pdfBuffer = Buffer.from(pdfBufferBase64, 'base64');
            const emailHtml = `
                <h2>Transcript Dispatched</h2>
                <p>Dear ${req.applicantName},</p>
                <p>Your official transcript has been successfully dispatched to: <b>${req.destinationName}</b>.</p>
                <p>As requested, please find attached the Student Copy of your transcript for your personal records.</p>
                <br/>
                <p>Best regards,<br/>Academic Office</p>
            `;
            await sendEmail(
                req.applicantEmail, 
                "Official Transcript Dispatched & Student Copy", 
                emailHtml, 
                undefined, 
                undefined,
                [{ filename: `Transcript_${req.matricNumber}.pdf`, content: pdfBuffer }]
            );
        }

        return { success: true };
    } catch (e: any) {
        console.error("dispatchTranscript error:", e);
        return { success: false, error: e.message || "Failed to dispatch" };
    }
}
