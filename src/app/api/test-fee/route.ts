import { NextResponse } from 'next/server';
import { getFeeStructures } from '@/actions/bursary';

export async function GET() {
    try {
        const structures = await getFeeStructures();
        return NextResponse.json({ success: true, structures });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
