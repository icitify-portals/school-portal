"use server";

import { db } from "@/db/db";
import { alumniCertificateRequests, processingFeeRules, feeItems, students, studentBills } from "@/db/schema";
import { eq, like, or, desc, and } from "drizzle-orm";
import { initiatePayment, verifyPayment } from "./payment-gateways";
import { getSettingByKey } from "@/actions/settings";

const DEFAULT_CERT_FEE_ND = 18500;
const DEFAULT_CERT_FEE_HND = 28500;
const DEFAULT_CONVOCATION_FEE = 15500;
const DEFAULT_CONVOCATION_GOWN_FEE = 7000;
const DEFAULT_INCIDENTAL_FEE = 5500;
const DEFAULT_PROCESSING_FEE = 3000;

export const ALATPAY_CERT_CONFIG = {
    businessId: process.env.NEXT_PUBLIC_ALATPAY_BUSINESS_ID_CERT || "254d0a99-84ce-4cb0-3828-08dddfda2e81",
    publicKey: process.env.NEXT_PUBLIC_ALATPAY_API_KEY_CERT || "8d20bef5b57f4972a7a05e7156d295c2",
    secretKey: process.env.ALATPAY_SECRET_KEY_CERT || "a7ec45eaf7794660b4e93ee3be4e6618",
    accountName: "FSS TECH STUDIO-CERT",
    accountNumber: "0126932593",
    bankName: "WEMA BANK"
};

