import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { admissionApplicationsV2 } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const app = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, 84),
            with: { applicant: true, template: true }
        });
        
        return NextResponse.json({ app });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
