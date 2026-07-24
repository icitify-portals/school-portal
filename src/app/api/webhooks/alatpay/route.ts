import { NextResponse } from 'next/server';
import { verifyPayment } from '@/actions/payment-gateways';
import { db } from '@/db';
import { payment_transactions, transactions, users, students } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        
        console.log("ALATPay Webhook Received:", JSON.stringify(payload));

        // Validate ALATPay payload structure based on the PHP implementation schema
        if (!payload || !payload.Value || !payload.Value.Data) {
            return NextResponse.json({ message: "Invalid payload structure" }, { status: 400 });
        }

        const transactionData = payload.Value.Data;
        
        // Extract reference. In ALATPay webhook, this is typically under Customer.TransactionId 
        // or just TransactionId depending on the exact API version they push.
        const orderRef = transactionData.Customer?.TransactionId || transactionData.TransactionId || transactionData.reference;
        const status = transactionData.Status; // "completed" indicates success

        if (!orderRef) {
            return NextResponse.json({ message: "No reference found in payload" }, { status: 400 });
        }

        if (status !== 'completed' && status !== 'successful') {
            console.log(`ALATPay webhook ignored for non-completed transaction: ${orderRef}`);
            return NextResponse.json({ message: "Transaction not completed" }, { status: 200 });
        }

        // 1. Verify on Server: Instead of trusting the payload directly, query ALATPay
        const verification = await verifyPayment('alatpay', orderRef);

        if (verification.success && verification.verified) {
            
            // Check `payment_transactions` table for Wallets / standard bills
            const [originalTx] = await db.select().from(payment_transactions)
                .where(eq(payment_transactions.transactionReference, orderRef)).limit(1);

            if (originalTx && originalTx.status !== 'paid') {
                // Update the payment transaction to 'paid'
                await db.update(payment_transactions)
                    .set({
                        status: 'paid',
                        metadata: JSON.stringify(payload)
                    })
                    .where(eq(payment_transactions.transactionReference, orderRef));

                // Process the payment (update bills, ledger, wallet)
                const { processPayment } = await import('@/actions/bursary');
                
                // Fetch student ID from user ID
                const [student] = await db.select().from(students).where(eq(students.userId, originalTx.userId)).limit(1);

                if (student) {
                    let billId = undefined;
                    try {
                        const meta = originalTx.metadata ? JSON.parse(originalTx.metadata as string) : {};
                        billId = meta.billId;
                    } catch(e) {}

                    await processPayment({
                        studentId: student.id,
                        amount: originalTx.amount,
                        purpose: originalTx.transactionType,
                        gateway: (originalTx.paymentGateway as any) || 'alatpay',
                        gatewayReference: orderRef,
                        billId: billId
                    });
                    console.log(`ALATPay Webhook: Verified and processed wallet/bill payment ${orderRef}`);
                }
            } else {
                // Check `transactions` table for Admission or Split payments
                const [splitTx] = await db.select().from(transactions).where(eq(transactions.gatewayReference, orderRef)).limit(1);
                
                if (splitTx && splitTx.status !== 'completed') {
                    const { resolveOnlinePaymentAction } = await import('@/actions/bursary');
                    await resolveOnlinePaymentAction(orderRef, 'completed');
                    console.log(`ALATPay Webhook: Verified and processed split/admission payment ${orderRef}`);
                } else {
                    console.log(`ALATPay Webhook: Transaction ${orderRef} verified but already processed or not found.`);
                }
            }
        } else {
            console.log(`ALATPay Webhook: Failed verification for transaction ${orderRef}`);
        }

        // Always acknowledge receipt to prevent retries of failed webhooks
        return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });

    } catch (error: any) {
        console.error("ALATPay Webhook Error:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}
