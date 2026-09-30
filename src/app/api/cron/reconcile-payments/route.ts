import { NextResponse } from 'next/server';
import { reconcilePayments } from '@/services/PaymentReconciliationService';

export async function GET(request: Request) {
    try {
        // SECURITY: Require CRON_SECRET_KEY to be explicitly configured.
        const expectedKey = process.env.CRON_SECRET_KEY;
        if (!expectedKey) {
            console.error("[CRON] CRON_SECRET_KEY is not configured. Aborting for security.");
            return NextResponse.json(
                { message: "Server misconfiguration. Cron endpoint unavailable." },
                { status: 503 }
            );
        }

        const { searchParams } = new URL(request.url);
        const cronKey = searchParams.get('cron_key');

        if (!cronKey || cronKey !== expectedKey) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const result = await reconcilePayments();

        return NextResponse.json({
            message: "Cron job completed successfully",
            ...result
        }, { status: 200 });

    } catch (error: any) {
        console.error("[CRON] Reconcile Error:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}