import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { students, departments, programmes, users } from "@/db/schema";
import { desc, like, or, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    let conditions = undefined;
    if (search) {
      conditions = or(
        like(students.matricNumber, `%${search}%`),
        like(students.firstName, `%${search}%`),
        like(students.lastName, `%${search}%`)
      );
    }

    const data = await db.select({
      id: students.id,
      matricNumber: students.matricNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      currentLevel: students.currentLevel,
      status: students.status,
      imageUrl: students.imageUrl,
      department: departments.name,
      programme: programmes.name,
    })
    .from(students)
    .leftJoin(departments, eq(students.deptId, departments.id))
    .leftJoin(programmes, eq(students.programmeId, programmes.id))
    .where(conditions)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(students.id));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Failed to fetch students:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
