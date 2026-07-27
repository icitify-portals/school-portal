import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { admissionApplicationsV2 } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const applications = await db.query.admissionApplicationsV2.findMany({
            where: eq(admissionApplicationsV2.status, 'draft'),
            with: { applicant: true, template: true },
            limit: 5
        });
        
        return NextResponse.json({ applications });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
