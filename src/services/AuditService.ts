import { db } from "@/db/db";
import { 
    auditVerifications, generalLedger, cashAdvanceRetirements, 
    cashAdvances, users 
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export type AuditDecision = 'verified' | 'flagged' | 'rejected';

export class AuditService {

    /**
     * Retrieves the queue of financial entities awaiting audit.
     */
    static async getAuditQueue() {
        // 1. Pending Retirements
        const pendingRetirements = await db.select()
            .from(cashAdvanceRetirements)
            .where(eq(cashAdvanceRetirements.status, 'pending'));

        // 2. Unverified General Ledger Batches (This would require a 'isVerified' column in GL)
        // For now, we focus on Retirements as the primary audit entry point
        
        return {
            retirements: pendingRetirements,
            totalPending: pendingRetirements.length
        };
    }

    /**
     * Records an auditor's decision on a financial entity.
     */
    static async verifyEntity(options: {
        entityType: 'voucher' | 'retirement' | 'payroll' | 'inventory',
        entityId: number,
        auditorId: number,
        decision: AuditDecision,
        findings?: string,
        recommendation?: string
    }) {
        return await db.transaction(async (tx) => {
            // 1. Log the verification record
            await tx.insert(auditVerifications).values({
                entityType: options.entityType,
                entityId: options.entityId,
                auditorId: options.auditorId,
                decision: options.decision,
                findings: options.findings,
                recommendation: options.recommendation
            });

            // 2. Update the status of the target entity
            if (options.entityType === 'retirement') {
                await tx.update(cashAdvanceRetirements)
                    .set({ 
                        status: options.decision === 'verified' ? 'audited' : 
                                options.decision === 'rejected' ? 'rejected' : 'pending',
                        auditorComments: options.findings
                    })
                    .where(eq(cashAdvanceRetirements.id, options.entityId));

                // If audited, we also mark the advance as audited
                if (options.decision === 'verified') {
                    const [retirement] = await tx.select().from(cashAdvanceRetirements).where(eq(cashAdvanceRetirements.id, options.entityId));
                    await tx.update(cashAdvances)
                        .set({ status: 'audited' })
                        .where(eq(cashAdvances.id, retirement.advanceId));
                }
            }

            return { success: true, decision: options.decision };
        });
    }

    /**
     * Generates an Audit Trail report for a specific period.
     */
    static async getAuditTrail(period?: { from: Date, to: Date }) {
        let query = db.select({
            id: auditVerifications.id,
            type: auditVerifications.entityType,
            decision: auditVerifications.decision,
            auditor: users.name,
            date: auditVerifications.verifiedAt,
            findings: auditVerifications.findings
        })
        .from(auditVerifications)
        .innerJoin(users, eq(auditVerifications.auditorId, users.id))
        .orderBy(desc(auditVerifications.verifiedAt));

        // Add date filters if provided
        
        return await query;
    }
}
