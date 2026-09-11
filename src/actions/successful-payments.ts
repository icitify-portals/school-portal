"use server";
import { db } from "@/db/db";
import { transactions, payment_transactions, students, admissionApplicationsV2, users } from "@/db/schema";
import { eq, inArray, desc, sql, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSuccessfulPaymentsGrouped() {
    try {
        const admissionTxs = await db.select({
            id: transactions.id,
            amount: transactions.amount,
            gateway: transactions.gateway,
            gatewayReference: transactions.gatewayReference,
            rrr: transactions.rrr,
            gatewayTransactionId: transactions.gatewayTransactionId,
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
            rrr: payment_transactions.gatewayTransactionId,
            metadata: payment_transactions.metadata,
            createdAt: payment_transactions.createdAt,
            purpose: payment_transactions.transactionType,
            type: sql<string>`'bursary'`,
            userId: payment_transactions.userId,
        }).from(payment_transactions).where(eq(payment_transactions.status, 'paid'));

        // Dedupe by gatewayReference (and fallback rrr) — same logical payment can exist in both tables
        const seen = new Map<string, any>();
        for (const tx of [...admissionTxs, ...bursaryTxs]) {
            const anyTx: any = tx;
            const rrr = anyTx.rrr || (() => { try { const m = typeof anyTx.metadata === 'string' ? JSON.parse(anyTx.metadata) : anyTx.metadata; return m?.rrr || m?.RRR || null; } catch { return null; } })() || anyTx.gatewayTransactionId || null;
            const key = (tx.gatewayReference || rrr || `${tx.type}-${tx.id}`).toString().trim();
            if (!seen.has(key)) seen.set(key, { ...tx, rrr });
        }
        const txs = Array.from(seen.values()).sort((a, b) => {
            const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dB - dA;
        });

        const appIds = new Set<number>();
        const userIds = new Set<number>();
        const unknownRefs: string[] = [];

        txs.forEach(tx => {
            const match = tx.gatewayReference?.match(/^(?:SCH|ACC|PROC|FORM)-(\d+)-/);
            if (match) {
                appIds.add(parseInt(match[1]));
            } else if (tx.type === 'admission' && tx.gatewayReference) {
                unknownRefs.push(tx.gatewayReference);
            }
            
            const purposeMatch = tx.purpose?.match(/Application ID:?\s*(\d+)/i);
            if (purposeMatch) {
                appIds.add(parseInt(purposeMatch[1]));
            }

            if (tx.userId) userIds.add(tx.userId);
        });

        const refToNameMap = new Map<string, string>();
        const appMap = new Map<number, string>();

        const extractName = (app: any) => {
            let fallback = 'Applicant';
            try { 
                const d = JSON.parse(app.data as string || '{}');
                fallback = d.fullName || d.name || `${d.FirstName || d.firstName || d.first_name || ''} ${d['Last Name'] || d.lastName || d.last_name || d.surname || ''}`.trim() || 'Applicant';
            } catch(e) {}
            return app.name || fallback;
        };

        if (appIds.size > 0) {
            const apps = await db.select({ id: admissionApplicationsV2.id, name: users.name, data: admissionApplicationsV2.data })
                .from(admissionApplicationsV2)
                .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
                .where(inArray(admissionApplicationsV2.id, Array.from(appIds)));
            
            apps.forEach(app => {
                appMap.set(app.id, extractName(app));
            });
        }

        if (unknownRefs.length > 0) {
            const chunkedRefs = [];
            for (let i = 0; i < unknownRefs.length; i += 100) chunkedRefs.push(unknownRefs.slice(i, i + 100));
            
            for (const chunk of chunkedRefs) {
                const matchedApps = await db.select({ 
                    payRef: admissionApplicationsV2.paymentReference, 
                    procRef: admissionApplicationsV2.processingFeeReference,
                    accRef: admissionApplicationsV2.acceptancePaymentReference,
                    name: users.name, 
                    data: admissionApplicationsV2.data 
                })
                .from(admissionApplicationsV2)
                .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
                .where(or(
                    inArray(admissionApplicationsV2.paymentReference, chunk),
                    inArray(admissionApplicationsV2.processingFeeReference, chunk),
                    inArray(admissionApplicationsV2.acceptancePaymentReference, chunk)
                ));

                matchedApps.forEach(app => {
                    const name = extractName(app);
                    if (app.payRef) refToNameMap.set(app.payRef, name);
                    if (app.procRef) refToNameMap.set(app.procRef, name);
                    if (app.accRef) refToNameMap.set(app.accRef, name);
                });
            }
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
            if (tx.gateway !== 'paystack' && tx.gateway !== 'remita' && tx.gateway !== 'alatpay') continue;
            
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
            } else if (p.includes('wallet_topup') || p.includes('wallet')) {
                category = 'Wallet Topup';
                itemBreakdown = 'Wallet Funding';
            }

            let studentName = 'N/A';
            let matchedAppId = null;
            
            const match = tx.gatewayReference?.match(/^(?:SCH|ACC|PROC|FORM)-(\d+)-/);
            if (match) matchedAppId = parseInt(match[1]);
            
            const purposeMatch = tx.purpose?.match(/Application ID:?\s*(\d+)/i);
            if (purposeMatch) matchedAppId = parseInt(purposeMatch[1]);

            if (matchedAppId !== null && appMap.has(matchedAppId)) {
                studentName = appMap.get(matchedAppId)!;
            } else if (tx.gatewayReference && refToNameMap.has(tx.gatewayReference)) {
                studentName = refToNameMap.get(tx.gatewayReference)!;
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

export async function bulkDeleteTransactions(items: { id: number, type: string }[]) {
    try {
        const bursaryIds = items.filter(i => i.type === 'bursary').map(i => i.id);
        const admissionIds = items.filter(i => i.type === 'admission').map(i => i.id);

        if (bursaryIds.length > 0) {
            await db.delete(payment_transactions).where(inArray(payment_transactions.id, bursaryIds));
        }
        if (admissionIds.length > 0) {
            await db.delete(transactions).where(inArray(transactions.id, admissionIds));
        }
        revalidatePath("/admin/bursary/successful-payments");
        return { success: true };
    } catch(e) {
        return { success: false, error: String(e) };
    }
}

export async function updateSuccessfulPayment(
    txId: number,
    type: string,
    updates: {
        rrr?: string | null;
        gatewayReference?: string | null;
        gateway?: string | null;
        amount?: string | null;
        purpose?: string | null;
        createdAt?: string | null;
    }
) {
    try {
        if (type === 'bursary') {
            const data: Record<string, any> = {};
            if (updates.rrr !== undefined) data.gatewayTransactionId = updates.rrr || null;
            if (updates.gatewayReference !== undefined) data.transactionReference = updates.gatewayReference || null;
            if (updates.gateway !== undefined) data.paymentGateway = updates.gateway || null;
            if (updates.amount !== undefined) {
                const amt = parseFloat(updates.amount || '0');
                if (isNaN(amt) || amt < 0) return { success: false, error: "Invalid amount" };
                data.amount = updates.amount;
            }
            if (updates.purpose !== undefined) data.transactionType = updates.purpose || null;
            if (updates.createdAt !== undefined) data.createdAt = updates.createdAt ? new Date(updates.createdAt) : null;
            if (Object.keys(data).length > 0) {
                await db.update(payment_transactions).set(data).where(eq(payment_transactions.id, txId));
            }
        } else {
            const data: Record<string, any> = {};
            if (updates.rrr !== undefined) data.rrr = updates.rrr || null;
            if (updates.gatewayReference !== undefined) data.gatewayReference = updates.gatewayReference || null;
            if (updates.gateway !== undefined) data.gateway = updates.gateway || null;
            if (updates.amount !== undefined) {
                const amt = parseFloat(updates.amount || '0');
                if (isNaN(amt) || amt < 0) return { success: false, error: "Invalid amount" };
                data.amount = updates.amount;
            }
            if (updates.purpose !== undefined) data.purpose = updates.purpose || null;
            if (updates.createdAt !== undefined) data.createdAt = updates.createdAt ? new Date(updates.createdAt) : null;
            if (Object.keys(data).length > 0) {
                await db.update(transactions).set(data).where(eq(transactions.id, txId));
            }
        }
        revalidatePath("/admin/bursary/successful-payments");
        return { success: true };
    } catch(e) {
        return { success: false, error: String(e) };
    }
}
