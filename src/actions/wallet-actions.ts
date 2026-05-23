"use server";

import { WalletService } from "@/services/WalletService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getStudentWalletStatusAction(studentId: number) {
    try {
        const student = await db.select({ 
            balance: students.walletBalance 
        })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);

        const history = await WalletService.getWalletHistory(studentId);

        return { 
            success: true, 
            balance: student[0]?.balance || "0.00", 
            history 
        };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function processWalletPaymentAction(studentId: number, amount: number, purpose: string) {
    try {
        const result = await WalletService.payFromWallet(studentId, amount, purpose);
        revalidatePath("/student/finance/wallet");
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * In a real app, this would be called by a Webhook from Paystack/Flutterwave
 */
export async function simulateTopUpAction(studentId: number, amount: number) {
    try {
        const ref = `SIM-${Date.now()}`;
        await WalletService.creditWallet(studentId, amount, ref);
        revalidatePath("/student/finance/wallet");
        return { success: true, reference: ref };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
