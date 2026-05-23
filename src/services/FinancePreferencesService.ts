import { db } from "@/db/db";
import { financePreferences } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class FinancePreferencesService {

    /**
     * Saves finance preferences for a given session and branch.
     * Matches 'finance_preferences.save' logic from Rust.
     */
    static async save(sessionId: number, branchId: number, userId: number, data: any, tuitionUpdated: boolean) {
        const dataString = JSON.stringify(data);

        // Upsert logic (MySQL ON DUPLICATE KEY UPDATE)
        // Drizzle doesn't have a direct upsert helper for all dialects yet, 
        // so we check then update/insert.
        
        const [existing] = await db.select()
            .from(financePreferences)
            .where(and(
                eq(financePreferences.sessionId, sessionId),
                eq(financePreferences.branchId, branchId)
            ))
            .limit(1);

        if (existing) {
            await db.update(financePreferences)
                .set({ 
                    data: dataString, 
                    updatedBy: userId 
                })
                .where(eq(financePreferences.id, existing.id));
        } else {
            await db.insert(financePreferences).values({
                sessionId,
                branchId,
                data: dataString,
                updatedBy: userId
            });
        }

        if (tuitionUpdated) {
            console.log(`Triggering tuition re-calculation for session ${sessionId}, branch ${branchId}...`);
            // In a real scenario, we would trigger a background job to re-calculate all bills 
            // for this session and branch.
            // await BursaryService.queueBatchBilling({ sessionId, ... });
        }

        return { success: true };
    }

    /**
     * Retrieves finance preferences.
     */
    static async get(sessionId: number, branchId: number) {
        const [prefs] = await db.select()
            .from(financePreferences)
            .where(and(
                eq(financePreferences.sessionId, sessionId),
                eq(financePreferences.branchId, branchId)
            ))
            .limit(1);
        
        if (!prefs) return null;
        return { ...prefs, data: JSON.parse(prefs.data) };
    }
}
