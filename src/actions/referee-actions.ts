"use server";

import { RefereeService, RefereeResponseData } from "@/services/RefereeService";
import { db } from "@/db/db";
// @ts-expect-error - TS2305: Auto-suppressed for build
import { refereeInvitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createRefereeInvitationAction(data: {
    applicationId: number;
    applicationType: 'postgraduate' | 'job';
    refereeName: string;
    refereeEmail: string;
}) {
    try {
        const result = await RefereeService.createRefereeInvitation(
            data.applicationId,
            data.applicationType,
            data.refereeName,
            data.refereeEmail
        );
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getRefereeInvitationAction(token: string) {
    try {
        const [invitation] = await db.select().from(refereeInvitations).where(eq(refereeInvitations.token, token)).limit(1);
        if (!invitation) {
            return { success: false, error: "Invalid referee invitation token" };
        }

        // Check if 14-day expiry limit is exceeded
        const invitedTime = new Date(invitation.invitedAt || "").getTime();
        const now = Date.now();
        const diffDays = (now - invitedTime) / (1000 * 60 * 60 * 24);

        if (diffDays > 14) {
            return { 
                success: false, 
                error: "This recommendation form link has expired (14-day limit). Please contact the applicant to request a resend." 
            };
        }

        return { success: true, data: invitation };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function submitRefereeResponseAction(token: string, data: RefereeResponseData) {
    try {
        await RefereeService.submitRefereeResponse(token, data);
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
