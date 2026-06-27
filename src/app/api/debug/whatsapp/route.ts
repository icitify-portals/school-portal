import { NextResponse } from "next/server";
import { NotificationService } from "@/services/NotificationService";
import { auth } from "@/auth";

export async function POST(req: Request) {
    // SECURITY FIX C-2: Debug endpoints must never be accessible in production.
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Require an authenticated session even in non-production environments.
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { phone, message } = await req.json();

        if (!phone || !message) {
            return NextResponse.json({ success: false, error: "Phone and message required" }, { status: 400 });
        }

        const res = await NotificationService.sendDirectWhatsApp(phone, message);
        return NextResponse.json(res);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
