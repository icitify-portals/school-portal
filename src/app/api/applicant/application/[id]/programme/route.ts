import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/db';
import { admissionApplicationsV2 } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const applicationId = parseInt(id);
    if (isNaN(applicationId)) {
        return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const programmeId = body.programmeId;
    if (!programmeId) {
        return NextResponse.json({ success: false, error: 'Programme ID is required' }, { status: 400 });
    }

    try {
        await db.update(admissionApplicationsV2)
            .set({ programmeId })
            .where(and(
                eq(admissionApplicationsV2.id, applicationId),
                eq(admissionApplicationsV2.applicantId, parseInt(session.user.id))
            ));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to save programme:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
