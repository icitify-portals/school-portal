import { NextResponse } from "next/server";
import { db } from "@/db";
import { admissionApplicationsV2 } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, jambNumber, mode } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    const existing = await db.query.admissionApplicationsV2.findFirst({
      where: eq(admissionApplicationsV2.id, Number(applicationId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Normalize mode to the DB enum values ('full_time' | 'part_time')
    const normalizedMode = mode === "full-time" || mode === "full_time" ? "full_time" : "part_time";

    // Full-Time mode requires a valid JAMB Registration Number
    if (normalizedMode === "full_time" && (!jambNumber || String(jambNumber).trim().length < 8)) {
      return NextResponse.json({ error: "A valid JAMB Registration Number is required for Full-Time mode." }, { status: 400 });
    }

    await db
      .update(admissionApplicationsV2)
      .set({
        applicationMode: normalizedMode,
        jambRegNumber: normalizedMode === "full_time" ? String(jambNumber).trim().toUpperCase() : null,
      })
      .where(eq(admissionApplicationsV2.id, Number(applicationId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("update-jamb error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
