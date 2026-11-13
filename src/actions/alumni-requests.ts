"use server";

import { db } from "@/db/db";
import { alumniCertificateRequests, processingFeeRules, feeItems, students, studentBills, users, transactions, payment_transactions, departments, programmes } from "@/db/schema";
import { eq, like, or, desc, and, sql } from "drizzle-orm";
import { initiatePayment, verifyPayment } from "./payment-gateways";
import { getSettingByKey } from "@/actions/settings";
import bcrypt from "bcryptjs";
import { amountInWords } from "@/lib/numberToWords";

const DEFAULT_CERT_FEE_ND = 18500;
const DEFAULT_CERT_FEE_HND = 28500;
const DEFAULT_CONVOCATION_FEE = 15500;
const DEFAULT_CONVOCATION_GOWN_FEE = 12000; // Comprises ₦7,000 Gown Fee + ₦5,000 Refundable Deposit
const DEFAULT_CONVOCATION_GOWN_BASE_FEE = 7000;
const DEFAULT_CONVOCATION_GOWN_REFUNDABLE_DEPOSIT = 5000;
const DEFAULT_INCIDENTAL_FEE = 5500;
const DEFAULT_DEPARTMENTAL_FEE = 10000;
const DEFAULT_LIBRARY_FEE = 10000;
const DEFAULT_PROCESSING_FEE_PER_ITEM = 1000;

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
    let departmentalFee = DEFAULT_DEPARTMENTAL_FEE;
    let libraryFee = DEFAULT_LIBRARY_FEE;
    let processingFeePerItem = DEFAULT_PROCESSING_FEE_PER_ITEM;

    try {
        const items = await db.select().from(feeItems).where(
            or(
                eq(feeItems.name, 'Certificate Fee (ND)'),
                eq(feeItems.name, 'Certificate Fee (HND)'),
                eq(feeItems.name, 'Convocation Fee'),
                eq(feeItems.name, 'Convocation Gown Fee'),
                eq(feeItems.name, 'Incidental Fee'),
                eq(feeItems.name, 'Departmental Development Levy'),
                eq(feeItems.name, 'Library Development Levy')
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
            else if (item.name === 'Departmental Development Levy') departmentalFee = amt;
            else if (item.name === 'Library Development Levy') libraryFee = amt;
        }
    } catch (e) {
        console.warn("Fallback to default alumni fee items:", e);
    }

    return {
        certificateFeeND,
        certificateFeeHND,
        convocationFee,
        convocationGownFee,
        convocationGownBaseFee: DEFAULT_CONVOCATION_GOWN_BASE_FEE,
        convocationGownDeposit: DEFAULT_CONVOCATION_GOWN_REFUNDABLE_DEPOSIT,
        incidentalFee,
        departmentalFee,
        libraryFee,
        processingFeePerItem,
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
        const normLoginId = cleanMatric.replace(/\s+/g, '');
        const slashNorm = normLoginId.replace(/_/g, '/');
        const underNorm = normLoginId.replace(/\//g, '_');

        const [existing] = await db.select().from(alumniCertificateRequests).where(
            or(
                eq(alumniCertificateRequests.matricNumber, cleanMatric),
                eq(alumniCertificateRequests.matricNumber, slashNorm),
                eq(alumniCertificateRequests.matricNumber, underNorm)
            )
        ).orderBy(desc(alumniCertificateRequests.id)).limit(1);

        // Check if a user account exists for this student
        const [studentRec] = await db.select().from(students).where(
            or(
                eq(students.matricNumber, cleanMatric),
                eq(students.matricNumber, slashNorm),
                eq(students.matricNumber, underNorm)
            )
        ).limit(1);

        let userAccountExists = false;
        let matchedUserEmail = existing?.email || "";

        if (studentRec && studentRec.userId) {
            const [u] = await db.select().from(users).where(eq(users.id, studentRec.userId)).limit(1);
            if (u && u.password) {
                userAccountExists = true;
                matchedUserEmail = u.email;
            }
        } else if (existing?.email) {
            const [u] = await db.select().from(users).where(eq(users.email, existing.email.toLowerCase().trim())).limit(1);
            if (u && u.password) {
                userAccountExists = true;
                matchedUserEmail = u.email;
            }
        }

        if (!existing) {
            return { 
                found: false,
                hasUserAccount: userAccountExists,
                userEmail: matchedUserEmail
            };
        }

        return {
            found: true,
            id: existing.id,
            userId: existing.userId || studentRec?.userId || null,
            hasUserAccount: userAccountExists,
            userEmail: matchedUserEmail,
            applicantName: existing.applicantName,
            email: existing.email,
            phone: existing.phone,
            department: existing.department,
            programmeType: existing.programmeType,
            yearOfGraduation: existing.yearOfGraduation,
            certFeeStatus: existing.certFeeStatus,
            convocationFeeStatus: existing.convocationFeeStatus,
            gownFeeStatus: existing.gownFeeStatus,
            incidentalFeeStatus: existing.incidentalFeeStatus,
            departmentalFeeStatus: existing.departmentalFeeStatus,
            libraryFeeStatus: existing.libraryFeeStatus,
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
                amount = fees.convocationGownFee;
            }

            reference = `ALUMNI-CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const itemsList = [
                payGown ? 'Convocation Gown (₦7,000 Gown + ₦5,000 Refundable Deposit)' : null,
                payConv ? 'Convocation' : null,
                payCert ? 'Certificate' : null
            ].filter(Boolean).join(', ') || 'Academic Fees';
            description = `FSS TECH STUDIO-CERT: ${itemsList}`;

        } else if (category === 'ict_account') {
            // FSS TECH STUDIO-ICT (ALATPay)
            // Covers Incidental (5,500), Departmental Levy (10,000), Library Levy (10,000)
            gateway = 'alatpay';
            targetBusinessId = ALATPAY_ICT_CONFIG.businessId;
            targetPublicKey = ALATPAY_ICT_CONFIG.publicKey;

            const payInc = selectedKeys.includes('incidental');
            const payDept = selectedKeys.includes('departmental');
            const payLib = selectedKeys.includes('library');

            if (payInc) amount += fees.incidentalFee;
            if (payDept) amount += fees.departmentalFee;
            if (payLib) amount += fees.libraryFee;

            if (amount === 0) {
                // If none explicitly checked, default to incidental fee
                amount = fees.incidentalFee;
            }

            reference = `ALUMNI-INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const itemsList = [
                payInc ? 'Incidental Fee' : null,
                payDept ? 'Departmental Levy' : null,
                payLib ? 'Library Levy' : null
            ].filter(Boolean).join(', ') || 'Incidental & Development Levies';
            description = `FSS TECH STUDIO-ICT: ${itemsList}`;

        } else if (category === 'processing') {
            // Portal Processing (Paystack) - 1,000 per payment item
            gateway = 'paystack';
            const itemCount = selectedKeys.length > 0 ? selectedKeys.length : 1;
            amount = itemCount * fees.processingFeePerItem;
            reference = `ALUMNI-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            description = `Portal Processing Fee (${itemCount} item${itemCount > 1 ? 's' : ''})`;
        }

        // Clean up data for insert
        const { selectedItems: _, category: __, ...dbData } = data;

        // Check if student already has a request record by matric
        const cleanMatric = data.matricNumber.trim().toUpperCase();
        const normLoginId = cleanMatric.replace(/\s+/g, '');
        const slashNorm = normLoginId.replace(/_/g, '/');
        const underNorm = normLoginId.replace(/\//g, '_');

        const [existing] = await db.select().from(alumniCertificateRequests).where(
            or(
                eq(alumniCertificateRequests.matricNumber, cleanMatric),
                eq(alumniCertificateRequests.matricNumber, slashNorm),
                eq(alumniCertificateRequests.matricNumber, underNorm)
            )
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
                if (selectedKeys.includes('incidental')) updatePayload.incidentalFeeRef = reference;
                if (selectedKeys.includes('departmental')) updatePayload.departmentalFeeRef = reference;
                if (selectedKeys.includes('library')) updatePayload.libraryFeeRef = reference;
            } else if (category === 'processing') {
                updatePayload.processingFeeRef = reference;
            }

            // Append selected items
            let currentItems: string[] = [];
            try {
                if (existing.selectedItems) currentItems = JSON.parse(existing.selectedItems);
            } catch {}
            const combinedItems = Array.from(new Set([...currentItems, ...selectedKeys]));
            updatePayload.selectedItems = JSON.stringify(combinedItems);

            await db.update(alumniCertificateRequests).set(updatePayload).where(eq(alumniCertificateRequests.id, existing.id));
        } else {
            // Create a new request record
            const insertPayload: Record<string, any> = {
                ...dbData,
                matricNumber: cleanMatric,
                certFeeRef: (category === 'cert_account' && selectedKeys.includes('certificate')) ? reference : null,
                convocationFeeRef: (category === 'cert_account' && selectedKeys.includes('convocation')) ? reference : null,
                gownFeeRef: (category === 'cert_account' && selectedKeys.includes('convocation_gown')) ? reference : null,
                incidentalFeeRef: (category === 'ict_account' && selectedKeys.includes('incidental')) ? reference : null,
                departmentalFeeRef: (category === 'ict_account' && selectedKeys.includes('departmental')) ? reference : null,
                libraryFeeRef: (category === 'ict_account' && selectedKeys.includes('library')) ? reference : null,
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
                eq(alumniCertificateRequests.departmentalFeeRef, reference),
                eq(alumniCertificateRequests.libraryFeeRef, reference),
                eq(alumniCertificateRequests.processingFeeRef, reference)
            )
        ).limit(1);

        if (!request) return { success: false, error: "Request not found for reference: " + reference };

        const isCertRef = reference.startsWith('ALUMNI-CERT-') || request.certFeeRef === reference || request.convocationFeeRef === reference || request.gownFeeRef === reference;
        const isIncRef = reference.startsWith('ALUMNI-INC-') || request.incidentalFeeRef === reference || request.departmentalFeeRef === reference || request.libraryFeeRef === reference;
        const isPayRef = reference.startsWith('ALUMNI-PAY-') || request.processingFeeRef === reference;

        let categoryPaidName = "";
        let amountPaid = 0;
        const itemsPaidList: string[] = [];

        const fees = await getDynamicAlumniFees();
        const certFee = request.programmeType === "HND" ? fees.certificateFeeHND : fees.certificateFeeND;

        if (isCertRef) {
            categoryPaidName = "Academic & Convocation";
            try {
                await verifyPayment('alatpay', reference, undefined, ALATPAY_CERT_CONFIG.secretKey);
            } catch (vErr) {
                console.warn("[Verify CERT ALATPay] Notice:", vErr);
            }

            const updateFields: Record<string, any> = {};
            if (request.certFeeRef === reference) {
                updateFields.certFeeStatus = 'paid';
                amountPaid += certFee;
                itemsPaidList.push(`Certificate Fee (${request.programmeType})`);
            }
            if (request.convocationFeeRef === reference) {
                updateFields.convocationFeeStatus = 'paid';
                amountPaid += fees.convocationFee;
                itemsPaidList.push('Convocation Fee');
            }
            if (request.gownFeeRef === reference) {
                updateFields.gownFeeStatus = 'paid';
                amountPaid += fees.convocationGownFee;
                itemsPaidList.push('Convocation Gown Fee (₦7,000 Gown + ₦5,000 Refundable Deposit)');
            }

            // Fallback if reference wasn't specific
            if (Object.keys(updateFields).length === 0) {
                updateFields.gownFeeStatus = 'paid';
                amountPaid += fees.convocationGownFee;
                itemsPaidList.push('Convocation Gown Fee (₦7,000 Gown + ₦5,000 Refundable Deposit)');
            }

            await db.update(alumniCertificateRequests).set(updateFields).where(eq(alumniCertificateRequests.id, request.id));
            if (updateFields.certFeeStatus) request.certFeeStatus = 'paid';
            if (updateFields.convocationFeeStatus) request.convocationFeeStatus = 'paid';
            if (updateFields.gownFeeStatus) request.gownFeeStatus = 'paid';

        } else if (isIncRef) {
            categoryPaidName = "Compulsory Incidental & Levies";
            try {
                await verifyPayment('alatpay', reference, undefined, ALATPAY_ICT_CONFIG.secretKey);
            } catch (vErr) {
                console.warn("[Verify ICT ALATPay] Notice:", vErr);
            }

            const updateFields: Record<string, any> = {};
            if (request.incidentalFeeRef === reference) {
                updateFields.incidentalFeeStatus = 'paid';
                amountPaid += fees.incidentalFee;
                itemsPaidList.push('Incidental Fee');
            }
            if (request.departmentalFeeRef === reference) {
                updateFields.departmentalFeeStatus = 'paid';
                amountPaid += fees.departmentalFee;
                itemsPaidList.push('Departmental Development Levy');
            }
            if (request.libraryFeeRef === reference) {
                updateFields.libraryFeeStatus = 'paid';
                amountPaid += fees.libraryFee;
                itemsPaidList.push('Library Development Levy');
            }

            // Fallback if none explicitly matched but reference is ALUMNI-INC
            if (Object.keys(updateFields).length === 0) {
                updateFields.incidentalFeeStatus = 'paid';
                amountPaid += fees.incidentalFee;
                itemsPaidList.push('Incidental Fee');
            }

            await db.update(alumniCertificateRequests).set(updateFields).where(eq(alumniCertificateRequests.id, request.id));
            if (updateFields.incidentalFeeStatus) request.incidentalFeeStatus = 'paid';
            if (updateFields.departmentalFeeStatus) request.departmentalFeeStatus = 'paid';
            if (updateFields.libraryFeeStatus) request.libraryFeeStatus = 'paid';

        } else if (isPayRef) {
            categoryPaidName = "Portal Processing Fee";
            try {
                await verifyPayment('paystack', reference);
            } catch (vErr) {
                console.warn("[Verify Paystack] Notice:", vErr);
            }

            amountPaid = fees.processingFeePerItem;
            itemsPaidList.push('Portal Processing Fee');

            await db.update(alumniCertificateRequests).set({
                processingFeeStatus: 'paid',
            }).where(eq(alumniCertificateRequests.id, request.id));
            request.processingFeeStatus = 'paid';
        }

        // Check if student exists in students table
        const cleanMatric = request.matricNumber.trim().toUpperCase();
        const normLoginId = cleanMatric.replace(/\s+/g, '');
        const slashNorm = normLoginId.replace(/_/g, '/');
        const underNorm = normLoginId.replace(/\//g, '_');

        const [matchedStudent] = await db.select().from(students).where(
            or(
                eq(students.matricNumber, cleanMatric),
                eq(students.matricNumber, slashNorm),
                eq(students.matricNumber, underNorm)
            )
        ).limit(1);

        // Record in transactions table (official ledger entry for receipts)
        try {
            const [txInsert] = await db.insert(transactions).values({
                studentId: matchedStudent ? matchedStudent.id : null,
                amount: amountPaid.toFixed(2),
                type: 'credit',
                purpose: `Graduation Clearance: ${itemsPaidList.join(', ')}`,
                status: 'completed',
                gateway: isPayRef ? 'paystack' : 'alatpay',
                gatewayReference: reference
            });

            // Also record in payment_transactions table
            await db.insert(payment_transactions).values({
                userId: matchedStudent?.userId || request.userId || null,
                amount: amountPaid.toFixed(2),
                paymentGateway: isPayRef ? 'paystack' : 'alatpay',
                transactionReference: reference,
                status: 'paid',
                transactionType: 'clearance_fee',
                metadata: JSON.stringify({
                    matricNumber: cleanMatric,
                    applicantName: request.applicantName,
                    itemsPaid: itemsPaidList,
                    category: categoryPaidName,
                    transactionId: txInsert?.insertId
                })
            });
        } catch (txErr) {
            console.warn("Notice: transaction logging in verifyCertificatePayment:", txErr);
        }

        // Check if all clearance fees are now paid
        const allCompulsoryPaid = 
            request.gownFeeStatus === 'paid' && 
            request.convocationFeeStatus === 'paid' && 
            request.certFeeStatus === 'paid' && 
            request.incidentalFeeStatus === 'paid' &&
            request.departmentalFeeStatus === 'paid' &&
            request.libraryFeeStatus === 'paid';

        await db.update(alumniCertificateRequests).set({
            paymentStatus: allCompulsoryPaid ? 'paid' : 'partial'
        }).where(eq(alumniCertificateRequests.id, request.id));

        const includesGown = itemsPaidList.some(item => item.toLowerCase().includes('gown'));

        return {
            success: true,
            verified: true,
            categoryPaidName,
            allCompulsoryPaid,
            reference,
            amountPaid,
            itemsPaid: itemsPaidList,
            includesGown,
            matricNumber: request.matricNumber,
            applicantName: request.applicantName,
            email: request.email,
            message: `Payment of ₦${amountPaid.toLocaleString()} successfully credited to ${categoryPaidName}! Your clearance record has been updated.${includesGown ? ' Note: Your ₦12,000 Convocation Gown payment comprises ₦7,000 for the gown and a ₦5,000 refundable deposit, which will be refunded after the return of the gown.' : ''}`
        };
    } catch (error: any) {
        console.error("verifyCertificatePayment error:", error);
        return { success: false, error: "Verification failed: " + (error.message || "Unknown error") };
    }
}

export async function createOrActivateStudentAccount(data: {
    matricNumber: string;
    email: string;
    password: string;
    name?: string;
    phone?: string;
}) {
    try {
        if (!data.matricNumber || !data.email || !data.password) {
            return { success: false, error: "Matriculation number, email, and password are required." };
        }
        if (data.password.length < 6) {
            return { success: false, error: "Password must be at least 6 characters long." };
        }

        const cleanMatric = data.matricNumber.trim().toUpperCase();
        const cleanEmail = data.email.trim().toLowerCase();
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Find existing student record
        const normLoginId = cleanMatric.replace(/\s+/g, '');
        const slashNorm = normLoginId.replace(/_/g, '/');
        const underNorm = normLoginId.replace(/\//g, '_');

        const [existingStudent] = await db.select().from(students).where(
            or(
                eq(students.matricNumber, cleanMatric),
                eq(students.matricNumber, slashNorm),
                eq(students.matricNumber, underNorm)
            )
        ).limit(1);

        // Find user by email or by existingStudent.userId
        let [existingUser] = await db.select().from(users).where(
            or(
                eq(users.email, cleanEmail),
                existingStudent?.userId ? eq(users.id, existingStudent.userId) : sql`FALSE`
            )
        ).limit(1);

        let userId: number;

        if (existingUser) {
            userId = existingUser.id;
            await db.update(users).set({
                password: hashedPassword,
                status: 'active',
                phone: data.phone || existingUser.phone,
                role: (existingUser.role === 'admin' || existingUser.role === 'superadmin' || existingUser.role === 'staff')
                    ? existingUser.role
                    : 'student'
            }).where(eq(users.id, existingUser.id));
        } else {
            const [newUser] = await db.insert(users).values({
                name: data.name || cleanMatric,
                email: cleanEmail,
                password: hashedPassword,
                role: 'student',
                status: 'active',
                phone: data.phone || null,
                schoolPortalId: cleanMatric
            });
            userId = newUser.insertId;
        }

        // Link student record
        if (existingStudent) {
            await db.update(students).set({
                userId,
                email: cleanEmail,
                phone: data.phone || existingStudent.phone
            }).where(eq(students.id, existingStudent.id));
        } else {
            const nameParts = (data.name || '').trim().split(/\s+/);
            const firstName = nameParts[0] || cleanMatric;
            const lastName = nameParts.slice(1).join(' ') || 'Graduant';

            await db.insert(students).values({
                userId,
                matricNumber: cleanMatric,
                firstName,
                lastName,
                email: cleanEmail,
                phone: data.phone || null,
                status: 'graduated',
                level: 2
            });
        }

        // Link alumniCertificateRequests
        await db.update(alumniCertificateRequests).set({
            userId
        }).where(eq(alumniCertificateRequests.matricNumber, cleanMatric));

        return {
            success: true,
            message: "Portal account successfully activated! You can now log into your student dashboard.",
            loginId: cleanMatric
        };
    } catch (error: any) {
        console.error("createOrActivateStudentAccount error:", error);
        return { success: false, error: error.message || "Failed to create account." };
    }
}

export async function getAlumniReceiptDetails(reference: string) {
    try {
        const [request] = await db.select().from(alumniCertificateRequests).where(
            or(
                eq(alumniCertificateRequests.certFeeRef, reference),
                eq(alumniCertificateRequests.convocationFeeRef, reference),
                eq(alumniCertificateRequests.gownFeeRef, reference),
                eq(alumniCertificateRequests.incidentalFeeRef, reference),
                eq(alumniCertificateRequests.departmentalFeeRef, reference),
                eq(alumniCertificateRequests.libraryFeeRef, reference),
                eq(alumniCertificateRequests.processingFeeRef, reference)
            )
        ).limit(1);

        if (!request) return { found: false, error: "Receipt record not found for reference: " + reference };

        const fees = await getDynamicAlumniFees();
        const certFee = request.programmeType === "HND" ? fees.certificateFeeHND : fees.certificateFeeND;

        const isCertRef = reference.startsWith('ALUMNI-CERT-') || request.certFeeRef === reference || request.convocationFeeRef === reference || request.gownFeeRef === reference;
        const isIncRef = reference.startsWith('ALUMNI-INC-') || request.incidentalFeeRef === reference || request.departmentalFeeRef === reference || request.libraryFeeRef === reference;
        const isPayRef = reference.startsWith('ALUMNI-PAY-') || request.processingFeeRef === reference;

        let gatewayName = "ALATPay";
        let creditedAccountName = "";
        let creditedAccountNumber = "";
        let creditedBank = "Wema Bank";
        let totalAmount = 0;
        const items: { name: string; amount: number; description: string }[] = [];

        if (isCertRef) {
            gatewayName = "ALATPay";
            creditedAccountName = "Academic & Convocation Revenue";
            creditedAccountNumber = "Bursary Central Revenue";
            creditedBank = "Official Settlement Channel";

            if (request.gownFeeRef === reference) {
                items.push({ name: "Convocation Gown Fee (Includes ₦5,000 Refundable Deposit)", amount: fees.convocationGownFee, description: "Official academic gown hire for graduation ceremony — comprises ₦7,000 gown fee and ₦5,000 refundable deposit payable after the return of the gown." });
                totalAmount += fees.convocationGownFee;
            }
            if (request.convocationFeeRef === reference) {
                items.push({ name: "Convocation Fee", amount: fees.convocationFee, description: "Institutional convocation levy and archival record entry." });
                totalAmount += fees.convocationFee;
            }
            if (request.certFeeRef === reference) {
                items.push({ name: `Certificate Fee (${request.programmeType})`, amount: certFee, description: "Official diploma certificate production and embossed seal." });
                totalAmount += certFee;
            }

            if (items.length === 0) {
                items.push({ name: "Convocation Gown Fee (Includes ₦5,000 Refundable Deposit)", amount: fees.convocationGownFee, description: "Official academic gown hire — comprises ₦7,000 gown fee and ₦5,000 refundable deposit after return of the gown." });
                totalAmount += fees.convocationGownFee;
            }
        } else if (isIncRef) {
            gatewayName = "ALATPay";
            creditedAccountName = "Incidental & Development Revenue";
            creditedAccountNumber = "Bursary Central Revenue";
            creditedBank = "Official Settlement Channel";

            if (request.incidentalFeeRef === reference) {
                items.push({ name: "Compulsory Incidental Fee", amount: fees.incidentalFee, description: "Institutional administrative and incidental clearance levy." });
                totalAmount += fees.incidentalFee;
            }
            if (request.departmentalFeeRef === reference) {
                items.push({ name: "Departmental Development Levy", amount: fees.departmentalFee, description: "Departmental infrastructural and academic maintenance levy." });
                totalAmount += fees.departmentalFee;
            }
            if (request.libraryFeeRef === reference) {
                items.push({ name: "Library Development Levy", amount: fees.libraryFee, description: "Digital and physical library maintenance and repository levy." });
                totalAmount += fees.libraryFee;
            }

            if (items.length === 0) {
                items.push({ name: "Compulsory Incidental Fee", amount: fees.incidentalFee, description: "Incidental clearance fee." });
                totalAmount += fees.incidentalFee;
            }
        } else if (isPayRef) {
            gatewayName = "Paystack";
            creditedAccountName = "Portal Online Processing";
            creditedAccountNumber = "Instant Electronic Gateway";
            creditedBank = "Paystack";

            items.push({ name: "Portal Processing Fee", amount: fees.processingFeePerItem, description: "Online certificate & clearance verification processing fee." });
            totalAmount = fees.processingFeePerItem;
        }

        // Format words
        const totalInWords = amountInWords(totalAmount);

        return {
            found: true,
            reference,
            createdAt: (request.updatedAt || request.createdAt || new Date()).toISOString(),
            applicantName: request.applicantName,
            matricNumber: request.matricNumber,
            email: request.email,
            phone: request.phone,
            department: request.department,
            programmeType: request.programmeType,
            yearOfGraduation: request.yearOfGraduation,
            gatewayName,
            creditedAccountName,
            creditedAccountNumber,
            creditedBank,
            items,
            totalAmount,
            totalInWords
        };
    } catch (error: any) {
        console.error("getAlumniReceiptDetails error:", error);
        return { found: false, error: error.message || "Failed to load receipt details." };
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
