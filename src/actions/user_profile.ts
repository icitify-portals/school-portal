"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function checkDateOfBirth() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { missing: false }; // Don't prompt unauthenticated users

        const user = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
            columns: { dateOfBirth: true }
        });

        return { missing: !user?.dateOfBirth };
    } catch (e) {
        return { missing: false }; // Fail silently
    }
}

export async function saveDateOfBirth(dob: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        await db.update(users)
            .set({ dateOfBirth: new Date(dob).toISOString().split('T')[0] as any })
            .where(eq(users.id, parseInt(session.user.id)));

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
