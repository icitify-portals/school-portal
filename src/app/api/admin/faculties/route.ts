import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { faculties, departments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const allFaculties = await db.select().from(faculties);
        const allDepartments = await db.select().from(departments);

        // Map departments into their respective faculties
        const facultiesWithDepts = allFaculties.map(faculty => ({
            ...faculty,
            departments: allDepartments.filter(dept => dept.facultyId === faculty.id)
        }));

        return NextResponse.json({
            success: true,
            data: {
                faculties: facultiesWithDepts,
                allDepartments
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
