import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { admissionApplicationsV2, applicantOLevelSittings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const app = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, 84),
        });
        
        const sittings = await db.query.applicantOLevelSittings.findMany({
            where: eq(applicantOLevelSittings.applicationId, 84),
            with: { subjects: true }
        });
        
        let formData = {};
        if (app && app.data) {
            formData = typeof app.data === 'string' ? JSON.parse(app.data) : app.data;
        }
        
        return NextResponse.json({ 
            formDataOlevel: formData['Give your o-level '],
            sittingsCount: sittings.length,
            sittings
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
