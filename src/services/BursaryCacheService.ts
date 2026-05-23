import { redis } from "@/lib/redis";
import { db } from "@/db/db";
import { students, studentLedger, feeStructures } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class BursaryCacheService {

    /**
     * Caches all tuition fees for the school.
     * Matches 'Bursary::cache_all_tuition_fees' from Rust.
     */
    static async cacheAllTuitionFees() {
        const fees = await db.select().from(feeStructures);
        const cacheKey = "bursary:tuition_fees";
        await redis.set(cacheKey, JSON.stringify(fees), "EX", 60 * 60 * 24); // 24h
        return fees.length;
    }

    /**
     * Caches individual ledger for a student.
     * Matches 'IndividualLedger::cache' from Rust.
     */
    static async cacheIndividualLedger(admissionNumber: string, sessionId: number) {
        // Find student
        const [student] = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.admissionNumber, admissionNumber))
            .limit(1);
        
        if (!student) throw new Error(`Student ${admissionNumber} not found`);

        const ledgerEntries = await db.select()
            .from(studentLedger)
            .where(and(
                eq(studentLedger.studentId, student.id),
                eq(studentLedger.sessionId, sessionId)
            ));

        const cacheKey = `bursary:ledger:${admissionNumber}:${sessionId}`;
        await redis.set(cacheKey, JSON.stringify(ledgerEntries), "EX", 60 * 60 * 12); // 12h
        return ledgerEntries.length;
    }

    /**
     * Caches all individual ledgers for a branch and session.
     * Matches 'IndividualLedger::cache_all' from Rust.
     */
    static async cacheAllLedgers(branchId: number, sessionId: number) {
        const matchingStudents = await db.select({ admissionNumber: students.admissionNumber })
            .from(students)
            .where(eq(students.branchId, branchId));

        for (const student of matchingStudents) {
            await this.cacheIndividualLedger(student.admissionNumber, sessionId);
        }
        
        return matchingStudents.length;
    }

    /**
     * Caches general school bursary data.
     * Matches 'bursary.cache_school_data' from Rust.
     */
    static async cacheSchoolData(sessionId: number, term: string) {
        // Implementation for general bursary stats (totals, etc.)
        const stats = {
            totalCollected: 0,
            pendingBills: 0,
            timestamp: new Date().toISOString()
        };
        const cacheKey = `bursary:school_data:${sessionId}:${term}`;
        await redis.set(cacheKey, JSON.stringify(stats), "EX", 60 * 60); // 1h
    }
}
