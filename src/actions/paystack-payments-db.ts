"use server";
import { db } from "@/db/db";
import { transactions, admissionApplicationsV2, users } from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPaystackDbTransactions() {
    try {
        const txs = await db.select()
            .from(transactions)
            .where(eq(transactions.gateway, 'paystack'))
            .orderBy(desc(transactions.createdAt));

        const appIds = new Set<number>();
        txs.forEach(tx => {
            const match = tx.gatewayReference?.match(/^(?:SCH|ACC|PROC|FORM|DEV)-(\d+)-/);
            if (match) appIds.add(parseInt(match[1]));
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
                    fallback = d.fullName || d.name || ${d.firstName || d.first_name || ''} .trim() || 'Applicant';
                } catch(e) {}
                appMap.set(app.id, app.name || fallback);
            });
        }

        return txs.map(tx => {
            let studentName = 'N/A';
            const match = tx.gatewayReference?.match(/^(?:SCH|ACC|PROC|FORM|DEV)-(\d+)-/);
            if (match && appMap.has(parseInt(match[1]))) {
                studentName = appMap.get(parseInt(match[1]))!;
            }
            return {
                ...tx,
                studentName,
                date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'
            };
        });
    } catch (e) {
        return [];
    }
}

export async function deletePaystackDbTransaction(txId: number) {
    try {
        await db.delete(transactions).where(eq(transactions.id, txId));
        revalidatePath("/admin/bursary/developer-subscriptions");
        return { success: true };
    } catch(e) {
        return { success: false, error: String(e) };
    }
}
