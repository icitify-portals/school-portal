"use server";
import { db } from "@/db/db";
import { semesterSummaries, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function recordPrintFeePaymentAction(studentId: number, sessionId: number, semester: string, amount: number, reference: string, gatewayTxId: string) {
    try {
        await db.update(semesterSummaries)
            .set({ isPrintFeePaid: true })
            .where(and(
                eq(semesterSummaries.studentId, studentId),
                eq(semesterSummaries.sessionId, sessionId),
                eq(semesterSummaries.semester, semester as "1"|"2")
            ));

        await db.insert(transactions).values({
            studentId,
            amount: amount.toString(),
            type: "debit",
            purpose: "Course Registration Print Fee",
            status: "completed",
            gateway: "alatpay",
            gatewayReference: reference,
            gatewayTransactionId: gatewayTxId
        });

        return { success: true };
    } catch(e: any) {
        return { success: false, error: e.message };
    }
}

