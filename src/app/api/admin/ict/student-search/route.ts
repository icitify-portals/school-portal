import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { students, users, departments } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(request: Request) {
    try {
        const session = await auth();
        // @ts-expect-error
        if (!session?.user || !['admin', 'ict_manager', 'registrar'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || '';

        if (!q.trim()) {
            return NextResponse.json({ success: true, data: [] });
        }

        const pattern = `%${q}%`;
        const rows = await db.select({
            id: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            deptId: students.deptId,
            deptName: departments.name,
            imageUrl: students.imageUrl,
            signatureUrl: students.signatureUrl,
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(and(
            eq(students.deletedAt, null as any),
            or(
                like(users.name, pattern),
                like(students.firstName, pattern),
                like(students.lastName, pattern),
                like(students.matricNumber, pattern),
                like(users.email, pattern)
            )
        ))
        .limit(20);

        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}