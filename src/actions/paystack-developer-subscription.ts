"use server";

import { db } from "@/db/db";
import { paystackDeveloperFees, bursarySettings, admissionApplicationsV2 } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ""; 

/**
 * Checks if a developer fee is already paid for a given identifier/type/session.
 */
export async function checkDeveloperFeeStatus(
    identifier: string,
    type: 'admission_form' | 'school_fees',
    sessionId?: number
) {
    if (!identifier) return false;

    let condition = and(
        eq(paystackDeveloperFees.identifier, identifier),
        eq(paystackDeveloperFees.type, type),
        eq(paystackDeveloperFees.status, 'paid')
    );

    if (type === 'school_fees' && sessionId) {
        condition = and(condition, eq(paystackDeveloperFees.sessionId, sessionId));
    }

    const record = await db.query.paystackDeveloperFees.findFirst({
        where: condition
    });

    return !!record;
}

/**
 * Retrieves the fee amount from settings.
 */
export async function getDeveloperFeeAmount(type: 'admission_form' | 'school_fees') {
    const settings = await db.select().from(bursarySettings);
    const settingsMap = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);

    if (type === 'admission_form') {
        return parseInt(settingsMap['developer_fee_admission'] || '3000', 10);
    } else {
        return parseInt(settingsMap['developer_fee_portal_access'] || '7000', 10);
    }
}

/**
 * Initiates a new Paystack Developer Fee transaction if one isn't paid.
 * Returns the paystack reference and the amount.
 */
export async function initiateDeveloperFee(
    identifier: string,
    email: string,
    type: 'admission_form' | 'school_fees',
    sessionId?: number,
    customAmount?: number
) {
    // 1. Check if already paid
    const isPaid = await checkDeveloperFeeStatus(identifier, type, sessionId);
    if (isPaid) {
        return { success: true, alreadyPaid: true };
    }

    // 2. Calculate amount (use custom amount if provided, otherwise read from settings)
    const amount = customAmount || await getDeveloperFeeAmount(type);

    // 3. Generate Reference
    const reference = `DEV-${type === 'admission_form' ? 'ADM' : 'SCH'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Save to DB as pending
    await db.insert(paystackDeveloperFees).values({
        identifier,
        email,
        type,
        sessionId: sessionId || null,
        amount: amount.toString(),
        reference,
        status: 'pending'
    });

    // 5. Hit Paystack API to initialize standard checkout
    try {
        const paystackRes = await fetch(`https://api.paystack.co/transaction/initialize`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                amount: Math.round(amount * 100),
                reference,
                // Redirect back to our verify page
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.fssibadan.edu.ng'}/finance/checkout/developer-verify?reference=${reference}`
            })
        });
        
        const paystackData = await paystackRes.json();
        
        if (paystackData.status && paystackData.data?.authorization_url) {
            return { 
                success: true, 
                alreadyPaid: false,
                reference,
                amount,
                authorizationUrl: paystackData.data.authorization_url,
                publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ""
            };
        } else {
            return {
                success: false,
                error: paystackData.message || "Failed to initialize Paystack checkout"
            };
        }
    } catch (err: any) {
        return {
            success: false,
            error: err.message || "Failed to connect to Paystack"
        };
    }
}

/**
 * Verifies the transaction with Paystack and updates DB.
 */
export async function verifyDeveloperFee(reference: string) {
    if (!reference) return { success: false, error: "No reference provided" };

    try {
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`
            }
        });

        const data = await res.json();
        
        // Even if missing paystack secret in dev, bypass check for local dev testing if response fails?
        // Let's enforce strict if the request succeeded.
        if (data && data.status === true && data.data.status === 'success') {
            await db.update(paystackDeveloperFees)
                .set({ status: 'paid', paidAt: new Date() })
                .where(eq(paystackDeveloperFees.reference, reference));
            
            // Also update admissionApplicationsV2 if this is an admission form fee
            const [feeRecord] = await db.select().from(paystackDeveloperFees).where(eq(paystackDeveloperFees.reference, reference)).limit(1);
            let returnedAppId = null;
            if (feeRecord && feeRecord.type === 'admission_form') {
                const applicationId = parseInt(feeRecord.identifier);
                if (!isNaN(applicationId)) {
                    await db.update(admissionApplicationsV2)
                        .set({ processingFeeStatus: 'paid', processingFeeReference: reference })
                        .where(eq(admissionApplicationsV2.id, applicationId));
                    const { checkAndGenerateFormNumber } = await import('@/lib/form-number');
                    await checkAndGenerateFormNumber(applicationId, db);
                    returnedAppId = applicationId;
                }
            }
            
            return { success: true, applicationId: returnedAppId };
        } else {
            // Fallback for development if secret key is missing (so it doesn't block local dev testing)
            if (!PAYSTACK_SECRET && process.env.NODE_ENV !== 'production') {
                 console.log("PAYSTACK_SECRET missing in DEV. Auto-verifying transaction:", reference);
                 await db.update(paystackDeveloperFees)
                    .set({ status: 'paid', paidAt: new Date() })
                    .where(eq(paystackDeveloperFees.reference, reference));

                 // Also update admissionApplicationsV2 if this is an admission form fee
                 const [feeRecord] = await db.select().from(paystackDeveloperFees).where(eq(paystackDeveloperFees.reference, reference)).limit(1);
                 let returnedAppId = null;
                 if (feeRecord && feeRecord.type === 'admission_form') {
                     const applicationId = parseInt(feeRecord.identifier);
                     if (!isNaN(applicationId)) {
                         await db.update(admissionApplicationsV2)
                             .set({ processingFeeStatus: 'paid', processingFeeReference: reference })
                             .where(eq(admissionApplicationsV2.id, applicationId));
                         const { checkAndGenerateFormNumber } = await import('@/lib/form-number');
                         await checkAndGenerateFormNumber(applicationId, db);
                         returnedAppId = applicationId;
                     }
                 }
                 return { success: true, applicationId: returnedAppId };
            }

            await db.update(paystackDeveloperFees)
                .set({ status: 'failed' })
                .where(eq(paystackDeveloperFees.reference, reference));
                
            return { success: false, error: data.message || "Verification failed" };
        }
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
