"use server";

import { db } from "@/db/db";
import { transcriptRequests, transactions, students, users, studentBills } from "@/db/schema";
import { eq, desc, and, like, ne, sql } from "drizzle-orm";
import { initiatePayment, verifyPayment } from "./payment-gateways";
import { sendEmail } from "@/lib/mail";
import { getSettingByKey } from "@/actions/settings";
// Fallback Constants for Fees (Now dynamically fetched from DB)
const DEFAULT_TRANSCRIPT_FEE = 15000; // ALATPay fee
const DEFAULT_PROCESSING_FEE = 4000;  // Paystack fee (reduced to ₦4,000)

export async function getTranscriptFees() {
    const tFeeStr = await getSettingByKey('transcript_fee');
    const pFeeStr = await getSettingByKey('transcript_processing_fee');
    return {
        transcriptFee: tFeeStr !== null ? parseInt(tFeeStr) : DEFAULT_TRANSCRIPT_FEE,
        processingFee: pFeeStr !== null ? parseInt(pFeeStr) : DEFAULT_PROCESSING_FEE,
    };
}

export async function checkStudentGraduationClearance(matricNumber: string) {
    if (!matricNumber || !matricNumber.trim()) {
        return { success: false, error: "Matriculation number is required" };
    }
    const cleanMatric = matricNumber.trim().toUpperCase();

    try {
        const [student] = await db
            .select({
                id: students.id,
                matricNumber: students.matricNumber,
                status: students.status,
                programmeType: students.programmeType,
                userName: users.name,
                userEmail: users.email,
            })
            .from(students)
            .leftJoin(users, eq(students.userId, users.id))
            .where(eq(students.matricNumber, cleanMatric))
            .limit(1);

        if (!student) {
            return {
                success: true,
                found: false,
                isGraduant: false,
                isCleared: true,
                message: "Student record not found in portal database (external/legacy applicant)."
            };
        }

        const graduantStatuses = ['nd_graduant', 'hnd_graduant', 'nd_graduated', 'hnd_graduated'];
        const isGraduant = graduantStatuses.includes(String(student.status || '').toLowerCase());

        // Query graduation & clearance bills
        const bills = await db
            .select({
                id: studentBills.id,
                totalAmount: studentBills.totalAmount,
                amountPaid: studentBills.amountPaid,
                status: studentBills.status,
                note: studentBills.note,
            })
            .from(studentBills)
            .where(
                and(
                    eq(studentBills.studentId, student.id),
                    like(studentBills.note, '%Graduation & Clearance%')
                )
            );

        let totalOwed = 0;
        let hasUnpaidGraduationBill = false;
        const billDetails: string[] = [];

        for (const b of bills) {
            const total = parseFloat(b.totalAmount || "0");
            const paid = parseFloat(b.amountPaid || "0");
            const outstanding = total - paid;
            if (b.status !== 'paid' && outstanding > 0) {
                hasUnpaidGraduationBill = true;
                totalOwed += outstanding;
                billDetails.push(`${b.note}: ₦${outstanding.toLocaleString()} outstanding`);
            }
        }

        // If student is marked as graduant but has no bill generated yet, default to standard rate
        if (isGraduant && bills.length === 0) {
            const defaultAmt = student.status?.includes('hnd') ? 49500 : 39500;
            return {
                success: true,
                found: true,
                studentId: student.id,
                studentName: student.userName,
                isGraduant: true,
                isCleared: false,
                totalOwed: defaultAmt,
                message: `Compulsory graduation clearance fees (Convocation, Certificate, and Incidental Fee: ₦${defaultAmt.toLocaleString()}) must be settled before an official transcript can be requested.`
            };
        }

        const isCleared = !hasUnpaidGraduationBill;

        return {
            success: true,
            found: true,
            studentId: student.id,
            studentName: student.userName,
            isGraduant,
            isCleared,
            totalOwed,
            billDetails,
            message: isCleared
                ? "Student is financially cleared for graduation."
                : `Outstanding graduation clearance fees: ₦${totalOwed.toLocaleString()} (Convocation, Certificate, and Incidental Fee must be paid).`
        };
    } catch (e: any) {
        console.error("checkStudentGraduationClearance error:", e);
        return { success: false, error: e.message || "Failed to check clearance" };
    }
}

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
        // Compulsory Graduation Clearance check for graduants/alumni
        const clearance = await checkStudentGraduationClearance(data.matricNumber);
        if (clearance.found && clearance.isGraduant && !clearance.isCleared) {
            return {
                success: false,
                clearanceBlocked: true,
                totalOwed: clearance.totalOwed,
                error: `Graduation Clearance Required: You have unpaid compulsory graduation fees (Convocation, Certificate & Incidental Fee totaling ₦${clearance.totalOwed?.toLocaleString()}). All graduation fees must be settled in your student portal before an official transcript application can be submitted.`
            };
        }

        // Look up student by matric if they exist
        const [student] = await db.select().from(students).where(eq(students.matricNumber, data.matricNumber.trim().toUpperCase())).limit(1);

        const tFeeStr = await getSettingByKey('transcript_fee');
        const pFeeStr = await getSettingByKey('transcript_processing_fee');
        
        // If not set, they fall back to the default. If explicitly '0', they become 0.
        const transcriptFee = tFeeStr !== null ? parseInt(tFeeStr) : DEFAULT_TRANSCRIPT_FEE;
        const processingFee = pFeeStr !== null ? parseInt(pFeeStr) : DEFAULT_PROCESSING_FEE;

        if (transcriptFee === 0 && processingFee === 0) {
            // Bypass all payments
            const [result] = await db.insert(transcriptRequests).values({
                studentId: student?.id || null,
                applicantName: data.applicantName,
                matricNumber: data.matricNumber,
                applicantEmail: data.applicantEmail,
                applicantPhone: data.applicantPhone,
                destinationName: data.destinationName,
                destinationAddress: data.destinationAddress,
                deliveryMethod: data.deliveryMethod,
                alatpayRef: 'FREE-BYPASS',
                paystackRef: 'FREE-BYPASS',
                alatpayStatus: 'paid',
                paystackStatus: 'paid',
                paymentStatus: 'paid',
                approvalStatus: 'pending'
            });
            return { success: true, url: '/transcript-application/verify?ref=FREE-BYPASS', requestId: result.insertId };
        }

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
            alatpayStatus: transcriptFee === 0 ? 'paid' : 'unpaid',
            paystackStatus: processingFee === 0 ? 'paid' : 'unpaid',
            paymentStatus: 'unpaid',
            approvalStatus: 'pending'
        });

        const insertId = result.insertId;
        
        // If transcript fee is 0 but processing fee is > 0, we can skip alatpay and jump to paystack
        if (transcriptFee === 0) {
             const paystackRef = `TR-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
             await db.update(transcriptRequests).set({ paystackRef }).where(eq(transcriptRequests.id, insertId));
             const initRes = await initiatePayment(paystackRef, processingFee, 'paystack', data.applicantEmail, data.applicantName, '');
             if (initRes.error) {
                 return { success: false, error: initRes.error };
             }
             return { success: true, url: initRes.paymentUrl, requestId: insertId };
        }

        // Initialize ALATPay (Step 1)
        const initRes = await initiatePayment(alatRef, transcriptFee, 'alatpay', data.applicantEmail, data.applicantName, '');
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
    const pFeeStr = await getSettingByKey('transcript_processing_fee');
    const processingFee = pFeeStr !== null ? parseInt(pFeeStr) : DEFAULT_PROCESSING_FEE;
    
    if (processingFee === 0) {
        // Skip paystack
        await db.update(transcriptRequests).set({
            paystackStatus: 'paid',
            paymentStatus: 'paid'
        }).where(eq(transcriptRequests.id, req.id));
        return { success: true, nextStep: 'success', url: '/transcript-application/verify?ref=FREE-BYPASS' };
    }

    let paystackRef = req.paystackRef;
    if (!paystackRef) {
        paystackRef = `TR-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await db.update(transcriptRequests).set({ paystackRef }).where(eq(transcriptRequests.id, req.id));
    }

    const initRes = await initiatePayment(paystackRef, processingFee, 'paystack', req.applicantEmail, req.applicantName, '');
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

        const fees = await getTranscriptFees();
        await db.update(transcriptRequests)
            .set({ 
                paystackStatus: 'paid', 
                paymentStatus: 'paid',
                feePaid: (fees.transcriptFee + fees.processingFee).toString()
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
        const rows = await db
            .select({
                request: transcriptRequests,
                studentId: students.id,
                studentStatus: students.status,
                studentMatric: students.matricNumber,
            })
            .from(transcriptRequests)
            .leftJoin(students, eq(transcriptRequests.studentId, students.id))
            .where(eq(transcriptRequests.paymentStatus, 'paid'))
            .orderBy(desc(transcriptRequests.requestedAt));

        // Enrich each request with their real-time graduation clearance status
        const enriched = await Promise.all(
            rows.map(async (row) => {
                let isCleared = true;
                let debt = 0;
                const reqMatric = row.request.matricNumber || row.studentMatric;

                if (reqMatric) {
                    const cl = await checkStudentGraduationClearance(reqMatric);
                    if (cl.found && cl.isGraduant && !cl.isCleared) {
                        isCleared = false;
                        debt = cl.totalOwed || 0;
                    }
                }

                return {
                    ...row.request,
                    studentStatus: row.studentStatus,
                    isGraduationCleared: isCleared,
                    graduationDebt: debt,
                };
            })
        );

        return { 
            success: true, 
            data: enriched
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function dispatchTranscript(requestId: number, dispatchedByUserId: number, pdfBufferBase64: string) {
    try {
        const [req] = await db.select().from(transcriptRequests).where(eq(transcriptRequests.id, requestId)).limit(1);
        if (!req) return { success: false, error: "Request not found" };

        // Verify graduation clearance before dispatching
        if (req.matricNumber) {
            const cl = await checkStudentGraduationClearance(req.matricNumber);
            if (cl.found && cl.isGraduant && !cl.isCleared) {
                return {
                    success: false,
                    error: `Cannot dispatch transcript: Student has outstanding graduation clearance fees (₦${(cl.totalOwed || 0).toLocaleString()} unpaid for Convocation, Certificate, or Incidental Fee). Student must be cleared before dispatch.`
                };
            }
        }

        // Resolve dispatcher from auth if not provided (0 means use auth)
        let dispatcherId = dispatchedByUserId;
        if (!dispatcherId) {
            const { auth } = await import("@/auth");
            const session = await auth();
            dispatcherId = session?.user ? parseInt((session.user as any).id) : 0;
        }

        // 1. Update status
        await db.update(transcriptRequests)
            .set({ 
                approvalStatus: 'dispatched', 
                dispatchedAt: new Date(),
                dispatchedBy: dispatcherId || undefined
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
