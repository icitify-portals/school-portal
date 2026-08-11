"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { students, academicSessions } from "@/db/schema";
import { initiateDeveloperFee } from "./paystack-developer-subscription";

export async function initiatePaystackProcessingFeeAction() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.email) {
            return { success: false, message: "Not authenticated" };
        }

        const activeSessionRes = await db.query.academicSessions.findFirst({
            where: eq(academicSessions.isCurrent, true)
        });

        if (!activeSessionRes) {
            return { success: false, message: "No active academic session found" };
        }

        const studentRecord = await db.query.students.findFirst({
            where: eq(students.userId, parseInt(session.user.id))
        });

        if (!studentRecord) {
            return { success: false, message: "Student record not found" };
        }

        const result = await initiateDeveloperFee(
            studentRecord.id.toString(),
            session.user.email,
            'school_fees',
            activeSessionRes.id
        );

        if (result.success && result.alreadyPaid) {
            return { success: false, message: "Processing fee already paid" };
        }

        if (result.success && result.authorization_url) {
            return { success: true, authorizationUrl: result.authorization_url };
        }

        return { success: false, message: "Failed to get payment link" };
    } catch (err: any) {
        console.error("Error initiating processing fee:", err);
        return { success: false, message: err.message || "Failed to initiate payment" };
    }
}
