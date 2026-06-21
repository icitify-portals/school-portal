import { NextResponse } from 'next/server';
import { verifyPayment } from '@/actions/payment-gateways';
import { db } from '@/db';
import { payment_transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        // Remita typically sends an array of transactions in the webhook
        const payload = await request.json();
        
        console.log("Remita Webhook Received:", JSON.stringify(payload));

        if (!Array.isArray(payload)) {
            return NextResponse.json({ message: "Invalid payload format" }, { status: 400 });
        }

        // Process each transaction asynchronously
        const updates = payload.map(async (tx: any) => {
            const orderRef = tx.orderRef || tx.orderId;
            if (!orderRef) return null;

            // Instead of trusting the payload directly, we query Remita to ensure 100% security
            const verification = await verifyPayment('remita', orderRef);

            if (verification.success && verification.verified) {
                // Fetch the original transaction to get studentId and billId (for single wallet/bill payments)
                const [originalTx] = await db.select().from(payment_transactions)
                    .where(eq(payment_transactions.transactionReference, orderRef)).limit(1);

                if (originalTx && originalTx.status !== 'paid') {
                    // Update the payment transaction to 'paid'
                    await db.update(payment_transactions)
                        .set({
                            status: 'paid',
                            metadata: JSON.stringify(tx)
                        })
                        .where(eq(payment_transactions.transactionReference, orderRef));

                    // Now process the payment (update bills, ledger, wallet)
                    const { processPayment } = await import('@/actions/bursary');
                    
                    // We need the studentId. Since payment_transactions stores userId, we need to find the student
                    const { students } = await import('@/db/schema');
                    const [student] = await db.select().from(students).where(eq(students.userId, originalTx.userId)).limit(1);

                    if (student) {
                        // Extract billId from metadata if it was a bill payment
                        let billId = undefined;
                        try {
                            const meta = originalTx.metadata ? JSON.parse(originalTx.metadata as string) : {};
                            billId = meta.billId;
                        } catch(e) {}

                        await processPayment({
                            studentId: student.id,
                            amount: originalTx.amount,
                            purpose: originalTx.transactionType,
                            gateway: (originalTx.paymentGateway as any) || 'remita',
                            gatewayReference: orderRef,
                            billId: billId
                        });
                        console.log(`Webhook successfully verified and processed payment: ${orderRef}`);
                    }
                } else {
                    // Check transactions table for Admission or Split payments
                    const { transactions } = await import('@/db/schema');
                    const [splitTx] = await db.select().from(transactions).where(eq(transactions.gatewayReference, orderRef)).limit(1);
                    
                    if (splitTx && splitTx.status !== 'completed') {
                        const { resolveOnlinePaymentAction } = await import('@/actions/bursary');
                        await resolveOnlinePaymentAction(orderRef, 'completed');
                        console.log(`Webhook successfully verified and processed split/admission payment: ${orderRef}`);
                    } else {
                        console.log(`Webhook verified but transaction ${orderRef} already processed or not found.`);
                    }
                }
            } else {
                console.log(`Webhook failed verification for transaction: ${orderRef}`);
            }
        });

        await Promise.all(updates);

        // Acknowledge receipt to Remita
        return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });

    } catch (error: any) {
        console.error("Remita Webhook Error:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}
