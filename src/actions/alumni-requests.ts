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

// Internal configuration constants (NOT exported because "use server" files can only export async functions)
const ALATPAY_CERT_CONFIG = {
    businessId: process.env.NEXT_PUBLIC_ALATPAY_BUSINESS_ID_CERT || "254d0a99-84ce-4cb0-3828-08dddfda2e81",
    publicKey: process.env.NEXT_PUBLIC_ALATPAY_API_KEY_CERT || "8d20bef5b57f4972a7a05e7156d295c2",
    secretKey: process.env.ALATPAY_SECRET_KEY_CERT || "a7ec45eaf7794660b4e93ee3be4e6618",
    accountName: "FSS TECH STUDIO-CERT",
    accountNumber: "0126932593",
    bankName: "WEMA BANK"
};

const ALATPAY_ICT_CONFIG = {
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
            certAccount: {
                name: ALATPAY_CERT_CONFIG.accountName,
                accountNumber: ALATPAY_CERT_CONFIG.accountNumber,
                bankName: ALATPAY_CERT_CONFIG.bankName,
                gateway: "alatpay"
            },
            ictAccount: {
                name: ALATPAY_ICT_CONFIG.accountName,
                accountNumber: ALATPAY_ICT_CONFIG.accountNumber,
                bankName: ALATPAY_ICT_CONFIG.bankName,
                gateway: "alatpay"
            },
            processingAccount: {
                name: "Portal Processing",
                gateway: "paystack"
            }
        }
    };
}

