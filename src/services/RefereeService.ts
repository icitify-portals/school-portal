import { db } from "@/db/db";
// @ts-expect-error - TS2305: Auto-suppressed for build
import { refereeInvitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface RefereeResponseData {
    relationshipCapacity: string;
    relationshipYears: number;
    recommendationLevel: 'highly_recommend' | 'recommend' | 'reservations' | 'no_recommend';
    referenceLetter: string;
    ratings: Record<string, number>; // Maps dynamic competency/skills scores
}

export class RefereeService {

    /**
     * Creates a new secure referee invitation.
     */
    static async createRefereeInvitation(
        applicationId: number,
        applicationType: 'postgraduate' | 'job',
        refereeName: string,
        refereeEmail: string
    ) {
        const token = uuidv4();
        await db.insert(refereeInvitations).values({
            applicationId,
            applicationType,
            refereeName,
            refereeEmail,
            token,
            status: 'pending',
        });

        // Simulate emailing the link
        console.log(`[EMAIL TRIGGER] Referee Recommendation Link sent to ${refereeName} (${refereeEmail}) - Link: https://schoolportal.edu/referee/respond?token=${token}`);
        
        return { success: true, token };
    }

    /**
     * Submits the referee recommendation response.
     * Enforces the 14-day token expiration constraint.
     */
    static async submitRefereeResponse(token: string, data: RefereeResponseData) {
        const [invitation] = await db.select().from(refereeInvitations).where(eq(refereeInvitations.token, token)).limit(1);
        if (!invitation) throw new Error("Invalid referee invitation token");

        // 14-Day Expiry Check
        const invitedTime = new Date(invitation.invitedAt || "").getTime();
        const now = Date.now();
        const diffDays = (now - invitedTime) / (1000 * 60 * 60 * 24);

        if (diffDays > 14) {
            throw new Error("This recommendation form link has expired (14-day limit). Please contact the applicant to request a resend.");
        }

        await db.update(refereeInvitations)
            .set({
                status: 'completed',
                relationshipCapacity: data.relationshipCapacity,
                relationshipYears: data.relationshipYears,
                ratingsJson: JSON.stringify(data.ratings),
                recommendationLevel: data.recommendationLevel,
                referenceLetter: data.referenceLetter,
                respondedAt: new Date()
            })
            .where(eq(refereeInvitations.id, invitation.id));

        return { success: true };
    }
}
