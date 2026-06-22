"use server";

import { db } from "@/db";
import { staffLoans, cashAdvances, staffProfiles, loanTemplates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBursaryStaffLoans() {
    try {
        const loans = await db.query.staffLoans.findMany({
            with: {
                staff: {
                    with: { user: true }
                },
                template: true,
                approver: true
            },
            orderBy: [desc(staffLoans.createdAt)]
        });
        return { success: true, data: loans };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateLoanStatus(id: number, status: 'approved' | 'rejected' | 'disbursed' | 'completed', userId: number) {
    try {
        await db.update(staffLoans).set({ 
            status,
            approvedBy: ['approved', 'disbursed'].includes(status) ? userId : undefined,
            disbursementDate: status === 'disbursed' ? new Date() : undefined
        }).where(eq(staffLoans.id, id));
        
        revalidatePath("/admin/bursary/staff-loans");
        revalidatePath("/admin/hr/loans");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getBursaryCashAdvances() {
    try {
        const advances = await db.query.cashAdvances.findMany({
            with: {
                staff: {
                    with: { user: true }
                }
            },
            orderBy: [desc(cashAdvances.createdAt)]
        });
        return { success: true, data: advances };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateCashAdvanceStatus(id: number, status: 'approved' | 'rejected' | 'disbursed' | 'retired', approvedAmount?: number) {
    try {
        const updateData: any = { status };
        if (approvedAmount) {
            updateData.approvedAmount = approvedAmount;
        }
        if (status === 'disbursed') {
            updateData.disbursementDate = new Date();
        }
        await db.update(cashAdvances).set(updateData).where(eq(cashAdvances.id, id));
        
        revalidatePath("/admin/bursary/staff-loans");
        revalidatePath("/admin/hr/loans");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
