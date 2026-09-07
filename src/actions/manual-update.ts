"use server";
import { confirmAcceptancePayment, confirmSchoolFeesPayment, confirmProcessingFeePayment, confirmAdmissionPayment } from "./admission_v2";
import { db } from "@/db/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() { 
    const session = await auth(); 
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "superadmin" && session.user.role !== "icitify_dev" && session.user.role !== "super-admin")) {
        throw new Error("Unauthorized: " + session?.user?.role); 
    }
}

export async function processManualAdmissionPayment(reference: string) {
    try {
        if (!reference) return { success: false, error: "Reference is required" };

        let gatewayRef = reference.trim();
        
        if (gatewayRef.startsWith('DEV-')) {
            const { verifyDeveloperFee } = await import('./paystack-developer-subscription');
            return await verifyDeveloperFee(gatewayRef);
        }

        let match = gatewayRef.match(/^(SCH|ACC|PROC|FORM)-(\d+)-/);

        if (!match) {
            const { or } = await import('drizzle-orm');
            const tx = await db.query.transactions.findFirst({
                where: or(eq(transactions.rrr, gatewayRef), eq(transactions.gatewayReference, gatewayRef))
            });
            if (tx && tx.gatewayReference) {
                gatewayRef = tx.gatewayReference;
                match = gatewayRef.match(/^(SCH|ACC|PROC|FORM)-(\d+)-/);
                
                // If STILL no match (e.g. PAY-ADM), check purpose for ID
                if (!match && tx.purpose) {
                    const purposeMatch = tx.purpose.match(/Application ID:?\s*(\d+)/i);
                    if (purposeMatch) {
                        const id = purposeMatch[1];
                        if (tx.purpose.toLowerCase().includes('acceptance')) match = ['ACC-'+id+'-', 'ACC', id] as RegExpMatchArray;
                        else if (tx.purpose.toLowerCase().includes('processing')) match = ['PROC-'+id+'-', 'PROC', id] as RegExpMatchArray;
                        else if (tx.purpose.toLowerCase().includes('school')) match = ['SCH-'+id+'-', 'SCH', id] as RegExpMatchArray;
                        else match = ['FORM-'+id+'-', 'FORM', id] as RegExpMatchArray;
                    }
                }
            }
        }

        if (!match) {
            return { success: false, error: "Invalid transaction reference format. Could not match reference or RRR, nor extract ID from purpose." };
        }

        const type = match[1];
        const appId = parseInt(match[2]);

        let result;
        if (type === 'ACC') {
            result = await confirmAcceptancePayment(appId, gatewayRef);
        } else if (type === 'SCH') {
            result = await confirmSchoolFeesPayment(appId, gatewayRef);
        } else if (type === 'PROC') {
            result = await confirmProcessingFeePayment(appId, gatewayRef);
        } else if (type === 'FORM') {
            result = await confirmAdmissionPayment(appId, gatewayRef);
        }

        if (result?.success) {
            return { success: true, message: "Payment verified and updated successfully!" };
        } else {
            return { success: false, error: result?.error || "Verification failed" };
        }
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function forceUpdateAdmissionPayment(reference: string, action: 'paid' | 'reverse') {
    try {
        await requireAdmin();
        if (!reference) return { success: false, error: "Reference is required" };

        let gatewayRef = reference.trim();
        
        if (gatewayRef.startsWith('DEV-')) {
            const { paystackDeveloperFees, admissionApplicationsV2 } = await import('@/db/schema');
            if (action === 'paid') {
                 await db.update(paystackDeveloperFees)
                    .set({ status: 'paid', paidAt: new Date() })
                    .where(eq(paystackDeveloperFees.reference, gatewayRef));

                 const [feeRecord] = await db.select().from(paystackDeveloperFees).where(eq(paystackDeveloperFees.reference, gatewayRef)).limit(1);
                 if (feeRecord && feeRecord.type === 'admission_form') {
                     const applicationId = parseInt(feeRecord.identifier || '');
                     if (!isNaN(applicationId)) {
                         await db.update(admissionApplicationsV2)
                             .set({ processingFeeStatus: 'paid', processingFeeReference: gatewayRef })
                             .where(eq(admissionApplicationsV2.id, applicationId));
                         const { checkAndGenerateFormNumber } = await import('@/lib/form-number');
                         await checkAndGenerateFormNumber(applicationId, db);
                     }
                 }
            } else {
                 await db.update(paystackDeveloperFees)
                    .set({ status: 'failed' })
                    .where(eq(paystackDeveloperFees.reference, gatewayRef));
            }
            revalidatePath(`/admin/bursary/developer-subscriptions`);
            return { success: true, message: `Developer fee artificially marked as ${action === 'paid' ? 'Successful' : 'Reversed'}.` };
        }

        let match = gatewayRef.match(/^(SCH|ACC|PROC|FORM)-(\d+)-/);

        if (!match) {
            const { or } = await import('drizzle-orm');
            const tx = await db.query.transactions.findFirst({
                where: or(eq(transactions.rrr, gatewayRef), eq(transactions.gatewayReference, gatewayRef))
            });
            if (tx && tx.gatewayReference) {
                gatewayRef = tx.gatewayReference;
                match = gatewayRef.match(/^(SCH|ACC|PROC|FORM)-(\d+)-/);
                
                // If STILL no match (e.g. PAY-ADM), check purpose for ID
                if (!match && tx.purpose) {
                    const purposeMatch = tx.purpose.match(/Application ID:?\s*(\d+)/i);
                    if (purposeMatch) {
                        const id = purposeMatch[1];
                        if (tx.purpose.toLowerCase().includes('acceptance')) match = ['ACC-'+id+'-', 'ACC', id] as RegExpMatchArray;
                        else if (tx.purpose.toLowerCase().includes('processing')) match = ['PROC-'+id+'-', 'PROC', id] as RegExpMatchArray;
                        else if (tx.purpose.toLowerCase().includes('school')) match = ['SCH-'+id+'-', 'SCH', id] as RegExpMatchArray;
                        else match = ['FORM-'+id+'-', 'FORM', id] as RegExpMatchArray;
                    }
                }
            }
        }

        if (!match) {
            return { success: false, error: "Invalid transaction reference format. Could not match reference or RRR, nor extract ID from purpose." };
        }
        
        const type = match[1];
        const appId = parseInt(match[2]);
        
        // Dynamically import the native admin overrides
        const adminActions = await import("./admission_v2");

        if (action === 'paid') {
            if (type === 'ACC') await adminActions.adminConfirmAcceptancePayment(appId, gatewayRef);
            else if (type === 'PROC') await adminActions.adminConfirmProcessingFeePayment(appId, gatewayRef);
            else if (type === 'FORM') await adminActions.confirmAdmissionPayment(appId, gatewayRef);
            else {
                // School fees only relies on the transaction table
                await db.update(transactions).set({ status: 'completed' }).where(eq(transactions.gatewayReference, gatewayRef));
            }
        } else {
            if (type === 'ACC') await adminActions.reverseAcceptancePayment(appId);
            else if (type === 'PROC') await adminActions.reverseProcessingFeePayment(appId);
            else if (type === 'FORM') await adminActions.reverseAdmissionPayment(appId);
            else {
                await db.update(transactions).set({ status: 'pending' }).where(eq(transactions.gatewayReference, gatewayRef));
            }
        }

        revalidatePath(`/admission/status/${appId}`);
        revalidatePath(`/admin/admission/v2/${appId}`);
        revalidatePath(`/super-admin/remita-manual-update`);

        return { success: true, message: `Transaction artificially marked as ${action === 'paid' ? 'Successful' : 'Reversed'}.` };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
