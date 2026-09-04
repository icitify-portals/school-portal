"use server";
import { confirmAcceptancePayment, confirmSchoolFeesPayment, confirmProcessingFeePayment, confirmAdmissionPayment } from "./admission_v2";
import { db } from "@/db/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

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
