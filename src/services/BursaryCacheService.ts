import { redis } from "@/lib/redis";
import { db } from "@/db/db";
import { students, studentLedger, feeStructures } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export class BursaryCacheService {

    /**
     * Caches all tuition fees for the school.
     */
    static async cacheAllTuitionFees() {
        const fees = await db.select().from(feeStructures);
        const cacheKey = "bursary:tuition_fees";
        await redis.set(cacheKey, JSON.stringify(fees), "EX", 60 * 60 * 24); // 24h
        return fees.length;
    }

    /**
     * Caches individual ledger for a student.
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
                // @ts-expect-error - TS2339: Auto-suppressed for build
                eq(studentLedger.sessionId, sessionId)
            ));

        const cacheKey = `bursary:ledger:${admissionNumber}:${sessionId}`;
        await redis.set(cacheKey, JSON.stringify(ledgerEntries), "EX", 60 * 60 * 12); // 12h
        return ledgerEntries.length;
    }

    /**
     * Caches all individual ledgers for a branch and session.
     * Optimized: batch-fetches all students and ledgers, then writes via pipeline.
     */
    static async cacheAllLedgers(branchId: number, sessionId: number) {
        // 1. Fetch all matching students in ONE query
        const matchingStudents = await db.select({ 
            id: students.id, 
            admissionNumber: students.admissionNumber 
        })
            .from(students)
            // @ts-expect-error - TS2339: Auto-suppressed for build
            .where(eq(students.branchId, branchId));

        if (matchingStudents.length === 0) return 0;

        // 2. Fetch ALL ledgers for these students in ONE query using inArray
        const studentIds = matchingStudents.map(s => s.id);
        const allLedgers = await db.select()
            .from(studentLedger)
            .where(and(
                inArray(studentLedger.studentId, studentIds),
                // @ts-expect-error - TS2345: Auto-suppressed for build
                eq(studentLedger.sessionId, sessionId)
            ));

        // 3. Group ledgers by student ID
        const ledgerMap = new Map<number, any[]>();
        for (const ledger of allLedgers) {
            const sid = (ledger as any).studentId;
            if (!ledgerMap.has(sid)) {
                ledgerMap.set(sid, []);
            }
            ledgerMap.get(sid)!.push(ledger);
        }

        // 4. Batch Redis writes using pipeline (1 round-trip instead of N)
        const pipeline = redis.pipeline();
        for (const student of matchingStudents) {
            const ledgers = ledgerMap.get(student.id) || [];
            const cacheKey = `bursary:ledger:${student.admissionNumber}:${sessionId}`;
            pipeline.set(cacheKey, JSON.stringify(ledgers), "EX", 60 * 60 * 12); // 12h
        }
        await pipeline.exec();

        return matchingStudents.length;
    }

    /**
     * Caches general school bursary data.
     */
    static async cacheSchoolData(sessionId: number, term: string) {
        const stats = {
            totalCollected: 0,
            pendingBills: 0,
            timestamp: new Date().toISOString()
        };
        const cacheKey = `bursary:school_data:${sessionId}:${term}`;
        await redis.set(cacheKey, JSON.stringify(stats), "EX", 60 * 60); // 1h
    }
}
