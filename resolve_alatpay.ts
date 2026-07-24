import { resolveOnlinePaymentAction } from "./src/actions/bursary";
import { db } from "./src/db";
import { transactions, payment_transactions } from "./src/db/schema";
import { eq, and } from "drizzle-orm";

async function run() {
    console.log("Looking for pending Alatpay transactions...");
    
    const pendingTxs = await db.select().from(transactions).where(and(eq(transactions.status, 'pending')));
    console.log(`Found ${pendingTxs.length} pending split transactions.`);
    
    for (const tx of pendingTxs) {
        if (tx.gateway === 'alatpay' || (tx.gatewayReference && tx.gatewayReference.includes('ALAT'))) {
            console.log(`Resolving split TX: ${tx.gatewayReference}`);
            const res = await resolveOnlinePaymentAction(tx.gatewayReference || '', 'completed');
            console.log(res);
        }
    }

    const pendingPayTxs = await db.select().from(payment_transactions).where(and(eq(payment_transactions.status, 'pending')));
    console.log(`Found ${pendingPayTxs.length} pending wallet/general transactions.`);

    for (const tx of pendingPayTxs) {
        if (tx.paymentGateway === 'alatpay' || (tx.transactionReference && tx.transactionReference.includes('ALAT'))) {
            console.log(`Resolving payment TX: ${tx.transactionReference}`);
            const res = await resolveOnlinePaymentAction(tx.transactionReference || '', 'completed');
            console.log(res);
        }
    }
    
    console.log("Done!");
}

run().catch(console.error);
