import { db } from "@/db/db";
import { transactions, payment_transactions, students } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { verifyPayment } from "@/actions/payment-gateways";
import { confirmSchoolFeesPayment, confirmAcceptancePayment, confirmProcessingFeePayment, confirmAdmissionPayment } from "@/actions/admission_v2";
import { resolveOnlinePaymentAction } from "@/actions/bursary";

export async function reconcilePayments() {
    const startedAt = new Date();
    console.log(`[RECONCILE] Starting payment reconciliation at ${startedAt.toISOString()}`);

    let sweptBursary = 0, markedPaidBursary = 0, failedBursary = 0;
    let sweptAdmission = 0, markedPaidAdmission = 0, failedAdmission = 0;

    // SWEEP 1: Student bill payments (payment_transactions table)
    try {
        const pendingTxs = await db.select()
            .from(payment_transactions)
            .where(
                and(
                    eq(payment_transactions.status, 'pending'),
                    sql`${payment_transactions.createdAt} < NOW() - INTERVAL 15 MINUTE`
                )
            );

        sweptBursary = pendingTxs.length;

        for (const tx of pendingTxs) {
            if (!tx.paymentGateway || !tx.transactionReference) continue;
            const gw = tx.paymentGateway.toLowerCase();
            if (gw !== 'remita' && gw !== 'paystack') continue;

            try {
                const verification = await verifyPayment(tx.paymentGateway, tx.transactionReference);

                if (verification.success && verification.verified) {
                    await db.update(payment_transactions)
                        .set({ status: 'paid', updatedAt: new Date() })
                        .where(eq(payment_transactions.id, tx.id));

                    const { processPayment } = await import('@/actions/bursary');
                    const [student] = await db.select().from(students).where(eq(students.userId, tx.userId)).limit(1);

                    if (student) {
                        let billId: number | undefined;
                        try {
                            const meta = tx.metadata ? JSON.parse(tx.metadata as string) : {};
                            billId = meta.billId;
                        } catch {}

                        await processPayment({
                            studentId: student.id,
                            amount: tx.amount,
                            purpose: tx.transactionType,
                            gateway: (tx.paymentGateway as any) || 'remita',
                            gatewayReference: tx.transactionReference,
                            billId
                        });
                    }
                    markedPaidBursary++;
                } else if (verification.success && !verification.verified) {
                    const hoursOld = (Date.now() - new Date(tx.createdAt || new Date()).getTime()) / (1000 * 60 * 60);
                    if (hoursOld > 24) {
                        await db.update(payment_transactions)
                            .set({ status: 'failed', updatedAt: new Date() })
                            .where(eq(payment_transactions.id, tx.id));
                        failedBursary++;
                    }
                }
            } catch (err) {
                console.error(`[RECONCILE] Error processing bursary TX ${tx.transactionReference}:`, err);
            }
        }
    } catch (err) {
        console.error("[RECONCILE] Bursary sweep failed:", err);
    }

    // SWEEP 2: Admission transactions (transactions table)
    try {
        const pendingAdmissionTxs = await db.select()
            .from(transactions)
            .where(
                and(
                    eq(transactions.status, 'pending'),
                    sql`${transactions.createdAt} < NOW() - INTERVAL 15 MINUTE`
                )
            );

        sweptAdmission = pendingAdmissionTxs.length;

        for (const tx of pendingAdmissionTxs) {
            if (!tx.gateway || !tx.gatewayReference) continue;
            const gw = tx.gateway.toLowerCase();
            if (gw !== 'remita' && gw !== 'paystack') continue;

            try {
                // TX-SPL-* → student bill payments via SplitPaymentEngine
                if (tx.gatewayReference.startsWith('TX-SPL-')) {
                    const result = await resolveOnlinePaymentAction(tx.gatewayReference, 'completed');
                    if (result.success) {
                        markedPaidAdmission++;
                    } else {
                        const hoursOld = (Date.now() - new Date(tx.createdAt || new Date()).getTime()) / (1000 * 60 * 60);
                        if (hoursOld > 24) {
                            await db.update(transactions).set({ status: 'failed' }).where(eq(transactions.id, tx.id));
                            failedAdmission++;
                        }
                    }
                    continue;
                }

                const match = tx.gatewayReference.match(/^(SCH|ACC|PROC|FORM)-(\d+)-/);
                if (!match) continue;

                const type = match[1];
                const appId = parseInt(match[2]);

                let result;
                if (type === 'ACC') result = await confirmAcceptancePayment(appId, tx.gatewayReference, tx.rrr);
                else if (type === 'SCH') result = await confirmSchoolFeesPayment(appId, tx.gatewayReference, tx.rrr);
                else if (type === 'PROC') result = await confirmProcessingFeePayment(appId, tx.gatewayReference, tx.rrr);
                else if (type === 'FORM') result = await confirmAdmissionPayment(appId, tx.gatewayReference);

                if (result?.success) {
                    markedPaidAdmission++;
                } else {
                    const hoursOld = (Date.now() - new Date(tx.createdAt || new Date()).getTime()) / (1000 * 60 * 60);
                    if (hoursOld > 24) {
                        await db.update(transactions).set({ status: 'failed' }).where(eq(transactions.id, tx.id));
                        failedAdmission++;
                    }
                }
            } catch (err) {
                console.error(`[RECONCILE] Error processing admission TX ${tx.gatewayReference}:`, err);
            }
        }
    } catch (err) {
        console.error("[RECONCILE] Admission sweep failed:", err);
    }

    const elapsed = ((Date.now() - startedAt.getTime()) / 1000).toFixed(1);
    console.log(
        `[RECONCILE] Done in ${elapsed}s — ` +
        `Bursary: ${sweptBursary} swept, ${markedPaidBursary} paid, ${failedBursary} failed | ` +
        `Admission: ${sweptAdmission} swept, ${markedPaidAdmission} paid, ${failedAdmission} failed`
    );

    return {
        sweptBursary, markedPaidBursary, failedBursary,
        sweptAdmission, markedPaidAdmission, failedAdmission
    };
}