"use server";

import { auth } from "@/auth";
import { logActivity } from "./audit";

// Payment gateway configuration (stored via system settings or env)
// The gateway enum is already in schema: paystack, flutterwave, remita, opay, manual

interface GatewayConfig {
    id: string;
    name: string;
    enabled: boolean;
    testMode: boolean;
    publicKey: string;
    secretKey: string;
    webhookUrl: string;
    icon: string;
}

const GATEWAY_DEFS: Record<string, { name: string; icon: string; envPrefix: string }> = {
    paystack: { name: 'Paystack', icon: '💚', envPrefix: 'PAYSTACK' },
    flutterwave: { name: 'Flutterwave', icon: '🟠', envPrefix: 'FLW' },
    remita: { name: 'Remita', icon: '🔵', envPrefix: 'REMITA' },
    alatpay: { name: 'ALATPay', icon: '🔴', envPrefix: 'ALATPAY' },
    opay: { name: 'OPay', icon: '🟢', envPrefix: 'OPAY' },
};

export async function getPaymentGatewayConfigs() {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'admin') return { error: "Unauthorized" };

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const gateways: GatewayConfig[] = Object.entries(GATEWAY_DEFS).map(([id, def]) => ({
            id,
            name: def.name,
            icon: def.icon,
            enabled: !!process.env[`${def.envPrefix}_PUBLIC_KEY`],
            testMode: process.env[`${def.envPrefix}_TEST_MODE`] === 'true',
            publicKey: process.env[`${def.envPrefix}_PUBLIC_KEY`] ? '••••' + (process.env[`${def.envPrefix}_PUBLIC_KEY`]?.slice(-6) || '') : '',
            secretKey: process.env[`${def.envPrefix}_SECRET_KEY`] ? '••••' + (process.env[`${def.envPrefix}_SECRET_KEY`]?.slice(-6) || '') : '',
            webhookUrl: `${baseUrl}/api/webhooks/${id}`,
        }));

        return { success: true, gateways };
    } catch (error) {
        console.error("Get Payment Gateways Error:", error);
        return { error: "Failed to fetch gateway configs." };
    }
}

export async function initiatePayment(gateway: string, amount: number, reference: string, email: string) {
    try {
        const def = GATEWAY_DEFS[gateway];
        if (!def) return { error: "Unknown payment gateway" };

        const publicKey = process.env[`${def.envPrefix}_PUBLIC_KEY`];
        const secretKey = process.env[`${def.envPrefix}_SECRET_KEY`];

        if (!publicKey || !secretKey) {
            return { error: `${def.name} is not configured. Add ${def.envPrefix}_PUBLIC_KEY and ${def.envPrefix}_SECRET_KEY to .env` };
        }

        let paymentUrl = '';

        if (gateway === 'paystack') {
            const res = await fetch('https://api.paystack.co/transaction/initialize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    amount: amount * 100, // kobo
                    reference,
                    callback_url: `${process.env.NEXTAUTH_URL}/student/finance?ref=${reference}`,
                }),
            });
            const data = await res.json();
            if (data.status) paymentUrl = data.data.authorization_url;
            else return { error: data.message || "Paystack initialization failed" };

        } else if (gateway === 'flutterwave') {
            const res = await fetch('https://api.flutterwave.com/v3/payments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tx_ref: reference,
                    amount,
                    currency: 'NGN',
                    redirect_url: `${process.env.NEXTAUTH_URL}/student/finance?ref=${reference}`,
                    customer: { email },
                    payment_options: 'card,banktransfer,ussd',
                }),
            });
            const data = await res.json();
            if (data.status === 'success') paymentUrl = data.data.link;
            else return { error: data.message || "Flutterwave initialization failed" };

        } else if (gateway === 'remita') {
            const isLive = process.env.REMITA_ENV !== 'demo';
            const merchantId = isLive ? "19201597339" : (process.env.REMITA_MERCHANT_ID || "19201597339");
            const serviceTypeId = isLive ? "8817651539" : (process.env.REMITA_SERVICE_TYPE_ID || "8817651539"); // ND1 Default
            const apiKey = isLive ? "6NYU4646" : (process.env.REMITA_API_KEY || "6NYU4646");
            const crypto = require('crypto');
            const hash = crypto.createHash('sha512').update(`${merchantId}${serviceTypeId}${reference}${amount}${apiKey}`).digest('hex');
            
            const baseUrl = isLive ? 'https://login.remita.net' : 'https://demo.remita.net';
            
            const res = await fetch(`${baseUrl}/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${hash}`
                },
                body: JSON.stringify({
                    merchantId,
                    serviceTypeId,
                    amount: amount.toString(),
                    orderId: reference,
                    payerName: email.split('@')[0],
                    payerEmail: email,
                    payerPhone: "08000000000"
                })
            });
            const data = await res.json();
            if (data.statuscode === '025' && data.rrr) {
                // Return a simulated checkout URL that handles Remita inline JS using the RRR
                paymentUrl = `/finance/checkout/simulate?gateway=remita&reference=${reference}&amount=${amount}&rrr=${data.rrr}`;
            } else {
                return { error: data.message || "Remita initialization failed" };
            }
        } else if (gateway === 'alatpay') {
            // Return a simulated checkout URL that handles ALATPay inline JS
            paymentUrl = `/finance/checkout/simulate?gateway=alatpay&reference=${reference}&amount=${amount}`;
        } else {
            // OPay: infrastructure placeholder
            return { error: `${def.name} integration coming soon.` };
        }

        await logActivity('initiate_payment', 'payment', undefined, { gateway, amount, reference });

        return { success: true, paymentUrl };
    } catch (error: any) {
        console.error("Initiate Payment Error:", error);
        return { error: error.message || "Payment initialization failed" };
    }
}