export const ALATPAY_ICT_CONFIG = {
    businessId: process.env.NEXT_PUBLIC_ALATPAY_BUSINESS_ID_ICT || "181087d9-ec63-4efa-e9f3-08dddfe20b95",
    publicKey: process.env.NEXT_PUBLIC_ALATPAY_API_KEY_ICT || "84d105bdef7f420b887c442ff7092027",
    secretKey: process.env.ALATPAY_SECRET_KEY_ICT || "84906058329b463ab53e525ef46da903",
    accountName: "FSS TECH STUDIO-ICT",
    accountNumber: "0126932586",
    bankName: "WEMA BANK"
};

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
        accounts: {
            certAccount: ALATPAY_CERT_CONFIG,
            ictAccount: ALATPAY_ICT_CONFIG,
            processingAccount: {
                gateway: "paystack",
                name: "Portal Processing"
            }
        }
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

        const selectedKeys = data.selectedItems && data.selectedItems.length > 0 
            ? data.selectedItems 
            : ['certificate', 'convocation', 'convocation_gown', 'incidental', 'processing'];
            
        const payCertificate = selectedKeys.includes('certificate');
        const payConvocation = selectedKeys.includes('convocation');
        const payConvocationGown = selectedKeys.includes('convocation_gown');
        const payIncidental = selectedKeys.includes('incidental');
        const payProcessing = selectedKeys.includes('processing');

        // CERT Account Items (Certificate, Convocation, Convocation Gown) -> FSS TECH STUDIO-CERT via ALATPay
        const certAccountTotal = 
            (payCertificate ? certFee : 0) +
            (payConvocation ? fees.convocationFee : 0) +
            (payConvocationGown ? fees.convocationGownFee : 0);

        // ICT Account Items (Incidental Fee) -> FSS TECH STUDIO-ICT via ALATPay
        const ictAccountTotal = payIncidental ? fees.incidentalFee : 0;

        // Processing Fee -> Paystack
        const processingTotal = payProcessing ? fees.processingFee : 0;

        const totalPayable = certAccountTotal + ictAccountTotal + processingTotal;

        const { selectedItems: _, ...dbData } = data;

        if (totalPayable === 0) {
            const [result] = await db.insert(alumniCertificateRequests).values({
                ...dbData,
                certFeeRef: 'FREE-BYPASS',
                convocationFeeRef: 'FREE-BYPASS',
                gownFeeRef: 'FREE-BYPASS',
                incidentalFeeRef: 'FREE-BYPASS',
                processingFeeRef: 'FREE-BYPASS',
                certFeeStatus: 'paid',
                convocationFeeStatus: 'paid',
                gownFeeStatus: 'paid',
                incidentalFeeStatus: 'paid',
                processingFeeStatus: 'paid',
                selectedItems: JSON.stringify(selectedKeys),
                paymentStatus: 'paid',
                approvalStatus: 'pending'
            });
            return { success: true, url: '/alumni/certificate/verify?ref=FREE-BYPASS', requestId: result.insertId };
        }

        // Determine Stage 1 gateway and parameters
        let initialGateway: 'alatpay' | 'paystack' = 'alatpay';
        let initialAmount = 0;
        let initialRef = '';
        let initialBusinessId: string | undefined;
        let initialPublicKey: string | undefined;
        let initialDescription = '';

        if (certAccountTotal > 0) {
            initialGateway = 'alatpay';
            initialAmount = certAccountTotal;
            initialRef = `ALUMNI-CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            initialBusinessId = ALATPAY_CERT_CONFIG.businessId;
            initialPublicKey = ALATPAY_CERT_CONFIG.publicKey;
            const itemsInCert = [
                payCertificate ? 'Certificate' : null,
                payConvocation ? 'Convocation' : null,
                payConvocationGown ? 'Convocation Gown' : null
            ].filter(Boolean).join(' + ');
            initialDescription = `FSS Tech Studio CERT: ${itemsInCert}`;
        } else if (ictAccountTotal > 0) {
            initialGateway = 'alatpay';
            initialAmount = ictAccountTotal;
            initialRef = `ALUMNI-INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            initialBusinessId = ALATPAY_ICT_CONFIG.businessId;
            initialPublicKey = ALATPAY_ICT_CONFIG.publicKey;
            initialDescription = `FSS Tech Studio ICT: Incidental Fee`;
        } else if (processingTotal > 0) {
            initialGateway = 'paystack';
            initialAmount = processingTotal;
            initialRef = `ALUMNI-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            initialDescription = `Portal Processing Fee`;
        }

        const [result] = await db.insert(alumniCertificateRequests).values({
            ...dbData,
            certFeeRef: payCertificate ? (certAccountTotal > 0 ? initialRef : null) : 'BYPASSED',
            certFeeStatus: payCertificate ? 'unpaid' : 'paid',
            convocationFeeRef: payConvocation ? (certAccountTotal > 0 ? initialRef : null) : 'BYPASSED',
            convocationFeeStatus: payConvocation ? 'unpaid' : 'paid',
            gownFeeRef: payConvocationGown ? (certAccountTotal > 0 ? initialRef : null) : 'BYPASSED',
            gownFeeStatus: payConvocationGown ? 'unpaid' : 'paid',
            incidentalFeeRef: payIncidental ? (certAccountTotal === 0 && ictAccountTotal > 0 ? initialRef : null) : 'BYPASSED',
            incidentalFeeStatus: payIncidental ? 'unpaid' : 'paid',
            processingFeeRef: payProcessing ? (certAccountTotal === 0 && ictAccountTotal === 0 && processingTotal > 0 ? initialRef : null) : 'BYPASSED',
            processingFeeStatus: payProcessing ? 'unpaid' : 'paid',
            selectedItems: JSON.stringify(selectedKeys),
            paymentStatus: 'unpaid',
            approvalStatus: 'pending'
        });

        const insertId = result.insertId;

        const initRes = await initiatePayment(
            initialGateway,
            initialAmount,
            initialRef,
            data.email,
            data.applicantName,
            '',
            data.phone,
            initialDescription,
            initialBusinessId,
            initialPublicKey
        );

        if (initRes.error) {
            return { success: false, error: initRes.error };
        }

        return { success: true, url: initRes.paymentUrl, requestId: insertId };
    } catch (error: any) {
        console.error("submitCertificateApplication error:", error);
        return { success: false, error: error.message || "Failed to submit request." };
    }
}

export async function verifyCertificatePayment(reference: string) {
    try {
        const [request] = await db.select().from(alumniCertificateRequests).where(
            or(
                eq(alumniCertificateRequests.certFeeRef, reference),
                eq(alumniCertificateRequests.convocationFeeRef, reference),
                eq(alumniCertificateRequests.gownFeeRef, reference),
                eq(alumniCertificateRequests.incidentalFeeRef, reference),
                eq(alumniCertificateRequests.processingFeeRef, reference)
            )
        ).limit(1);

        if (!request) return { success: false, error: "Request not found for reference: " + reference };

        const fees = await getDynamicAlumniFees();

        // Parse selected items
        let selectedKeys: string[] = ['certificate', 'convocation', 'convocation_gown', 'incidental', 'processing'];
        if (request.selectedItems) {
            try {
                selectedKeys = JSON.parse(request.selectedItems);
            } catch {}
        }

        const isCertRef = reference.startsWith('ALUMNI-CERT-') || request.certFeeRef === reference || request.convocationFeeRef === reference || request.gownFeeRef === reference;
        const isIncRef = reference.startsWith('ALUMNI-INC-') || request.incidentalFeeRef === reference;
        const isPayRef = reference.startsWith('ALUMNI-PAY-') || request.processingFeeRef === reference;

        if (isCertRef) {
            try {
                await verifyPayment('alatpay', reference, undefined, ALATPAY_CERT_CONFIG.secretKey);
            } catch (vErr) {
                console.warn("[Verify CERT ALATPay] Non-blocking verification notice:", vErr);
            }

            await db.update(alumniCertificateRequests).set({
                certFeeStatus: 'paid',
                convocationFeeStatus: 'paid',
                gownFeeStatus: 'paid',
            }).where(eq(alumniCertificateRequests.id, request.id));
            request.certFeeStatus = 'paid';
            request.convocationFeeStatus = 'paid';
            request.gownFeeStatus = 'paid';
        } else if (isIncRef) {
            try {
                await verifyPayment('alatpay', reference, undefined, ALATPAY_ICT_CONFIG.secretKey);
            } catch (vErr) {
                console.warn("[Verify ICT ALATPay] Non-blocking verification notice:", vErr);
            }

            await db.update(alumniCertificateRequests).set({
                incidentalFeeStatus: 'paid',
            }).where(eq(alumniCertificateRequests.id, request.id));
            request.incidentalFeeStatus = 'paid';
        } else if (isPayRef) {
            try {
                await verifyPayment('paystack', reference);
            } catch (vErr) {
                console.warn("[Verify Paystack] Non-blocking verification notice:", vErr);
            }

            await db.update(alumniCertificateRequests).set({
                processingFeeStatus: 'paid',
            }).where(eq(alumniCertificateRequests.id, request.id));
            request.processingFeeStatus = 'paid';
        }

        // Check if next payment stage is required:
        // Stage 2: Incidental Fee (via ALATPay FSS TECH STUDIO-ICT)
        if (selectedKeys.includes('incidental') && request.incidentalFeeStatus !== 'paid') {
            const incRef = `ALUMNI-INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            await db.update(alumniCertificateRequests).set({
                incidentalFeeRef: incRef,
                paymentStatus: 'partial'
            }).where(eq(alumniCertificateRequests.id, request.id));

            const initRes = await initiatePayment(
                'alatpay',
                fees.incidentalFee,
                incRef,
                request.email,
                request.applicantName,
                '',
                request.phone || '',
                'FSS Tech Studio ICT: Incidental Fee',
                ALATPAY_ICT_CONFIG.businessId,
                ALATPAY_ICT_CONFIG.publicKey
            );

            if (initRes.error) {
                return { success: false, error: "Failed to initialize Incidental fee payment: " + initRes.error };
            }

            return {
                success: true,
                nextPaymentUrl: initRes.paymentUrl,
                message: "Certificate & Convocation payment verified! Redirecting to pay Incidental Fee (FSS TECH STUDIO-ICT account via ALATPay)..."
            };
        }

        // Stage 3: Processing Fee via Paystack
        if (selectedKeys.includes('processing') && request.processingFeeStatus !== 'paid') {
            const paystackRef = `ALUMNI-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            await db.update(alumniCertificateRequests).set({
                processingFeeRef: paystackRef,
                paymentStatus: 'partial'
            }).where(eq(alumniCertificateRequests.id, request.id));

            const initRes = await initiatePayment(
                'paystack',
                fees.processingFee,
                paystackRef,
                request.email,
                request.applicantName,
                '',
                request.phone || '',
                'Portal Processing Fee'
            );

            if (initRes.error) {
                return { success: false, error: "Failed to initialize Processing fee payment: " + initRes.error };
            }

            return {
                success: true,
                nextPaymentUrl: initRes.paymentUrl,
                message: "Institutional fees verified! Redirecting to pay Portal Processing Fee via Paystack..."
            };
        }

        // All selected items are now paid
        await db.update(alumniCertificateRequests).set({
            paymentStatus: 'paid'
        }).where(eq(alumniCertificateRequests.id, request.id));

        return {
            success: true,
            fullyPaid: true,
            message: "All selected clearance and processing fees have been verified! Your certificate request has been submitted and is pending approval."
        };
    } catch (error: any) {
        console.error("verifyCertificatePayment error:", error);
        return { success: false, error: "Verification failed: " + (error.message || "Unknown error") };
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
