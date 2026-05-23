import { NextResponse } from "next/server";
import { NotificationService } from "@/services/NotificationService";

export async function POST(req: Request) {
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
