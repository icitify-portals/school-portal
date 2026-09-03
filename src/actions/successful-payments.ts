"use server";
import { db } from "@/db/db";
import { transactions, students, admissionApplicationsV2 } from "@/db/schema";
import { eq, inArray, and, desc, like } from "drizzle-orm";

export async function getSuccessfulPaymentsGrouped() {
    try {
        const txs = await db.select({
            id: transactions.id,
            amount: transactions.amount,
            gateway: transactions.gateway,
            gatewayReference: transactions.gatewayReference,
            createdAt: transactions.createdAt,
            purpose: transactions.purpose,
            studentId: transactions.studentId,
        }).from(transactions).where(eq(transactions.status, 'completed')).orderBy(desc(transactions.createdAt));

        // Group by normalized purpose
        const grouped: Record<string, any[]> = {};
        for (const tx of txs) {
            if (tx.gateway !== 'remita' && tx.gateway !== 'alatpay' && tx.gateway !== 'paystack') continue;
            let category = 'Other';
            const p = tx.purpose.toLowerCase();
            if (p.includes('acceptance')) category = 'Acceptance Fee';
            else if (p.includes('school fee') || p.includes('tuition')) category = 'School Fees';
            else if (p.includes('processing')) category = 'Processing Fee';
            else if (p.includes('id card')) category = 'ID Card Fee';
            else if (p.includes('form') || p.includes('application')) category = 'Application Form Fee';
            else category = tx.purpose;

            if (!grouped[category]) grouped[category] = [];
            grouped[category].push({
                ...tx,
                date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'
            });
        }
        return { success: true, data: grouped };
    } catch(e) {
        return { success: false, error: String(e) };
    }
}
