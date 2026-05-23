import { db } from "@/db/db";
import { directPayments } from "@/db/schema";
import { eq } from "drizzle-orm";

export class DirectPaymentService {

    /**
     * Registers a new direct payment transaction.
     * Matches 'DirectPayment::register_transaction' from Rust.
     */
    static async registerTransaction(transactionNumber: string, operatorId: number, branchId: number) {
        return await db.insert(directPayments).values({
            transactionNumber,
            operatorId,
            branchId,
            status: 'active'
        });
    }

    /**
     * Retrieves data for a specific transaction.
     * Matches 'direct_payment.data()' from Rust.
     */
    static async getTransaction(transactionNumber: string) {
        const [transaction] = await db.select()
            .from(directPayments)
            .where(eq(directPayments.transactionNumber, transactionNumber))
            .limit(1);

        if (!transaction) throw new Error(`Transaction ${transactionNumber} not found`);
        return transaction;
    }

    /**
     * Nullifies a transaction.
     * Matches 'direct_payment.nullify()' from Rust.
     */
    static async nullifyTransaction(transactionNumber: string) {
        const transaction = await this.getTransaction(transactionNumber);
        
        return await db.update(directPayments)
            .set({ status: 'nullified' })
            .where(eq(directPayments.id, transaction.id));
    }

    /**
     * Updates teller number.
     * Matches 'direct_payment.update_teller_number' from Rust.
     */
    static async updateTellerNumber(transactionNumber: string, tellerNumber: string) {
        const transaction = await this.getTransaction(transactionNumber);
        return await db.update(directPayments)
            .set({ tellerNumber })
            .where(eq(directPayments.id, transaction.id));
    }

    /**
     * Updates remark.
     * Matches 'direct_payment.update_remark' from Rust.
     */
    static async updateRemark(transactionNumber: string, remark: string) {
        const transaction = await this.getTransaction(transactionNumber);
        return await db.update(directPayments)
            .set({ remark })
            .where(eq(directPayments.id, transaction.id));
    }

    /**
     * Updates creation date (backdating).
     * Matches 'direct_payment.update_created_at' from Rust.
     */
    static async updateCreatedAt(transactionNumber: string, createdAt: Date) {
        const transaction = await this.getTransaction(transactionNumber);
        return await db.update(directPayments)
            .set({ createdAt })
            .where(eq(directPayments.id, transaction.id));
    }
    
    /**
     * Updates transaction amount.
     */
    static async updateAmount(transactionNumber: string, amount: string) {
        const transaction = await this.getTransaction(transactionNumber);
        return await db.update(directPayments)
            .set({ amount })
            .where(eq(directPayments.id, transaction.id));
    }
}
