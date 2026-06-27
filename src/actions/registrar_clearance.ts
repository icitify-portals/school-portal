"use server";

import { db } from "@/db/db";
import { graduationClearances } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";

export async function updateClearanceStatus(clearanceId: number, department: string, status: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const updateData: any = {};
        if (department === "library") updateData.libraryStatus = status;
        if (department === "bursary") updateData.bursaryStatus = status;
        if (department === "department") updateData.departmentStatus = status;
        if (department === "registrar") updateData.registrarStatus = status;

        if (status === "cleared") {
            // Check if all are cleared to set overall status
            const existing = await db.select().from(graduationClearances).where(eq(graduationClearances.id, clearanceId));
            if (existing.length > 0) {
                const current = existing[0];
                const finalLibrary = department === "library" ? status : current.libraryStatus;
                const finalBursary = department === "bursary" ? status : current.bursaryStatus;
                const finalDept = department === "department" ? status : current.departmentStatus;
                const finalReg = department === "registrar" ? status : current.registrarStatus;

                if (finalLibrary === "cleared" && finalBursary === "cleared" && finalDept === "cleared" && finalReg === "cleared") {
                    updateData.status = "cleared";
                }
            }
        } else if (status === "rejected") {
             updateData.status = "rejected";
        }

        await db.update(graduationClearances).set(updateData).where(eq(graduationClearances.id, clearanceId));

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update clearance:", error);
        return { success: false, error: error.message };
    }
}
