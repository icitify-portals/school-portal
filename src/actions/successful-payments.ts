"use server";
import { db } from "@/db/db";
import { transactions, payment_transactions, students, admissionApplicationsV2, users } from "@/db/schema";
import { eq, inArray, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSuccessfulPaymentsGrouped() {
    try {
        const admissionTxs = await db.select({
            id: transactions.id,
            amount: transactions.amount,
            gateway: transactions.gateway,
            gatewayReference: transactions.gatewayReference,
            createdAt: transactions.createdAt,
            purpose: transactions.purpose,
            type: sql<string>`'admission'`,
            userId: sql<number | null>`null`,
        }).from(transactions).where(eq(transactions.status, 'completed'));

        const bursaryTxs = await db.select({
            id: payment_transactions.id,
            amount: payment_transactions.amount,
            gateway: payment_transactions.paymentGateway,
            gatewayReference: payment_transactions.transactionReference,
            createdAt: payment_transactions.createdAt,
            purpose: payment_transactions.transactionType,
            type: sql<string>`'bursary'`,
            userId: payment_transactions.userId,
        }).from(payment_transactions).where(eq(payment_transactions.status, 'paid'));

        const txs = [...admissionTxs, ...bursaryTxs].sort((a, b) => {
            const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dB - dA;
        });

        const appIds = new Set<number>();
        const userIds = new Set<number>();

        txs.forEach(tx => {
            const match = tx.gatewayReference?.match(/^(?:SCH|ACC|PROC|FORM)-(\d+)-/);
            if (match) appIds.add(parseInt(match[1]));
            if (tx.userId) userIds.add(tx.userId);
        });

        const appMap = new Map<number, string>();
        if (appIds.size > 0) {
            const apps = await db.select({ id: admissionApplicationsV2.id, name: users.name, data: admissionApplicationsV2.data })
                .from(admissionApplicationsV2)
                .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
                .where(inArray(admissionApplicationsV2.id, Array.from(appIds)));
            
            apps.forEach(app => {
                let fallback = 'Applicant';
                try { 
                    const d = JSON.parse(app.data as string || '{}');
                    fallback = d.fullName || d.name || `${d.firstName || d.first_name || ''} ${d.lastName || d.last_name || d.surname || ''}`.trim() || 'Applicant';
                } catch(e) {}
                appMap.set(app.id, app.name || fallback);
            });
        }

        const userMap = new Map<number, string>();
        if (userIds.size > 0) {
            const usersData = await db.select({ id: users.id, name: users.name, firstName: users.firstName, surname: users.surname })
                .from(users)
                .where(inArray(users.id, Array.from(userIds)));
            
            usersData.forEach(u => {
                const fullName = u.name || `${u.firstName || ''} ${u.surname || ''}`.trim() || 'Student';
                userMap.set(u.id, fullName);
            });
        }

        const grouped: Record<string, any[]> = {};
        for (const tx of txs) {
            if (tx.gateway === 'paystack' || (tx.gateway !== 'remita' && tx.gateway !== 'alatpay')) continue;
            
            let category = 'Other';
            let itemBreakdown = tx.purpose || 'N/A';
            
            const p = (tx.purpose || '').toLowerCase();
            if (p.includes('acceptance')) {
                category = 'Acceptance Fee';
                itemBreakdown = 'Acceptance Fee & ID Card (N2,000)';
            } else if (p.includes('school fee') || p.includes('tuition')) {
                category = 'School Fees';
                itemBreakdown = 'Tuition / School Fees';
            } else if (p.includes('processing')) {
                category = 'Processing Fee';
                itemBreakdown = 'Processing Fee';
            } else if (p.includes('id card')) {
                category = 'ID Card Fee';
            } else if (p.includes('form') || p.includes('application')) {
                category = 'Application Form Fee';
            }

            let studentName = 'N/A';
            const match = tx.gatewayReference?.match(/^(?:SCH|ACC|PROC|FORM)-(\d+)-/);
            if (match && appMap.has(parseInt(match[1]))) {
                studentName = appMap.get(parseInt(match[1]))!;
            } else if (tx.userId && userMap.has(tx.userId)) {
                studentName = userMap.get(tx.userId)!;
            }

            if (!grouped[category]) grouped[category] = [];
            grouped[category].push({
                ...tx,
                itemBreakdown,
                studentName,
                date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'
            });
        }
        return { success: true, data: grouped };
    } catch(e) {
        return { success: false, error: String(e) };
    }
}

export async function deleteTransaction(txId: number, type: string = 'admission') {
    try {
        if (type === 'bursary') {
            await db.delete(payment_transactions).where(eq(payment_transactions.id, txId));
        } else {
            await db.delete(transactions).where(eq(transactions.id, txId));
        }
        revalidatePath("/admin/bursary/successful-payments");
        return { success: true };
    } catch(e) {
        return { success: false, error: String(e) };
    }
}
