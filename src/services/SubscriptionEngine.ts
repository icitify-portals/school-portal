import { db } from "@/db/db";
import { 
    developerSubscriptionSettings, 
    developerSubscriptions, 
    students, 
    academicSessions 
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class SubscriptionEngine {

    /**
     * Synchronizes developer subscriptions for all active students 
     * based on the active global calendar (academic session) and current settings.
     */
    static async synchronizeSubscriptions() {
        try {
            console.log("=== SUBSCRIPTION ENGINE: Syncing Developer Fees ===");
            
            // 1. Check if there is an active setting
            const settings = await db.query.developerSubscriptionSettings.findFirst({
                where: eq(developerSubscriptionSettings.isActive, true)
            });

            if (!settings) {
                console.log("No active subscription setting found. Skipping sync.");
                return { success: true, message: "No active settings" };
            }

            // 2. Fetch the active academic session
            const activeSession = await db.query.academicSessions.findFirst({
                where: eq(academicSessions.isActive, true)
            });

            if (!activeSession) {
                console.log("No active academic session found. Skipping sync.");
                return { success: false, error: "No active academic session" };
            }

            // Determine the cycle context (e.g. term 1, semester 2, etc.)
            // Currently, academicSessions has an `isActive` but does it have an `activeTerm`?
            // Usually, this is handled via system settings or just the session itself for per_annum.
            // For now, we will bind it to the academicSessionId and term = 1 as a baseline.
            // Ideally, termOrSemester comes from global settings 'current_term'
            
            // Fetch all active students
            const activeStudents = await db.query.students.findMany({
                // @ts-expect-error - TS2339: Auto-suppressed for build
                where: eq(students.enrollmentStatus, 'enrolled')
            });

            console.log(`Found ${activeStudents.length} active students. Checking existing subscriptions...`);

            let newSubscriptions = 0;

            for (const student of activeStudents) {
                // Check if this student already has a subscription for this session
                const existing = await db.query.developerSubscriptions.findFirst({
                    where: and(
                        eq(developerSubscriptions.studentId, student.id),
                        eq(developerSubscriptions.academicSessionId, activeSession.id)
                        // If it's per_term, we would also check termOrSemester
                    )
                });

                if (!existing) {
                    await db.insert(developerSubscriptions).values({
                        studentId: student.id,
                        academicSessionId: activeSession.id,
                        termOrSemester: 1, // Fallback placeholder
                        amountDue: settings.feeAmount,
                        amountPaid: "0.00",
                        status: 'unpaid'
                    });
                    newSubscriptions++;
                }
            }

            console.log(`Sync complete. Generated ${newSubscriptions} new subscriptions.`);
            return { success: true, count: newSubscriptions };

        } catch (error: any) {
            console.error("Subscription Engine Error:", error.message);
            return { success: false, error: error.message };
        }
    }
}
