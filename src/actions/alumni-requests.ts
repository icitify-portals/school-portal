"use server";

import { db } from "@/db/db";
import { alumniCertificateRequests, processingFeeRules, feeItems, students, studentBills } from "@/db/schema";
import { eq, like, or, desc, and } from "drizzle-orm";
import { initiatePayment } from "./payment-gateways";
import { getSettingByKey } from "@/actions/settings";

const DEFAULT_CERT_FEE_ND = 18500;
const DEFAULT_CERT_FEE_HND = 28500;
const DEFAULT_CONVOCATION_FEE = 15500;
const DEFAULT_INCIDENTAL_FEE = 5500;
const DEFAULT_PROCESSING_FEE = 4000;

export async function getDynamicAlumniFees() {
    let certificateFeeND = DEFAULT_CERT_FEE_ND;
    let certificateFeeHND = DEFAULT_CERT_FEE_HND;
    let convocationFee = DEFAULT_CONVOCATION_FEE;
    let incidentalFee = DEFAULT_INCIDENTAL_FEE;
    let processingFee = DEFAULT_PROCESSING_FEE;

    try {
        const items = await db.select().from(feeItems).where(
            or(
                eq(feeItems.name, 'Certificate Fee (ND)'),
                eq(feeItems.name, 'Certificate Fee (HND)'),
                eq(feeItems.name, 'Convocation Fee'),
                eq(feeItems.name, 'Incidental Fee')
            )
        );

        for (const item of items) {
            const amt = Number(item.defaultAmount) || 0;
            if (amt <= 0) continue;
            if (item.name === 'Certificate Fee (ND)') certificateFeeND = amt;
            else if (item.name === 'Certificate Fee (HND)') certificateFeeHND = amt;
            else if (item.name === 'Convocation Fee') convocationFee = amt;
            else if (item.name === 'Incidental Fee') incidentalFee = amt;
        }
    } catch (e) {
        console.warn("Fallback to default alumni fee items:", e);
    }

    try {
        const processingRule = await db
            .select()
            .from(processingFeeRules)
            .where(eq(processingFeeRules.serviceType, 'CERTIFICATE_REQUEST'))
            .limit(1);
        if (processingRule.length > 0 && processingRule[0].isActive && Number(processingRule[0].amount) > 0) {
            processingFee = Number(processingRule[0].amount);
        } else {
            const pFeeStr = await getSettingByKey('transcript_processing_fee');
            if (pFeeStr !== null && !isNaN(parseInt(pFeeStr))) {
                processingFee = parseInt(pFeeStr);
            }
        }
    } catch (e) {
        // Fallback if processing_fee_rules table is not accessible
        try {
            const pFeeStr = await getSettingByKey('transcript_processing_fee');
            if (pFeeStr !== null && !isNaN(parseInt(pFeeStr))) {
                processingFee = parseInt(pFeeStr);
            }
        } catch {}
    }

    return {
        certificateFeeND,
        certificateFeeHND,
        convocationFee,
        incidentalFee,
        processingFee,
    };
}

