"use server";

import { db } from "@/db/db";
import {
    chartOfAccounts,
    generalLedger,
    users
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";
import { v4 as uuidv4 } from 'uuid';

async function ensureAccountingAccess() {
    const isBursar = await hasRole("bursar");
    const isStaff = await hasRole("bursary_staff");
    if (!isBursar && !isStaff) throw new Error("Unauthorized accounting access");
}

// --- Chart of Accounts ---
export async function getCOA() {
    return await db.select().from(chartOfAccounts).orderBy(chartOfAccounts.code);
}

export async function createAccount(data: {
    code: string;
    name: string;
    category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    description?: string;
    parentAccountId?: number;
}) {
    try {
        await ensureAccountingAccess();
        await db.insert(chartOfAccounts).values(data);
        revalidatePath("/admin/accounting/coa");
        return { success: true };
    } catch (error) {
        console.error("Failed to create account:", error);
        return { success: false, error: (error as Error).message };
    }
}

// --- General Ledger & Double Entry ---
export async function recordTransaction(data: {
    description: string;
    reference?: string;
    recordedBy: number;
    entries: {
        accountId: number;
        debit: string;
        credit: string;
    }[]
}) {
    try {
        await ensureAccountingAccess();

        // Validate Double Entry Balance
        const totalDebit = data.entries.reduce((sum, e) => sum + parseFloat(e.debit), 0);
        const totalCredit = data.entries.reduce((sum, e) => sum + parseFloat(e.credit), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return { success: false, error: "Unbalanced transaction: Debits must equal Credits" };
        }

        const batchId = uuidv4();

        await db.transaction(async (tx) => {
            for (const entry of data.entries) {
                await tx.insert(generalLedger).values({
                    accountId: entry.accountId,
                    description: data.description,
                    debit: entry.debit,
                    credit: entry.credit,
                    reference: data.reference,
                    batchId,
                    recordedBy: data.recordedBy
                });
            }
        });

        revalidatePath("/admin/accounting/ledger");

        // Notify the recorder
        import("@/services/NotificationService").then(({ NotificationService }) => {
            NotificationService.notifyUser(data.recordedBy, {
                title: "Journal Entry Created",
                message: `Transaction "${data.description}" has been successfully recorded in the General Ledger.`,
                type: 'success',
                channels: ['toast']
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Transaction recording failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getLedgerEntries() {
    try {
        const entries = await db.select().from(generalLedger).orderBy(desc(generalLedger.transactionDate));

        // Fetch relations separately
        const allAccounts = await db.select().from(chartOfAccounts);
        const allUsers = await db.select().from(users);

        return entries.map(entry => ({
            ...entry,
            account: allAccounts.find(a => a.id === entry.accountId),
            recordedBy: allUsers.find(u => u.id === entry.recordedBy)
        }));
    } catch (error) {
        console.error("Failed to fetch ledger entries:", error);
        return [];
    }
}

// --- Advanced Financial Reporting (Phase 10) ---

export async function getIncomeStatement() {
    try {
        await ensureAccountingAccess();

        // 1. Get all revenue and expense accounts with their balances
        const accountsWithBalances = await db.select({
            id: chartOfAccounts.id,
            code: chartOfAccounts.code,
            name: chartOfAccounts.name,
            category: chartOfAccounts.category,
            totalDebit: sql<string>`sum(${generalLedger.debit})`,
            totalCredit: sql<string>`sum(${generalLedger.credit})`
        })
            .from(chartOfAccounts)
            .leftJoin(generalLedger, eq(chartOfAccounts.id, generalLedger.accountId))
            .where(sql`${chartOfAccounts.category} in ('revenue', 'expense')`)
            .groupBy(chartOfAccounts.id);

        const revenue: any[] = [];
        const expenses: any[] = [];
        let totalRevenue = 0;
        let totalExpenses = 0;

        accountsWithBalances.forEach(acc => {
            const dr = parseFloat(acc.totalDebit || '0');
            const cr = parseFloat(acc.totalCredit || '0');
            const balance = acc.category === 'revenue' ? (cr - dr) : (dr - cr);

            if (acc.category === 'revenue') {
                revenue.push({ ...acc, balance });
                totalRevenue += balance;
            } else {
                expenses.push({ ...acc, balance });
                totalExpenses += balance;
            }
        });

        return {
            success: true,
            data: {
                revenue,
                expenses,
                totalRevenue,
                totalExpenses,
                netSurplus: totalRevenue - totalExpenses
            }
        };
    } catch (error) {
        console.error("Income Statement aggregation failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getBalanceSheet() {
    try {
        await ensureAccountingAccess();

        const accountsWithBalances = await db.select({
            id: chartOfAccounts.id,
            code: chartOfAccounts.code,
            name: chartOfAccounts.name,
            category: chartOfAccounts.category,
            totalDebit: sql<string>`sum(${generalLedger.debit})`,
            totalCredit: sql<string>`sum(${generalLedger.credit})`
        })
            .from(chartOfAccounts)
            .leftJoin(generalLedger, eq(chartOfAccounts.id, generalLedger.accountId))
            .where(sql`${chartOfAccounts.category} in ('asset', 'liability', 'equity')`)
            .groupBy(chartOfAccounts.id);

        const assets: any[] = [];
        const liabilities: any[] = [];
        const equity: any[] = [];
        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;

        accountsWithBalances.forEach(acc => {
            const dr = parseFloat(acc.totalDebit || '0');
            const cr = parseFloat(acc.totalCredit || '0');

            // Asset normally has Debit balance. Liability/Equity normally has Credit balance.
            let balance = 0;
            if (acc.category === 'asset') {
                balance = dr - cr;
                assets.push({ ...acc, balance });
                totalAssets += balance;
            } else if (acc.category === 'liability') {
                balance = cr - dr;
                liabilities.push({ ...acc, balance });
                totalLiabilities += balance;
            } else {
                balance = cr - dr;
                equity.push({ ...acc, balance });
                totalEquity += balance;
            }
        });

        return {
            success: true,
            data: {
                assets,
                liabilities,
                equity,
                totalAssets,
                totalLiabilities,
                totalEquity,
                isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
            }
        };
    } catch (error) {
        console.error("Balance Sheet aggregation failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

// --- Global Session Reporting logic can be added here if needed ---

export async function getTrialBalance() {
    try {
        await ensureAccountingAccess();

        // Trial balance lists all accounts and their current DEBIT or CREDIT balances.
        // Total DB must equal Total CR.
        const accountsWithBalances = await db.select({
            id: chartOfAccounts.id,
            code: chartOfAccounts.code,
            name: chartOfAccounts.name,
            totalDebit: sql<string>`sum(${generalLedger.debit})`,
            totalCredit: sql<string>`sum(${generalLedger.credit})`
        })
            .from(chartOfAccounts)
            .leftJoin(generalLedger, eq(chartOfAccounts.id, generalLedger.accountId))
            .groupBy(chartOfAccounts.id);

        let totalDebits = 0;
        let totalCredits = 0;

        const entries = accountsWithBalances.map(acc => {
            const dr = parseFloat(acc.totalDebit || '0');
            const cr = parseFloat(acc.totalCredit || '0');

            // For Trial Balance, we usually show net debit or net credit per account
            let debit = 0;
            let credit = 0;

            if (dr > cr) {
                debit = dr - cr;
            } else {
                credit = cr - dr;
            }

            totalDebits += debit;
            totalCredits += credit;

            return {
                ...acc,
                debit,
                credit
            };
        }).filter(e => e.debit !== 0 || e.credit !== 0);

        return {
            success: true,
            data: {
                entries,
                totalDebits,
                totalCredits,
                isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
            }
        };
    } catch (error) {
        console.error("Trial Balance extraction failed:", error);
        return { success: false, error: (error as Error).message };
    }
}
