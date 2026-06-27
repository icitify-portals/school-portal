import { NextResponse } from 'next/server';
import { db } from '@/db';
import { payment_transactions } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyPayment } from '@/actions/payment-gateways';

export async function GET(request: Request) {
    try {
        // SECURITY FIX C-4: Require CRON_SECRET_KEY to be explicitly configured.
        // Never fall back to a hardcoded known-plaintext string.
        const expectedKey = process.env.CRON_SECRET_KEY;
        if (!expectedKey) {
            console.error("[CRON] CRON_SECRET_KEY is not configured. Aborting for security.");
            return NextResponse.json(
                { message: "Server misconfiguration. Cron endpoint unavailable." },
                { status: 503 }
            );
        }

        // Secure the cron endpoint. Require an Authorization header or an API key query param
        const { searchParams } = new URL(request.url);
        const cronKey = searchParams.get('cron_key');

        if (!cronKey || cronKey !== expectedKey) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }


        // Find all pending transactions
        const pendingTxs = await db.select()
            .from(payment_transactions)
            .where(
                and(
                    eq(payment_transactions.status, 'pending'),
                    // Only sweep transactions older than 15 minutes to avoid race conditions with users actively paying
                    sql`${payment_transactions.createdAt} < NOW() - INTERVAL 15 MINUTE`
                )
            );

        console.log(`[CRON] Found ${pendingTxs.length} pending transactions to reconcile.`);

        let successCount = 0;
        let failCount = 0;

        for (const tx of pendingTxs) {
            if (!tx.paymentGateway || !tx.transactionReference) continue;

            console.log(`[CRON] Reconciling TX: ${tx.transactionReference} via ${tx.paymentGateway}`);
            
            // Re-query the gateway
            const verification = await verifyPayment(tx.paymentGateway, tx.transactionReference);

            if (verification.success && verification.verified) {
                await db.update(payment_transactions)
                    .set({
                        status: 'paid',
                        updatedAt: new Date()
                    })
                    .where(eq(payment_transactions.id, tx.id));
                
                // Now process the payment (update bills, ledger, wallet)
                const { processPayment } = await import('@/actions/bursary');
                const { students } = await import('@/db/schema');
                const [student] = await db.select().from(students).where(eq(students.userId, tx.userId)).limit(1);

                if (student) {
                    let billId = undefined;
                    try {
                        const meta = tx.metadata ? JSON.parse(tx.metadata as string) : {};
                        billId = meta.billId;
                    } catch(e) {}

                    await processPayment({
                        studentId: student.id,
                        amount: tx.amount,
                        purpose: tx.transactionType,
                        gateway: (tx.paymentGateway as any) || 'remita',
                        gatewayReference: tx.transactionReference,
                        billId: billId
                    });
                }

                successCount++;
            } else if (verification.success && !verification.verified) {
                // We might not want to mark as failed immediately if they just haven't paid yet.
                // It stays pending until a deadline, but for now we leave it pending.
                // Some implementations mark as 'failed' if older than 24 hours.
                const hoursOld = (new Date().getTime() - new Date(tx.createdAt || new Date()).getTime()) / (1000 * 60 * 60);
                if (hoursOld > 24) {
                    await db.update(payment_transactions)
                        .set({
                            status: 'failed',
                            updatedAt: new Date()
                        })
                        .where(eq(payment_transactions.id, tx.id));
                    failCount++;
                }
            }
        }

        return NextResponse.json({
            message: "Cron job completed successfully",
            swept: pendingTxs.length,
            markedPaid: successCount,
            markedFailed: failCount
        }, { status: 200 });

    } catch (error: any) {
        console.error("[CRON] Reconcile Error:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}
