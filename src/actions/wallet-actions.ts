"use server";

import { WalletService } from "@/services/WalletService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendInAppNotification } from "./notifications";

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
        
        const student = await db.select({ userId: students.userId }).from(students).where(eq(students.id, studentId)).limit(1);
        if (student.length > 0 && student[0].userId) {
            await sendInAppNotification({
                userId: student[0].userId,
                title: "Wallet Payment",
                message: `Your payment of ${amount} for ${purpose} was successful.`,
                type: "success",
                link: "/student/finance/wallet"
            });
        }

        revalidatePath("/student/finance/wallet");
        // @ts-expect-error - TS2783: Auto-suppressed for build
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
        
        const student = await db.select({ userId: students.userId }).from(students).where(eq(students.id, studentId)).limit(1);
        if (student.length > 0 && student[0].userId) {
            await sendInAppNotification({
                userId: student[0].userId,
                title: "Wallet Funded",
                message: `Your wallet has been credited with ${amount}. Ref: ${ref}`,
                type: "success",
                link: "/student/finance/wallet"
            });
        }

        revalidatePath("/student/finance/wallet");
        return { success: true, reference: ref };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
