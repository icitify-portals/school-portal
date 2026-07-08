"use server";

import { db } from "@/db/db";
import { users, walletTransactions, payment_transactions, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { v4 as uuidv4 } from "uuid";
import { PaymentGatewayAdapter, RemitaAdapter, PaystackAdapter, FlutterwaveAdapter } from "@/services/SplitPaymentEngine";

// Action to generate an RRR/Checkout URL strictly for funding the wallet
export async function initializeWalletTopUp(amount: number, gateway: 'remita' | 'paystack' | 'flutterwave') {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const userId = parseInt(session.user.id);
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
        if (!user) return { success: false, error: "User not found" };
        const student = await db.select().from(students).where(eq(students.userId, userId)).limit(1).then(res => res[0]);
        if (!student) return { success: false, error: "Student profile not found" };

        const reference = `WTOP-${uuidv4().substring(0, 8).toUpperCase()}`;

        // Select gateway adapter
        let adapter: PaymentGatewayAdapter;
        switch (gateway) {
            case 'paystack':
                adapter = new PaystackAdapter();
                break;
            case 'flutterwave':
                adapter = new FlutterwaveAdapter();
                break;
            case 'remita':
            default:
                adapter = new RemitaAdapter();
                break;
        }

        // We don't have fee splits for wallet topups. 100% goes to the institution pool
        const checkoutResponse = await adapter.initializeSplitPayment(
            user.email,
            amount,
            reference,
            [{
                amount: amount,
                accountName: "Wallet Top-up",
                bankCode: "058", // Generic bank code for institution
                accountNumber: "0000000000" // Generic account number
            }],
            'student' // Fee allocation rule
        );

        // Extract RRR if remita
        let rrr = null;
        if (gateway === 'remita') {
            rrr = checkoutResponse.rrr || null;
            if (!rrr && checkoutResponse.checkoutUrl && checkoutResponse.checkoutUrl.includes('rrr=')) {
                const urlObj = new URL(checkoutResponse.checkoutUrl, "http://localhost");
                rrr = urlObj.searchParams.get('rrr');
            }
        }

        // Record the transaction attempt in payment_transactions with 'wallet_topup' transactionType
        await db.insert(payment_transactions).values({
            transactionReference: reference,
            userId: user.id,
            transactionType: 'wallet_topup',
            amount: amount.toString(),
            paymentMethod: 'card', // or whatever
            paymentGateway: gateway,
            gatewayTransactionId: rrr,
            status: 'pending'
        });

        return { success: true, checkoutUrl: checkoutResponse.checkoutUrl, reference, rrr };

    } catch (error: any) {
        console.error("Wallet Topup Error:", error);
        return { success: false, error: error.message || "Failed to initialize top-up" };
    }
}
