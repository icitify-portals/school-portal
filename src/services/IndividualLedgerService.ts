import { db } from "@/db/db";
import { studentLedger, students, transactions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class IndividualLedgerService {

    /**
     * Retrieves the full ledger for a student.
     * Matches 'IndividualLedger::ledger' from Rust.
     */
    static async getLedger(admissionNumber: string) {
        const [student] = await db.select({ id: students.id, name: students.name })
            .from(students)
            .where(eq(students.admissionNumber, admissionNumber))
            .limit(1);

        if (!student) throw new Error(`Student ${admissionNumber} not found`);

        const entries = await db.select()
            .from(studentLedger)
            .where(eq(studentLedger.studentId, student.id))
            .orderBy(studentLedger.createdAt);

        return {
            student: { admissionNumber, name: student.name },
            entries
        };
    }

    /**
     * Summarizes the ledger for a student for a specific session and term.
     * Matches 'IndividualLedger::summarize' from Rust.
     */
    static async summarizeLedger(admissionNumber: string, sessionId: number, term: string) {
        const ledgerData = await this.getLedger(admissionNumber);
        
        // Filter and calculate summary
        let totalDebit = 0;
        let totalCredit = 0;

        for (const entry of ledgerData.entries) {
            totalDebit += parseFloat(entry.debit || "0");
            totalCredit += parseFloat(entry.credit || "0");
        }

        return {
            ...ledgerData.student,
            sessionId,
            term,
            totalDebit,
            totalCredit,
            balance: totalDebit - totalCredit
        };
    }
}
