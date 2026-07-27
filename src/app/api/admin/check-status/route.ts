import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { admissionApplicationsV2 } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        const result = await db.select({
            status: admissionApplicationsV2.status,
            count: sql`count(*)`
        }).from(admissionApplicationsV2).groupBy(admissionApplicationsV2.status);
        
        return NextResponse.json({ result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
