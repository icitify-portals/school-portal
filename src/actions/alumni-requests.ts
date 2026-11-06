"use server";

import { db } from "@/db/db";
import { alumniCertificateRequests, processingFeeRules, feeItems, students, studentBills } from "@/db/schema";
import { eq, like, or, desc, and } from "drizzle-orm";
import { initiatePayment } from "./payment-gateways";
import { getSettingByKey } from "@/actions/settings";

const DEFAULT_CERT_FEE_ND = 18500;
const DEFAULT_CERT_FEE_HND = 28500;
const DEFAULT_CONVOCATION_FEE = 15500;
const DEFAULT_CONVOCATION_GOWN_FEE = 7000;
const DEFAULT_INCIDENTAL_FEE = 5500;
const DEFAULT_PROCESSING_FEE = 3000;

export async function getDynamicAlumniFees() {
    let certificateFeeND = DEFAULT_CERT_FEE_ND;
    let certificateFeeHND = DEFAULT_CERT_FEE_HND;
    let convocationFee = DEFAULT_CONVOCATION_FEE;
    let convocationGownFee = DEFAULT_CONVOCATION_GOWN_FEE;
    let incidentalFee = DEFAULT_INCIDENTAL_FEE;
    let processingFee = DEFAULT_PROCESSING_FEE;

    try {
        const items = await db.select().from(feeItems).where(
            or(
                eq(feeItems.name, 'Certificate Fee (ND)'),
                eq(feeItems.name, 'Certificate Fee (HND)'),
                eq(feeItems.name, 'Convocation Fee'),
                eq(feeItems.name, 'Convocation Gown Fee'),
                eq(feeItems.name, 'Incidental Fee')
            )
        );

        for (const item of items) {
            const amt = Number(item.defaultAmount) || 0;
            if (amt <= 0) continue;
            if (item.name === 'Certificate Fee (ND)') certificateFeeND = amt;
            else if (item.name === 'Certificate Fee (HND)') certificateFeeHND = amt;
            else if (item.name === 'Convocation Fee') convocationFee = amt;
            else if (item.name === 'Convocation Gown Fee') convocationGownFee = amt;
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
            const ruleAmt = Number(processingRule[0].amount);
            processingFee = (ruleAmt === 4000 || ruleAmt === 5000) ? DEFAULT_PROCESSING_FEE : ruleAmt;
        } else {
            const pFeeStr = await getSettingByKey('transcript_processing_fee');
            if (pFeeStr !== null && !isNaN(parseInt(pFeeStr))) {
                const parsed = parseInt(pFeeStr);
                processingFee = (parsed === 4000 || parsed === 5000) ? DEFAULT_PROCESSING_FEE : parsed;
            }
        }
    } catch (e) {
        // Fallback if processing_fee_rules table is not accessible
        try {
            const pFeeStr = await getSettingByKey('transcript_processing_fee');
            if (pFeeStr !== null && !isNaN(parseInt(pFeeStr))) {
                const parsed = parseInt(pFeeStr);
                processingFee = (parsed === 4000 || parsed === 5000) ? DEFAULT_PROCESSING_FEE : parsed;
            }
        } catch {}
    }

    return {
        certificateFeeND,
        certificateFeeHND,
        convocationFee,
        convocationGownFee,
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
    selectedItems?: string[];
}) {
    try {
        const fees = await getDynamicAlumniFees();
        const certFee = data.programmeType === "HND" ? fees.certificateFeeHND : fees.certificateFeeND;

        const payCertificate = !data.selectedItems || data.selectedItems.includes('certificate');
        const payConvocation = !data.selectedItems || data.selectedItems.includes('convocation');
        const payConvocationGown = !data.selectedItems || data.selectedItems.includes('convocation_gown');
        const payIncidental = !data.selectedItems || data.selectedItems.includes('incidental');
        const payProcessing = !data.selectedItems || data.selectedItems.includes('processing');

        const institutionalFee = (payCertificate ? certFee : 0) +
            (payConvocation ? fees.convocationFee : 0) +
            (payConvocationGown ? fees.convocationGownFee : 0) +
            (payIncidental ? fees.incidentalFee : 0);
        const processingFee = payProcessing ? fees.processingFee : 0;
        const totalFee = institutionalFee + processingFee;

        // Clean up data for insert (omit selectedItems from db values)
        const { selectedItems: _, ...dbData } = data;

        if (totalFee === 0) {
            const [result] = await db.insert(alumniCertificateRequests).values({
                ...dbData,
                convocationFeeRef: 'FREE-BYPASS',
                processingFeeRef: 'FREE-BYPASS',
                convocationFeeStatus: 'paid',
                processingFeeStatus: 'paid',
                paymentStatus: 'paid',
                approvalStatus: 'pending'
            });
            return { success: true, url: '/alumni/certificate/verify?ref=FREE-BYPASS', requestId: result.insertId };
        }

        // If institutional fee is 0 but processing fee is > 0, bypass ALATPay and initialize Paystack directly
        if (institutionalFee === 0 && processingFee > 0) {
            const paystackRef = `ALUMNI-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const [result] = await db.insert(alumniCertificateRequests).values({
                ...dbData,
                convocationFeeRef: 'BYPASSED',
                processingFeeRef: paystackRef,
                convocationFeeStatus: 'paid',
                processingFeeStatus: 'unpaid',
                paymentStatus: 'unpaid',
                approvalStatus: 'pending'
            });
            const insertId = result.insertId;
            const initRes = await initiatePayment('paystack', processingFee, paystackRef, data.email, data.applicantName, '');
            if (initRes.error) {
                return { success: false, error: initRes.error };
            }
            return { success: true, url: initRes.paymentUrl, requestId: insertId };
        }

        const alatRef = `ALUMNI-ALAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const [result] = await db.insert(alumniCertificateRequests).values({
            ...dbData,
            convocationFeeRef: alatRef,
            convocationFeeStatus: 'unpaid',
            processingFeeStatus: processingFee === 0 ? 'paid' : 'unpaid',
            paymentStatus: 'unpaid',
            approvalStatus: 'pending'
        });

        const insertId = result.insertId;

        // Initialize ALATPay (Step 1: Selected Institutional Fees)
        const initRes = await initiatePayment('alatpay', institutionalFee, alatRef, data.email, data.applicantName, '');
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

        // If ALATPay just finished
        if (request.convocationFeeRef === reference && request.convocationFeeStatus === 'unpaid') {
            const isProcessingAlreadyPaid = request.processingFeeStatus === 'paid';

            await db.update(alumniCertificateRequests).set({
                convocationFeeStatus: 'paid',
                paymentStatus: isProcessingAlreadyPaid ? 'paid' : 'partial'
            }).where(eq(alumniCertificateRequests.id, request.id));

            // If there is an unpaid processing fee, initialize Paystack now
            if (!isProcessingAlreadyPaid) {
                const { processingFee } = await getDynamicAlumniFees();
                if (processingFee > 0) {
                    const paystackRef = `ALUMNI-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    await db.update(alumniCertificateRequests).set({ processingFeeRef: paystackRef }).where(eq(alumniCertificateRequests.id, request.id));
                    const initRes = await initiatePayment('paystack', processingFee, paystackRef, request.email, request.applicantName, '');
                    if (initRes.error) {
                        return { success: false, error: "Failed to init Paystack: " + initRes.error };
                    }
                    return { success: true, nextPaymentUrl: initRes.paymentUrl };
                }
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
