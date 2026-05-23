import { db } from "@/db/db";
import { notifications } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids)) return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });

        await db.update(notifications)
            .set({ isToasted: true, isRead: true })
            .where(inArray(notifications.id, ids));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to mark notifications read" }, { status: 500 });
    }
}
