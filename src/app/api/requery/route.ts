import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { transactions, admissionApplicationsV2 } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resolveOnlinePaymentAction } from '@/actions/bursary';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');
    
    if (!ref) return NextResponse.json({ error: 'Missing ref' }, { status: 400 });

    try {
        const [tx] = await db.select().from(transactions).where(eq(transactions.gatewayReference, ref)).limit(1);
        if (!tx) return NextResponse.json({ error: 'Tx not found' }, { status: 404 });

        await db.update(transactions).set({ status: 'pending' }).where(eq(transactions.gatewayReference, ref));
        const res = await resolveOnlinePaymentAction(ref, 'completed');
        
        return NextResponse.json({ success: true, res });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
