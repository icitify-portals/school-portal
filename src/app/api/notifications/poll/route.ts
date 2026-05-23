import { db } from "@/db/db";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = parseInt(session.user.id);

        const unreadToasts = await db.select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isToasted, false)
                )
            );

        return NextResponse.json(unreadToasts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to poll notifications" }, { status: 500 });
    }
}
