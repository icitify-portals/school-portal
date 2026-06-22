import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id!);

  try {
    const [student] = await db.select()
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error: any) {
    console.error("API error fetching current student:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
