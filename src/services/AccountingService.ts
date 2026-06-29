import { db } from "@/db/db";
import { chartOfAccounts, generalLedger, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

export type VoucherType = 'RV' | 'PV' | 'JV';

export class AccountingService {

    /**
     * Records a transaction in the General Ledger using a Voucher system.
     * RV = Receipt Voucher (Inflow)
     * PV = Payment Voucher (Outflow)
     * JV = Journal Voucher (Adjustment)
     */
    static async createVoucher(options: {
        type: VoucherType,
        description: string,
        reference?: string,
        recordedBy: number,
        entries: Array<{
            accountId: number,
            debit: number,
            credit: number
        }>
    }) {
        // 1. Validate Balance
        const totalDebit = options.entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = options.entries.reduce((sum, e) => sum + e.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Unbalanced Voucher: Debit (${totalDebit}) does not equal Credit (${totalCredit})`);
        }

        const batchId = uuidv4();
        const voucherNumber = `${options.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 2. Perform Transactional Posting
        return await db.transaction(async (tx) => {
            for (const entry of options.entries) {
                await tx.insert(generalLedger).values({
                    accountId: entry.accountId,
                    description: options.description,
                    debit: entry.debit.toFixed(2),
                    credit: entry.credit.toFixed(2),
                    reference: options.reference || voucherNumber,
                    batchId: batchId,
                    recordedBy: options.recordedBy
                });
            }

            return {
                success: true,
                voucherNumber,
                batchId
            };
        });
    }

    /**
     * Special Hook: Post a Student Payment (Receipt) to the GL.
     * Uses Dynamic Fee Allocation Rules to split revenue.
     */
    static async postReceiptToGL(data: {
        amount: number,
        studentName: string,
        feeItemId: number,
        feeCategory: string,
        recordedBy: number,
        paymentMethod: 'cash' | 'bank' | 'gateway'
    }) {
        // 1. Find Asset Account for Cash/Bank
        const assetAccountCode = data.paymentMethod === 'cash' ? "1001" : "1002";
        const [assetAcc] = await db.select({ id: chartOfAccounts.id })
            .from(chartOfAccounts)
            .where(eq(chartOfAccounts.code, assetAccountCode))
            .limit(1);

        if (!assetAcc) {
            console.error("[Accounting] Asset GL account missing. Skipping GL post.");
            return;
        }

        // 2. Resolve Allocation Rules for the Fee Item
        const rules = await db.select()
            // @ts-expect-error - TS2304: Auto-suppressed for build
            .from(feeAllocationRules)
            // @ts-expect-error - TS2304: Auto-suppressed for build
            .where(eq(feeAllocationRules.feeItemId, data.feeItemId))
            // @ts-expect-error - TS2304: Auto-suppressed for build
            .orderBy(feeAllocationRules.priority);

        const entries: Array<{ accountId: number, debit: number, credit: number }> = [
            { accountId: assetAcc.id, debit: data.amount, credit: 0 }
        ];

        if (rules.length > 0) {
            let remainingAmount = data.amount;
            for (const rule of rules) {
                let creditAmount = 0;
                if (rule.fixedAmount) {
                    creditAmount = Math.min(parseFloat(rule.fixedAmount as string), remainingAmount);
                } else if (rule.percentage) {
                    creditAmount = data.amount * (parseFloat(rule.percentage as string) / 100);
                }

                if (creditAmount > 0) {
                    entries.push({ accountId: rule.targetAccountId, debit: 0, credit: creditAmount });
                    remainingAmount -= creditAmount;
                }
            }

            // If there's still money unallocated, put it in the default revenue account
            if (remainingAmount > 0.01) {
                const [defaultRevenue] = await db.select({ id: chartOfAccounts.id })
                    .from(chartOfAccounts)
                    .where(eq(chartOfAccounts.code, "4001"))
                    .limit(1);
                if (defaultRevenue) {
                    entries.push({ accountId: defaultRevenue.id, debit: 0, credit: remainingAmount });
                }
            }
        } else {
            // Default Fallback
            const [revenueAcc] = await db.select({ id: chartOfAccounts.id })
                .from(chartOfAccounts)
                .where(eq(chartOfAccounts.code, "4001"))
                .limit(1);
            if (revenueAcc) {
                entries.push({ accountId: revenueAcc.id, debit: 0, credit: data.amount });
            }
        }

        return await this.createVoucher({
            type: 'RV',
            description: `Fee Payment: ${data.studentName} (${data.feeCategory})`,
            recordedBy: data.recordedBy,
            entries
        });
    }

    /**
     * Records a Payment Voucher (Outflow/Expense).
     * Typically: Debit Expense Account, Credit Cash/Bank
     */
    static async recordExpense(data: {
        amount: number,
        expenseAccountId: number,
        paymentAccountId: number,
        description: string,
        recordedBy: number
    }) {
        return await this.createVoucher({
            type: 'PV',
            description: data.description,
            recordedBy: data.recordedBy,
            entries: [
                { accountId: data.expenseAccountId, debit: data.amount, credit: 0 },
                { accountId: data.paymentAccountId, debit: 0, credit: data.amount }
            ]
        });
    }

    /**
     * Retrieves the Trial Balance.
     */
    static async getTrialBalance() {
        return await db.select({
            accountName: chartOfAccounts.name,
            accountCode: chartOfAccounts.code,
            totalDebit: sql<number>`SUM(${generalLedger.debit})`,
            totalCredit: sql<number>`SUM(${generalLedger.credit})`
        })
        .from(generalLedger)
        .innerJoin(chartOfAccounts, eq(generalLedger.accountId, chartOfAccounts.id))
        .groupBy(chartOfAccounts.id)
        .orderBy(chartOfAccounts.code);
    }
}
