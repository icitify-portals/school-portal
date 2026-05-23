import { db } from "@/db/db";
import { AccountingService } from "./AccountingService";

export class FinancialConsolidationService {

    /**
     * Automatic Hook: Posts a confirmed student payment to the General Ledger.
     */
    static async postStudentPaymentToGL(data: {
        amount: number,
        studentId: number,
        studentName: string,
        feeItemId?: number,
        reference: string,
        method: 'cash' | 'bank' | 'gateway',
        recordedBy: number
    }) {
        console.log(`[Consolidation] Posting payment ${data.reference} for ${data.studentName} to GL...`);
        
        try {
            await AccountingService.postReceiptToGL({
                amount: data.amount,
                studentName: data.studentName,
                feeItemId: data.feeItemId || 0,
                feeCategory: "Student Fee Payment",
                recordedBy: data.recordedBy,
                paymentMethod: data.method
            });
            console.log(`[Consolidation] GL Post Successful for Ref: ${data.reference}`);
        } catch (error) {
            console.error(`[Consolidation] GL Post Failed for Ref: ${data.reference}`, error);
        }
    }
}
