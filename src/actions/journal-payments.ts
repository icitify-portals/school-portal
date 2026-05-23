"use server";

import { db } from "@/db/db";
import { journals, journalArticles, journalPayments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { initiatePayment, verifyPayment as verifyGatewayPayment } from "./payment-gateways";
import { auth } from "@/auth";

/**
 * Initiates APC payment for a journal article
 */
export async function initiateJournalApcPayment(articleId: number, gateway: 'paystack' | 'flutterwave') {
    try {
        const session = await auth();
        if (!session?.user?.email) return { error: "Authentication required" };

        const [article] = await db.select().from(journalArticles).where(eq(journalArticles.id, articleId)).limit(1);
        if (!article) return { error: "Article not found" };

        const [journal] = await db.select().from(journals).where(eq(journals.id, article.journalId)).limit(1);
        const articleWithJournal = { ...article, journal };

        if (article.isApcPaid) return { error: "APC already paid for this article" };

        const amount = parseFloat(articleWithJournal.journal.apcAmount || "0");
        const currency = articleWithJournal.journal.apcCurrency || "NGN";

        if (amount <= 0) {
            // Free journal or APC not set
            await db.update(journalArticles).set({ isApcPaid: true }).where(eq(journalArticles.id, articleId));
            return { success: true, message: "No APC required for this journal" };
        }

        const reference = `APC-${articleId}-${Date.now()}`;

        const res = await initiatePayment(gateway, amount, reference, session.user.email);
        
        if (res.success && res.paymentUrl) {
            // Record pending payment
            await db.insert(journalPayments).values({
                articleId,
                userId: parseInt((session.user as any).id),
                amount: amount.toString(),
                currency,
                gateway,
                reference,
                status: 'pending'
            });

            return { success: true, paymentUrl: res.paymentUrl, reference };
        } else {
            return { error: res.error || "Failed to initiate payment gateway" };
        }
    } catch (error) {
        console.error("Journal APC Initiation Error:", error);
        return { error: "An unexpected error occurred during payment initiation" };
    }
}

/**
 * Verifies Journal APC payment and updates article status
 */
export async function verifyJournalApcPayment(reference: string, gateway: 'paystack' | 'flutterwave') {
    try {
        const res = await verifyGatewayPayment(gateway, reference);
        
        if (res.success && res.verified) {
            const payment = await db.query.journalPayments.findFirst({
                where: eq(journalPayments.reference, reference)
            });

            if (payment && payment.status === 'pending') {
                await db.transaction(async (tx) => {
                    // Update payment record
                    await tx.update(journalPayments).set({
                        status: 'completed',
                        paidAt: new Date()
                    }).where(eq(journalPayments.id, payment.id));

                    // Update article record
                    await tx.update(journalArticles).set({
                        isApcPaid: true
                    }).where(eq(journalArticles.id, payment.articleId));
                });

                revalidatePath("/student/journal");
                return { success: true, message: "Payment verified and updated" };
            }
            return { success: true, message: "Payment already processed or not found" };
        } else {
            return { success: false, error: "Payment verification failed" };
        }
    } catch (error) {
        console.error("Journal APC Verification Error:", error);
        return { error: "Verification failed" };
    }
}

/**
 * Updates APC settings for a journal (Admin only)
 */
export async function updateJournalApcSettings(journalId: number, data: { apcAmount: string, apcCurrency: string }) {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'admin') return { error: "Unauthorized" };

        await db.update(journals).set(data).where(eq(journals.id, journalId));
        revalidatePath("/admin/journal");
        return { success: true };
    } catch (error) {
        console.error("Update APC Settings Error:", error);
        return { error: "Failed to update APC settings" };
    }
}