export async function verifyPayment(gateway: string, reference: string, rrr?: string) {
    try {
        const def = GATEWAY_DEFS[gateway];
        if (!def) return { error: "Unknown gateway" };

        const secretKey = process.env[`${def.envPrefix}_SECRET_KEY`] || process.env[`${def.envPrefix}_API_KEY`];
        if (!secretKey) return { error: `${def.name} not configured` };

        let verified = false;
        let amount = 0;

        if (gateway === 'paystack') {
            const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: { 'Authorization': `Bearer ${secretKey}` },
            });
            const data = await res.json();
            verified = data.data?.status === 'success';
            amount = (data.data?.amount || 0) / 100;
            if (!verified) {
                return { error: data.message || `Transaction not successful (${data.data?.status || 'Unknown'})` };
            }

        } else if (gateway === 'flutterwave') {
            const res = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
                headers: { 'Authorization': `Bearer ${secretKey}` },
            });
            const data = await res.json();
            verified = data.data?.status === 'successful';
            amount = data.data?.amount || 0;
            if (!verified) {
                return { error: data.message || `Transaction not successful (${data.data?.status || 'Unknown'})` };
            }
        } else if (gateway === 'remita') {
            const isLive = process.env.REMITA_ENV !== 'demo';
            const merchantId = isLive ? "19201597339" : (process.env.REMITA_MERCHANT_ID || "19201597339");
            const apiKey = isLive ? "6NYU4646" : (process.env.REMITA_API_KEY || "6NYU4646");
            const crypto = require('crypto');
            
            const baseUrl = isLive ? 'https://login.remita.net' : 'https://demo.remita.net';
            
            let url = '';
            let hash = '';
            
            if (rrr && rrr.trim().length > 0) {
                // Verify by RRR (More reliable for inline transactions)
                hash = crypto.createHash('sha512').update(`${rrr}${apiKey}${merchantId}`).digest('hex');
                url = `${baseUrl}/remita/exapp/api/v1/send/api/echannelsvc/${merchantId}/${rrr}/${hash}/status.reg`;
            } else {
                // Verify by Order ID
                hash = crypto.createHash('sha512').update(`${reference}${apiKey}${merchantId}`).digest('hex');
                url = `${baseUrl}/remita/exapp/api/v1/send/api/echannelsvc/${merchantId}/${reference}/${hash}/status.reg`;
            }
            
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${hash}`
                }
            });
            const data = await res.json();
            
            verified = data.status === '00' || data.status === '01'; // 00 means successful, 01 means successful
            amount = data.amount || 0;
            if (!verified) {
                return { error: data.message || `Transaction failed. Response: ${JSON.stringify(data)}` };
            }
        } else if (gateway === 'alatpay') {
            // In a full production setup with live keys, we would call:
            // GET /payment-settlement/api/v1/settlements with Ocp-Apim-Subscription-Key
            // For now, we trust the inline checkout's generated reference
            verified = true;
            amount = 0;
        }

        return { success: true, verified, amount, gateway };
    } catch (error: any) {
        console.error("Verify Payment Error:", error);
        return { error: error.message || "Payment verification failed" };
    }
}
