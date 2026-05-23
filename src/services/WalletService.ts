import { db } from "@/db/db";
import { 
    students, 
    walletTransactions 
} from "@/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";

export class WalletService {

    /**
     * Credits the student's wallet (e.g., after a successful Paystack top-up).
     */
    static async creditWallet(studentId: number, amount: number, reference: string, purpose: string = "Online Top-up") {
        return await db.transaction(async (tx) => {
            // 1. Record the credit transaction
            await tx.insert(walletTransactions).values({
                studentId,
                amount: amount.toString(),
                type: 'credit',
                purpose,
                reference,
                status: 'success'
            });

            // 2. Increment student wallet balance
            await tx.update(students)
                .set({ 
                    walletBalance: sql`${students.walletBalance} + ${amount}` 
                })
                .where(eq(students.id, studentId));

            return { success: true };
        });
    }

    /**
     * Debits the student's wallet to pay for an institutional fee.
     */
    static async payFromWallet(studentId: number, amount: number, purpose: string) {
        return await db.transaction(async (tx) => {
            // 1. Check if balance is sufficient
            const student = await tx.select({ balance: students.walletBalance })
                .from(students)
                .where(eq(students.id, studentId))
                .limit(1);
            
            if (!student[0] || parseFloat(student[0].balance || "0") < amount) {
                throw new Error("Insufficient wallet balance.");
            }

            // 2. Record the debit transaction
            const ref = `WLT-${Date.now()}-${studentId}`;
            await tx.insert(walletTransactions).values({
                studentId,
                amount: amount.toString(),
                type: 'debit',
                purpose,
                reference: ref,
                status: 'success'
            });

            // 3. Decrement student wallet balance
            await tx.update(students)
                .set({ 
                    walletBalance: sql`${students.walletBalance} - ${amount}` 
                })
                .where(eq(students.id, studentId));

            return { success: true, reference: ref };
        });
    }

    /**
     * Retrieves the complete transaction history for a student's wallet.
     */
    static async getWalletHistory(studentId: number) {
        return await db.select()
            .from(walletTransactions)
            .where(eq(walletTransactions.studentId, studentId))
            .orderBy(desc(walletTransactions.createdAt));
    }
}
