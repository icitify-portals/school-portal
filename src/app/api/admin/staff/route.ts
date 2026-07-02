import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { staffProfiles, users, departments, faculties } from "@/db/schema";
import { eq, or, and, like, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const facultyId = searchParams.get('facultyId');
        const departmentId = searchParams.get('departmentId');
        const limit = Number(searchParams.get('limit')) || 50;

        // Build base query with left joins
        const query = db
            .select({
                id: staffProfiles.id,
                userId: staffProfiles.userId,
                staffId: staffProfiles.staffId,
                name: users.name,
                email: users.email,
                jobTitle: staffProfiles.jobTitle,
                imageUrl: staffProfiles.imageUrl,
                isActive: staffProfiles.isActive,
                department: departments.name,
                departmentId: departments.id,
                faculty: faculties.name,
                facultyId: faculties.id,
                employmentDate: staffProfiles.employmentDate,
            })
            .from(staffProfiles)
            .leftJoin(users, eq(staffProfiles.userId, users.id))
            .leftJoin(departments, eq(staffProfiles.departmentId, departments.id))
            .leftJoin(faculties, eq(departments.facultyId, faculties.id));

        const filters = [];

        if (search) {
            filters.push(
                or(
                    like(users.name, `%${search}%`),
                    like(staffProfiles.staffId, `%${search}%`),
                    like(users.email, `%${search}%`)
                )
            );
        }

        if (facultyId && facultyId !== "all") {
            filters.push(eq(faculties.id, Number(facultyId)));
        }

        if (departmentId && departmentId !== "all") {
            filters.push(eq(departments.id, Number(departmentId)));
        }

        const condition = filters.length > 0 ? and(...filters) : undefined;

        const data = await query
            .where(condition)
            .limit(limit)
            .orderBy(desc(staffProfiles.employmentDate));

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
