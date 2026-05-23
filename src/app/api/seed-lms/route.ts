import { seedLmsData } from "@/actions/lms-seed";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const result = await seedLmsData();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
