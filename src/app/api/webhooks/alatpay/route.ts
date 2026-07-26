import { NextResponse } from 'next/server';
import { verifyPayment } from '@/actions/payment-gateways';
import { db } from '@/db';
import { payment_transactions, transactions, users, students } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        
        console.log("ALATPay Webhook Received:", JSON.stringify(payload));

        if (!payload || !payload.Value || !payload.Value.Data) {
            return NextResponse.json({ message: "Invalid payload structure" }, { status: 400 });
        }

        const transactionData = payload.Value.Data;
        
        const orderRef = transactionData.Customer?.TransactionId || transactionData.TransactionId || transactionData.reference;
        const status = transactionData.Status;

        if (!orderRef) {
            return NextResponse.json({ message: "No reference found in payload" }, { status: 400 });
        }

        if (status !== 'completed' && status !== 'successful') {
            console.log(`ALATPay webhook ignored for non-completed transaction: ${orderRef}`);
            return NextResponse.json({ message: "Transaction not completed" }, { status: 200 });
        }

        // Extract gateway transaction ID from the webhook payload for cross-referencing
        const gatewayTransactionId = transactionData.TransactionId || transactionData.Id || transactionData.transactionId || null;
        console.log(`ALATPay Webhook: Gateway Transaction ID: ${gatewayTransactionId}, Ref: ${orderRef}`);

        const verification = await verifyPayment('alatpay', orderRef);

        if (verification.success && verification.verified) {
            
            const [originalTx] = await db.select().from(payment_transactions)
                .where(eq(payment_transactions.transactionReference, orderRef)).limit(1);

            if (originalTx && originalTx.status !== 'paid') {
                const gwTxId = (verification as any).gatewayTransactionId || gatewayTransactionId;
                const metadataUpdate = gwTxId 
                    ? JSON.stringify({ ...payload, gatewayTransactionId: gwTxId })
                    : JSON.stringify(payload);

                await db.update(payment_transactions)
                    .set({ status: 'paid', metadata: metadataUpdate })
                    .where(eq(payment_transactions.transactionReference, orderRef));

                const { processPayment } = await import('@/actions/bursary');
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
                    console.log(`ALATPay Webhook: Verified and processed wallet/bill payment ${orderRef} (gwTxId: ${gwTxId})`);
                }
            } else {
                const [splitTx] = await db.select().from(transactions).where(eq(transactions.gatewayReference, orderRef)).limit(1);
                
                if (splitTx && splitTx.status !== 'completed') {
                    const { resolveOnlinePaymentAction } = await import('@/actions/bursary');
                    await resolveOnlinePaymentAction(orderRef, 'completed');
                    console.log(`ALATPay Webhook: Verified and processed split/admission payment ${orderRef} (gwTxId: ${gatewayTransactionId})`);
                } else {
                    console.log(`ALATPay Webhook: Transaction ${orderRef} already processed or not found.`);
                }
            }
        } else {
            console.log(`ALATPay Webhook: Failed verification for transaction ${orderRef}. Error: ${verification.error}`);
        }

        return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });

    } catch (error: any) {
        console.error("ALATPay Webhook Error:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}
