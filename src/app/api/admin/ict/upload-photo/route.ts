import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { students, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { storage } from '@/lib/storage';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
    try {
        const session = await auth();
        // @ts-expect-error
        if (!session?.user || !['admin', 'ict_manager', 'registrar'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const studentId = parseInt(formData.get('studentId') as string);
        const type = formData.get('type') as string; // 'photo' or 'signature'

        if (!file || !studentId || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Only JPEG and PNG images are allowed' }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB for ICT capture
            return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed' }, { status: 400 });
        }

        // Upload to storage
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const subDir = type === 'signature' ? 'signatures' : 'profiles';
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `ict_${studentId}_${Date.now()}.${ext}`;
        const uploadResult = await storage.upload(buffer, filename, subDir, file.type);

        if (!uploadResult.success || !uploadResult.url) {
            return NextResponse.json({ error: uploadResult.error || 'Upload failed' }, { status: 500 });
        }

        // Update student record
        const updateField = type === 'signature' ? { signatureUrl: uploadResult.url } : { imageUrl: uploadResult.url };
        await db.update(students).set(updateField).where(eq(students.id, studentId));

        // Sync photo to users table
        if (type === 'photo') {
            const [student] = await db.select({ userId: students.userId }).from(students).where(eq(students.id, studentId)).limit(1);
            if (student) {
                await db.update(users).set({ imageUrl: uploadResult.url }).where(eq(users.id, student.userId));
            }
        }

        return NextResponse.json({ success: true, url: uploadResult.url });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}