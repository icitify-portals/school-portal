import { NextResponse } from 'next/server';
import { getAllUnifiedTransactions } from '@/actions/bursary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const data = await getAllUnifiedTransactions();
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
