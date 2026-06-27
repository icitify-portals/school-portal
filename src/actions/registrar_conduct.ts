"use server";

import { db } from "@/db/db";
import { conductLogs } from "@/db/schema";
import { auth } from "@/auth";

export async function logInfraction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const targetType = formData.get("targetType") as "student" | "staff";
        const studentId = formData.get("studentId") ? Number(formData.get("studentId")) : null;
        const staffId = formData.get("staffId") ? Number(formData.get("staffId")) : null;
        
        const infraction = formData.get("infraction") as string;
        const description = formData.get("description") as string;
        const dateOfIncident = formData.get("dateOfIncident") as string;
        const senateSanction = formData.get("senateSanction") as any;
        const sanctionStartDate = formData.get("sanctionStartDate") as string;
        const sanctionEndDate = formData.get("sanctionEndDate") as string;

        if (!targetType || !infraction || !description || !dateOfIncident) {
            return { success: false, error: "Missing required fields" };
        }

        if (targetType === 'student' && !studentId) return { success: false, error: "Student ID required" };
        if (targetType === 'staff' && !staffId) return { success: false, error: "Staff ID required" };

        await db.insert(conductLogs).values({
            targetType,
            studentId,
            staffId,
            infraction,
            description,
            dateOfIncident: new Date(dateOfIncident),
            senateSanction: senateSanction || 'none',
            sanctionStartDate: sanctionStartDate ? new Date(sanctionStartDate) : null,
            sanctionEndDate: sanctionEndDate ? new Date(sanctionEndDate) : null,
            loggedBy: Number(session.user.id),
        });

        return { success: true };
    } catch (error: any) {
        console.error("Failed to log infraction:", error);
        return { success: false, error: error.message };
    }
}