export async function submitCertificateApplication(data: {
    applicantName: string;
    matricNumber: string;
    email: string;
    phone: string;
    programmeType: "ND" | "HND";
    department: string;
    yearOfGraduation: string;
    deliveryMethod: "email" | "courier" | "pickup";
    deliveryAddress: string;
}) {
    try {
        const fees = await getDynamicAlumniFees();
        const certificateFee = data.programmeType === "HND" ? fees.certificateFeeHND : fees.certificateFeeND;
        const institutionalFee = certificateFee + fees.convocationFee + fees.incidentalFee;
        const processingFee = fees.processingFee;

        if (institutionalFee === 0 && processingFee === 0) {
            const [result] = await db.insert(alumniCertificateRequests).values({
                ...data,
                convocationFeeRef: 'FREE-BYPASS',
                processingFeeRef: 'FREE-BYPASS',
                convocationFeeStatus: 'paid',
                processingFeeStatus: 'paid',
                paymentStatus: 'paid',
                approvalStatus: 'pending'
            });
            return { success: true, url: '/alumni/certificate/verify?ref=FREE-BYPASS', requestId: result.insertId };
        }

        const alatRef = `ALUMNI-ALAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const [result] = await db.insert(alumniCertificateRequests).values({
            ...data,
            convocationFeeRef: alatRef,
            convocationFeeStatus: institutionalFee === 0 ? 'paid' : 'unpaid',
            processingFeeStatus: processingFee === 0 ? 'paid' : 'unpaid',
            paymentStatus: 'unpaid',
            approvalStatus: 'pending'
        });

        const insertId = result.insertId;
        
        // If institutional fee is 0 but processing fee is > 0, skip to paystack
        if (institutionalFee === 0) {
             const paystackRef = `ALUMNI-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
             await db.update(alumniCertificateRequests).set({ processingFeeRef: paystackRef }).where(eq(alumniCertificateRequests.id, insertId));
             const initRes = await initiatePayment(paystackRef, processingFee, 'paystack', data.email, data.applicantName, '');
             if (initRes.error) {
                 return { success: false, error: initRes.error };
             }
             return { success: true, url: initRes.paymentUrl, requestId: insertId };
        }

        // Initialize ALATPay (Step 1: Certificate + Convocation + Incidental Fee)
        const initRes = await initiatePayment(alatRef, institutionalFee, 'alatpay', data.email, data.applicantName, '');
        if (initRes.error) {
            return { success: false, error: initRes.error };
        }

        return { success: true, url: initRes.paymentUrl, requestId: insertId };
    } catch (error: any) {
        console.error("Certificate request error:", error);
        return { success: false, error: error.message || "Failed to submit request." };
    }
}

export async function verifyCertificatePayment(reference: string) {
    try {
        const [request] = await db.select().from(alumniCertificateRequests).where(
            or(
                eq(alumniCertificateRequests.convocationFeeRef, reference),
                eq(alumniCertificateRequests.processingFeeRef, reference)
            )
        ).limit(1);

        if (!request) return { success: false, error: "Request not found for this reference" };

        const { processingFee } = await getDynamicAlumniFees();

        // If ALATPay just finished
        if (request.convocationFeeRef === reference && request.convocationFeeStatus === 'unpaid') {
            await db.update(alumniCertificateRequests).set({
                convocationFeeStatus: 'paid',
                paymentStatus: processingFee === 0 ? 'paid' : 'partial'
            }).where(eq(alumniCertificateRequests.id, request.id));

            // If there is a processing fee, initialize Paystack now
            if (processingFee > 0) {
                const paystackRef = `ALUMNI-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                await db.update(alumniCertificateRequests).set({ processingFeeRef: paystackRef }).where(eq(alumniCertificateRequests.id, request.id));
                const initRes = await initiatePayment(paystackRef, processingFee, 'paystack', request.email, request.applicantName, '');
                if (initRes.error) {
                    return { success: false, error: "Failed to init Paystack: " + initRes.error };
                }
                return { success: true, nextPaymentUrl: initRes.paymentUrl };
            }

            return { success: true, message: "Payment complete", fullyPaid: true };
        }

        // If Paystack just finished
        if (request.processingFeeRef === reference && request.processingFeeStatus === 'unpaid') {
            await db.update(alumniCertificateRequests).set({
                processingFeeStatus: 'paid',
                paymentStatus: 'paid'
            }).where(eq(alumniCertificateRequests.id, request.id));
            
            return { success: true, message: "Payment complete", fullyPaid: true };
        }

        return { success: true, message: "Already verified", fullyPaid: request.paymentStatus === 'paid' };
    } catch (error: any) {
        console.error("verifyCertificatePayment error:", error);
        return { success: false, error: "Verification failed" };
    }
}

export async function getAlumniRequests() {
    try {
        const requests = await db.select().from(alumniCertificateRequests).orderBy(desc(alumniCertificateRequests.createdAt));
        return { success: true, data: requests };
    } catch (error) {
        console.error("Failed to fetch alumni requests:", error);
        return { success: false, error: "Failed to fetch alumni requests." };
    }
}

export async function updateAlumniRequestStatus(id: number, status: "pending" | "approved" | "fulfilled" | "rejected") {
    try {
        await db.update(alumniCertificateRequests).set({ approvalStatus: status }).where(eq(alumniCertificateRequests.id, id));
        return { success: true, message: "Status updated successfully." };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: "Failed to update status." };
    }
}
