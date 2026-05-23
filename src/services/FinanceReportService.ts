import { db } from "@/db/db";
import { transactions, directPayments } from "@/db/schema";
import { and, gte, lte, eq, sql } from "drizzle-orm";

export class FinanceReportService {

    /**
     * Generates a financial report for a branch within a specific period.
     * Matches 'FinanceReport::report' from Rust.
     */
    static async generateReport(branchId: number, session: string, term: string, period?: { from?: Date, to?: Date }) {
        
        const conditions = [];
        
        if (period?.from) conditions.push(gte(transactions.createdAt, period.from));
        if (period?.to) conditions.push(lte(transactions.createdAt, period.to));

        // Aggregate Gateway Transactions
        const gatewayStats = await db.select({
            totalAmount: sql<number>`sum(${transactions.amount})`,
            count: sql<number>`count(*)`,
            status: transactions.status
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(transactions.status);

        // Aggregate Direct Payments
        const directConditions = [];
        if (branchId) directConditions.push(eq(directPayments.branchId, branchId));
        if (period?.from) directConditions.push(gte(directPayments.createdAt, period.from));
        if (period?.to) directConditions.push(lte(directPayments.createdAt, period.to));

        const directStats = await db.select({
            totalAmount: sql<number>`sum(${directPayments.amount})`,
            count: sql<number>`count(*)`,
            status: directPayments.status
        })
        .from(directPayments)
        .where(and(...directConditions))
        .groupBy(directPayments.status);

        return {
            session,
            term,
            period: period || "All Time",
            gateway: gatewayStats,
            direct: directStats,
            generatedAt: new Date().toISOString()
        };
    }
}
