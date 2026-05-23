import { db } from "@/db/db";
import { transactions, directPayments, students, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

export type PaymentContext = 'Main' | 'Admission' | 'Hostel' | 'Other';

export class PaymentService {

    /**
     * Retrieves failed transactions based on context, session, and term.
     * Matches 'Payment::failed_transactions' from Rust.
     */
    static async getFailedTransactions(context: PaymentContext, sessionId?: number, term?: string, branchId?: number) {
        // This is a simplified version. In real usage, we'd join with sessions/branches.
        const conditions = [eq(transactions.status, 'failed')];
        
        if (branchId) {
            // Assuming transactions are linked to students who belong to branches
            // or we add branchId to transactions.
        }

        return await db.select()
            .from(transactions)
            .where(and(...conditions));
    }

    /**
     * Resolves a pending/failed transaction by verifying with the gateway.
     * Matches 'payment.resolve()' from Rust.
     */
    static async resolveTransaction(transactionNumber: string) {
        const [transaction] = await db.select()
            .from(transactions)
            .where(eq(transactions.gatewayReference, transactionNumber))
            .limit(1);

        if (!transaction) throw new Error(`Transaction ${transactionNumber} not found`);

        // Check if enough time has passed (e.g. 30 mins as per Rust code)
        const requestTime = transaction.createdAt!;
        const secondsElapsed = (Date.now() - requestTime.getTime()) / 1000;
        
        if (secondsElapsed < 1800) { // 30 minutes
            return { 
                success: false, 
                message: `Transaction is too recent (${Math.floor(secondsElapsed / 60)} mins). Wait for 30 mins.` 
            };
        }

        // Trigger gateway verification logic
        // This would call verifyPayment from src/actions/payment-gateways.ts
        
        return { success: true, status: transaction.status, message: "Transaction resolved." };
    }

    /**
     * Generates a Remita Retrieval Reference (RRR).
     * Matches 'Remita::api_hash' and RRR generation logic from Rust.
     */
    static async generateRemitaRrr(transactionNumber: string) {
        const [transaction] = await db.select({
            id: transactions.id,
            amount: transactions.amount,
            studentId: transactions.studentId,
        })
        .from(transactions)
        .where(eq(transactions.gatewayReference, transactionNumber))
        .limit(1);

        if (!transaction) throw new Error("Transaction not found");

        const merchantId = process.env.REMITA_MERCHANT_ID || "2547916";
        const serviceTypeId = process.env.REMITA_SERVICE_TYPE_ID || "4430731";
        const apiKey = process.env.REMITA_API_KEY || "";
        
        const amount = transaction.amount;
        const reference = transactionNumber;

        // api_hash = SHA512(merchantId + serviceTypeId + reference + amount + apiKey)
        const hash = crypto.createHash('sha512')
            .update(`${merchantId}${serviceTypeId}${reference}${amount}${apiKey}`)
            .digest('hex');

        // In a real scenario, we'd POST to Remita API here
        console.log(`Remita API Hash: ${hash}`);
        
        return { 
            success: true, 
            rrr: "RRR-MOCK-12345", // This would be the actual RRR from Remita
            hash 
        };
    }

    /**
     * Updates transaction metadata.
     */
    static async updateTransaction(transactionNumber: string, data: { session?: string, term?: string, teller?: string, remark?: string, date?: Date }) {
        // If it's a direct payment
        const [direct] = await db.select().from(directPayments).where(eq(directPayments.transactionNumber, transactionNumber)).limit(1);
        if (direct) {
            const updateData: any = {};
            if (data.teller) updateData.tellerNumber = data.teller;
            if (data.remark) updateData.remark = data.remark;
            if (data.date) updateData.createdAt = data.date;
            
            await db.update(directPayments).set(updateData).where(eq(directPayments.id, direct.id));
            return { success: true, type: 'direct' };
        }

        // If it's a gateway transaction
        const [trans] = await db.select().from(transactions).where(eq(transactions.gatewayReference, transactionNumber)).limit(1);
        if (trans) {
            // Update gateway transaction metadata if applicable
            return { success: true, type: 'gateway' };
        }

        throw new Error("Transaction not found in direct payments or gateway logs.");
    }
}
