import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { courses } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { withApiAuth } from "@/lib/api-auth";

async function handler(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = (page - 1) * limit;
        const search = searchParams.get('search');

        let conditions: any[] = [];
        if (search) {
            conditions.push(sql`(${courses.name} LIKE ${`%${search}%`} OR ${courses.code} LIKE ${`%${search}%`})`);
        }

        const data = await db.select({
            id: courses.id,
            code: courses.code,
            name: courses.name,
            creditUnits: courses.creditUnits,
            isPractical: courses.isPractical,
        })
            .from(courses)
            .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
            .orderBy(courses.code)
            .limit(limit)
            .offset(offset);

        const [countResult] = await db.select({ count: sql<number>`count(*)` })
            .from(courses)
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
        console.error("API Courses Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export const GET = withApiAuth(handler);
