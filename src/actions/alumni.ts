"use server";

import { db } from "@/db/db";
import { alumniProfiles, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAlumniProfile() {
    const session = await auth();
    if (!session?.user) return null;
    const userId = parseInt(session.user.id!);

    try {
        return await db.query.alumniProfiles.findFirst({
            where: eq(alumniProfiles.userId, userId)
        });
    } catch (error) {
        return null;
    }
}

export async function updateAlumniProfile(data: { 
    graduationYear: number, 
    currentCompany?: string, 
    currentPosition?: string, 
    linkedinUrl?: string 
}) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    const userId = parseInt(session.user.id!);

    try {
        const existing = await getAlumniProfile();

        if (existing) {
            await db.update(alumniProfiles)
                .set(data)
                .where(eq(alumniProfiles.userId, userId));
        } else {
            await db.insert(alumniProfiles).values({
                userId,
                ...data
            });
        }

        revalidatePath("/profile");
        revalidatePath("/alumni");
        return { success: true };
    } catch (error) {
        console.error("Failed to update alumni profile:", error);
        return { error: "Update failed" };
    }
}
