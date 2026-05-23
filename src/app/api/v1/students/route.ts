import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { students, users } from "@/db/schema";
import { eq, sql, like } from "drizzle-orm";
import { withApiAuth } from "@/lib/api-auth";

async function handler(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = (page - 1) * limit;
        const search = searchParams.get('search');
        const deptId = searchParams.get('department_id');
        const level = searchParams.get('level');
        const status = searchParams.get('status');

        let conditions: any[] = [];
        if (search) {
            conditions.push(sql`(${students.firstName} LIKE ${`%${search}%`} OR ${students.lastName} LIKE ${`%${search}%`} OR ${students.matricNumber} LIKE ${`%${search}%`})`);
        }
        if (deptId) conditions.push(eq(students.deptId, parseInt(deptId)));
        if (level) conditions.push(eq(students.currentLevel, parseInt(level)));
        if (status) conditions.push(eq(students.status, status as any));

        const query = db.select({
            id: students.id,
            matricNumber: students.matricNumber,
            firstName: students.firstName,
            lastName: students.lastName,
            currentLevel: students.currentLevel,
            deptId: students.deptId,
            status: students.status,
            email: users.email,
        })
            .from(students)
            .leftJoin(users, eq(students.userId, users.id))
            .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
            .orderBy(students.id)
            .limit(limit)
            .offset(offset);

        const data = await query;

        const [countResult] = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined);

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total: countResult?.count || 0,
                totalPages: Math.ceil((countResult?.count || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error("API Students Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export const GET = withApiAuth(handler);
