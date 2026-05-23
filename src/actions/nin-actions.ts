"use server";

import { db } from "@/db/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NinMockProvider } from "@/lib/external/nin";

export async function verifyNin(userId: number, nin: string) {
    try {
        const provider = new NinMockProvider();
        const res = await provider.verify(nin);

        if (!res.success || !res.data) {
            return { success: false, error: res.error || "NIN verification failed" };
        }

        const ninData = res.data;

        // Update student record with NIN data and lock the profile names
        await db.update(students)
            .set({
                nin: nin,
                ninVerified: true,
                firstName: ninData.firstName,
                lastName: ninData.lastName,
                // We keep middleName separate or append it if needed, but schema only has firstName/lastName
            })
            .where(eq(students.userId, userId));

        revalidatePath("/profile");
        return {
            success: true,
            message: "NIN Verified Successfully. Your profile names have been updated to match the national database.",
            data: ninData
        };
    } catch (error: any) {
        console.error("NIN Verification Error:", error);
        return { success: false, error: error.message || "An internal error occurred" };
    }
}
