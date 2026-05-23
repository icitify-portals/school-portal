import { seedInstitutionalHub } from "@/actions/seed-hub";
import { seedPanAfricanDemo } from "@/actions/seed-pan-african";
import { NextResponse } from "next/server";

export async function GET() {
    await seedInstitutionalHub();
    const res = await seedPanAfricanDemo();
    return NextResponse.json(res);
}
