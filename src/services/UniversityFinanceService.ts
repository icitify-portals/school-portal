import { db } from "@/db/db";
import { 
    staffLoans, cashAdvances, cashAdvanceRetirements, 
    cashAdvanceReceipts, staffProfiles, generalLedger, loanTemplates
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { AccountingService } from "./AccountingService";

export class UniversityFinanceService {

    /**
     * Lists all active loan templates.
     */
    static async getLoanTemplates() {
        return await db.select().from(loanTemplates).where(eq(loanTemplates.isActive, true));
    }

    /**
     * Staff Loan Application (Dynamic)
     */
    static async applyForLoan(data: {
        staffId: number,
        templateId: number,
        amount: number,
        months: number,
        customData: Record<string, any>
    }) {
        return await db.insert(staffLoans).values({
            staffId: data.staffId,
            templateId: data.templateId,
            amount: data.amount.toFixed(2),
            repaymentPeriodMonths: data.months,
            customData: JSON.stringify(data.customData),
            status: 'pending'
        });
    }

    /**
     * Cash Advance (Imprest) Request
     */
    static async requestAdvance(data: {
        staffId: number,
        purpose: string,
        amount: number
    }) {
        return await db.insert(cashAdvances).values({
            staffId: data.staffId,
            purpose: data.purpose,
            requestedAmount: data.amount.toFixed(2),
            status: 'requested'
        });
    }

    /**
     * Retire a Cash Advance (Imprest)
     */
    static async retireAdvance(data: {
        advanceId: number,
        receipts: Array<{ description: string, amount: number, url?: string }>,
        returnedBalance: number
    }) {
        const totalSpent = data.receipts.reduce((sum, r) => sum + r.amount, 0);

        return await db.transaction(async (tx) => {
            // 1. Create Retirement Record
            const [retirement] = await tx.insert(cashAdvanceRetirements).values({
                advanceId: data.advanceId,
                totalSpent: totalSpent.toFixed(2),
                balanceReturned: data.returnedBalance.toFixed(2),
                status: 'pending'
            });

            const retirementId = (retirement as any).insertId;

            // 2. Insert Receipts
            if (data.receipts.length > 0) {
                await tx.insert(cashAdvanceReceipts).values(
                    data.receipts.map(r => ({
                        retirementId,
                        description: r.description,
                        amount: r.amount.toFixed(2),
                        receiptUrl: r.url
                    }))
                );
            }

            // 3. Update Advance Status to 'retired' (Awaiting Audit)
            await tx.update(cashAdvances)
                .set({ status: 'retired' })
                .where(eq(cashAdvances.id, data.advanceId));

            return { success: true, retirementId };
        });
    }

    /**
     * Lists all cash advances for a staff member.
     */
    static async getStaffAdvances(staffId: number) {
        return await db.select()
            .from(cashAdvances)
            .where(eq(cashAdvances.staffId, staffId));
    }
}