export async function getStudentCertificateStatus(matricNumber: string) {
    try {
        const cleanMatric = matricNumber.trim().toUpperCase();
        const [existing] = await db.select().from(alumniCertificateRequests).where(
            eq(alumniCertificateRequests.matricNumber, cleanMatric)
        ).orderBy(desc(alumniCertificateRequests.id)).limit(1);

        if (!existing) return { found: false };

        return {
            found: true,
            id: existing.id,
            applicantName: existing.applicantName,
            programmeType: existing.programmeType,
            certFeeStatus: existing.certFeeStatus,
            convocationFeeStatus: existing.convocationFeeStatus,
            gownFeeStatus: existing.gownFeeStatus,
            incidentalFeeStatus: existing.incidentalFeeStatus,
            processingFeeStatus: existing.processingFeeStatus,
            paymentStatus: existing.paymentStatus,
            approvalStatus: existing.approvalStatus
        };
    } catch (err: any) {
        console.error("getStudentCertificateStatus error:", err);
        return { found: false, error: err.message };
    }
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
    category: 'cert_account' | 'ict_account' | 'processing';
    selectedItems?: string[];
}) {
    try {
        const fees = await getDynamicAlumniFees();
        const certFee = data.programmeType === "HND" ? fees.certificateFeeHND : fees.certificateFeeND;

        const category = data.category || 'cert_account';
        let amount = 0;
        let gateway: 'alatpay' | 'paystack' = 'alatpay';
        let reference = '';
        let targetBusinessId: string | undefined;
        let targetPublicKey: string | undefined;
        let description = '';
        const selectedKeys = data.selectedItems || [];

        if (category === 'cert_account') {
            // FSS TECH STUDIO-CERT (ALATPay)
            gateway = 'alatpay';
            targetBusinessId = ALATPAY_CERT_CONFIG.businessId;
            targetPublicKey = ALATPAY_CERT_CONFIG.publicKey;
            
            const payCert = selectedKeys.includes('certificate');
            const payConv = selectedKeys.includes('convocation');
            const payGown = selectedKeys.includes('convocation_gown');

            if (payCert) amount += certFee;
            if (payConv) amount += fees.convocationFee;
            if (payGown) amount += fees.convocationGownFee;

            if (amount === 0) {
                // If none explicitly passed, default to gown or cert
                amount = fees.convocationGownFee;
            }

            reference = `ALUMNI-CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const itemsList = [
                payCert ? 'Certificate' : null,
                payConv ? 'Convocation' : null,
                payGown ? 'Convocation Gown' : null
            ].filter(Boolean).join(', ') || 'Academic Fees';
            description = `FSS TECH STUDIO-CERT: ${itemsList}`;

        } else if (category === 'ict_account') {
            // FSS TECH STUDIO-ICT (ALATPay)
            gateway = 'alatpay';
            targetBusinessId = ALATPAY_ICT_CONFIG.businessId;
            targetPublicKey = ALATPAY_ICT_CONFIG.publicKey;
            amount = fees.incidentalFee;
            reference = `ALUMNI-INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            description = `FSS TECH STUDIO-ICT: Incidental Fee`;

        } else if (category === 'processing') {
            // Portal Processing (Paystack)
            gateway = 'paystack';
            amount = fees.processingFee;
            reference = `ALUMNI-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            description = `Portal Processing Fee`;
        }

        // Clean up data for insert
        const { selectedItems: _, category: __, ...dbData } = data;

        // Check if student already has a request record by matric
        const cleanMatric = data.matricNumber.trim().toUpperCase();
        const [existing] = await db.select().from(alumniCertificateRequests).where(
            eq(alumniCertificateRequests.matricNumber, cleanMatric)
        ).orderBy(desc(alumniCertificateRequests.id)).limit(1);

        let requestId = existing?.id;

        if (existing) {
            // Update the existing request with this category's new reference
            const updatePayload: Record<string, any> = {
                applicantName: data.applicantName,
                email: data.email,
                phone: data.phone,
                department: data.department,
                yearOfGraduation: data.yearOfGraduation,
                deliveryMethod: data.deliveryMethod,
                deliveryAddress: data.deliveryAddress
            };

            if (category === 'cert_account') {
                if (selectedKeys.includes('certificate')) updatePayload.certFeeRef = reference;
                if (selectedKeys.includes('convocation')) updatePayload.convocationFeeRef = reference;
                if (selectedKeys.includes('convocation_gown')) updatePayload.gownFeeRef = reference;
            } else if (category === 'ict_account') {
                updatePayload.incidentalFeeRef = reference;
            } else if (category === 'processing') {
                updatePayload.processingFeeRef = reference;
            }

            await db.update(alumniCertificateRequests).set(updatePayload).where(eq(alumniCertificateRequests.id, existing.id));
        } else {
            // Create a new request record
            const insertPayload: Record<string, any> = {
                ...dbData,
                matricNumber: cleanMatric,
                certFeeRef: (category === 'cert_account' && selectedKeys.includes('certificate')) ? reference : null,
                convocationFeeRef: (category === 'cert_account' && selectedKeys.includes('convocation')) ? reference : null,
                gownFeeRef: (category === 'cert_account' && selectedKeys.includes('convocation_gown')) ? reference : null,
                incidentalFeeRef: category === 'ict_account' ? reference : null,
                processingFeeRef: category === 'processing' ? reference : null,
                selectedItems: JSON.stringify(selectedKeys),
                paymentStatus: 'unpaid',
                approvalStatus: 'pending'
            };

            const [result] = await db.insert(alumniCertificateRequests).values(insertPayload as any);
            requestId = result.insertId;
        }

        const initRes = await initiatePayment(
            gateway,
            amount,
            reference,
            data.email,
            data.applicantName,
            '',
            data.phone,
            description,
            targetBusinessId,
            targetPublicKey
        );

        if (initRes.error) {
            return { success: false, error: initRes.error };
        }

        return { success: true, url: initRes.paymentUrl, requestId };
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

        const isCertRef = reference.startsWith('ALUMNI-CERT-') || request.certFeeRef === reference || request.convocationFeeRef === reference || request.gownFeeRef === reference;
        const isIncRef = reference.startsWith('ALUMNI-INC-') || request.incidentalFeeRef === reference;
        const isPayRef = reference.startsWith('ALUMNI-PAY-') || request.processingFeeRef === reference;

        let categoryPaidName = "";

        if (isCertRef) {
            categoryPaidName = "FSS TECH STUDIO-CERT (Academic & Convocation)";
            try {
                await verifyPayment('alatpay', reference, undefined, ALATPAY_CERT_CONFIG.secretKey);
            } catch (vErr) {
                console.warn("[Verify CERT ALATPay] Notice:", vErr);
            }

            const updateFields: Record<string, any> = {};
            if (request.certFeeRef === reference) updateFields.certFeeStatus = 'paid';
            if (request.convocationFeeRef === reference) updateFields.convocationFeeStatus = 'paid';
            if (request.gownFeeRef === reference) updateFields.gownFeeStatus = 'paid';

            // If reference doesn't match specific column but is ALUMNI-CERT, mark whatever was unpaid in that category
            if (Object.keys(updateFields).length === 0) {
                updateFields.gownFeeStatus = 'paid';
                updateFields.convocationFeeStatus = 'paid';
                updateFields.certFeeStatus = 'paid';
            }

            await db.update(alumniCertificateRequests).set(updateFields).where(eq(alumniCertificateRequests.id, request.id));
            if (updateFields.certFeeStatus) request.certFeeStatus = 'paid';
            if (updateFields.convocationFeeStatus) request.convocationFeeStatus = 'paid';
            if (updateFields.gownFeeStatus) request.gownFeeStatus = 'paid';

        } else if (isIncRef) {
            categoryPaidName = "FSS TECH STUDIO-ICT (Compulsory Incidental Fee)";
            try {
                await verifyPayment('alatpay', reference, undefined, ALATPAY_ICT_CONFIG.secretKey);
            } catch (vErr) {
                console.warn("[Verify ICT ALATPay] Notice:", vErr);
            }

            await db.update(alumniCertificateRequests).set({
                incidentalFeeStatus: 'paid',
            }).where(eq(alumniCertificateRequests.id, request.id));
            request.incidentalFeeStatus = 'paid';

        } else if (isPayRef) {
            categoryPaidName = "Portal Processing Fee (Paystack)";
            try {
                await verifyPayment('paystack', reference);
            } catch (vErr) {
                console.warn("[Verify Paystack] Notice:", vErr);
            }

            await db.update(alumniCertificateRequests).set({
                processingFeeStatus: 'paid',
            }).where(eq(alumniCertificateRequests.id, request.id));
            request.processingFeeStatus = 'paid';
        }

        // Check if all fees are now paid
        const allCompulsoryPaid = 
            request.gownFeeStatus === 'paid' && 
            request.convocationFeeStatus === 'paid' && 
            request.certFeeStatus === 'paid' && 
            request.incidentalFeeStatus === 'paid';

        await db.update(alumniCertificateRequests).set({
            paymentStatus: allCompulsoryPaid ? 'paid' : 'partial'
        }).where(eq(alumniCertificateRequests.id, request.id));

        return {
            success: true,
            verified: true,
            categoryPaidName,
            allCompulsoryPaid,
            message: `Payment of ₦ successfully credited to ${categoryPaidName}! Your clearance record has been updated.`
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
