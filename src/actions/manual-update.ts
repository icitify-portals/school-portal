"use server";
import { confirmAcceptancePayment, confirmSchoolFeesPayment, confirmProcessingFeePayment, confirmAdmissionPayment } from "./admission_v2";
import { db } from "@/db/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() { 
    const session = await auth(); 
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
        throw new Error("Unauthorized"); 
    }
}

export async function processManualAdmissionPayment(reference: string) {
    try {
        if (!reference) return { success: false, error: "Reference is required" };

        const match = reference.match(/^(SCH|ACC|PROC|FORM)-(\d+)-/);
        if (!match) {
            return { success: false, error: "Invalid transaction reference format. Must start with SCH-, ACC-, PROC-, or FORM-" };
        }

        const type = match[1];
        const appId = parseInt(match[2]);

        let result;
        if (type === 'ACC') {
            result = await confirmAcceptancePayment(appId, reference);
        } else if (type === 'SCH') {
            result = await confirmSchoolFeesPayment(appId, reference);
        } else if (type === 'PROC') {
            result = await confirmProcessingFeePayment(appId, reference);
        } else if (type === 'FORM') {
            result = await confirmAdmissionPayment(appId, reference);
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
    await requireAdmin();
    try {
        if (!reference) return { success: false, error: "Reference is required" };

        const match = reference.match(/^(SCH|ACC|PROC|FORM)-(\d+)-/);
        if (!match) {
            return { success: false, error: "Invalid transaction reference format." };
        }
        
        const type = match[1];
        const appId = parseInt(match[2]);
        
        // Dynamically import the native admin overrides
        const adminActions = await import("./admission_v2");

        if (action === 'paid') {
            if (type === 'ACC') await adminActions.adminConfirmAcceptancePayment(appId, reference);
            else if (type === 'PROC') await adminActions.adminConfirmProcessingFeePayment(appId, reference);
            else if (type === 'FORM') await adminActions.confirmAdmissionPayment(appId, reference);
            else {
                // School fees only relies on the transaction table
                await db.update(transactions).set({ status: 'completed' }).where(eq(transactions.gatewayReference, reference));
            }
        } else {
            if (type === 'ACC') await adminActions.reverseAcceptancePayment(appId);
            else if (type === 'PROC') await adminActions.reverseProcessingFeePayment(appId);
            else if (type === 'FORM') await adminActions.reverseAdmissionPayment(appId);
            else {
                await db.update(transactions).set({ status: 'pending' }).where(eq(transactions.gatewayReference, reference));
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


