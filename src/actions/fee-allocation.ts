"use server";

import { db } from "@/db/db";
import { feeItems, chartOfAccounts, feeAllocationRules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";

async function ensureFinanceAccess() {
    const isBursar = await hasPermission("finance.fee.manage") || await hasRole("bursar") || await hasRole("superadmin");
    if (!isBursar) throw new Error("Unauthorized: Finance access required");
}

export async function getAllocationData() {
    try {
        await ensureFinanceAccess();
        
        const [items, accounts] = await Promise.all([
            db.select().from(feeItems),
            db.select().from(chartOfAccounts).where(eq(chartOfAccounts.isActive, true))
        ]);

        return { success: true, feeItems: items, accounts };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getRulesForFee(feeItemId: number) {
    try {
        await ensureFinanceAccess();
        const rules = await db.select()
            .from(feeAllocationRules)
            .where(eq(feeAllocationRules.feeItemId, feeItemId));
        
        return { success: true, data: rules };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function saveAllocationRules(feeItemId: number, rules: Array<{ targetAccountId: number, percentage?: string, fixedAmount?: string, priority: number }>) {
    try {
        await ensureFinanceAccess();

        return await db.transaction(async (tx) => {
            // 1. Clear existing rules
            await tx.delete(feeAllocationRules).where(eq(feeAllocationRules.feeItemId, feeItemId));

            // 2. Insert new rules
            if (rules.length > 0) {
                await tx.insert(feeAllocationRules).values(
                    rules.map(r => ({
                        feeItemId,
                        targetAccountId: r.targetAccountId,
                        percentage: r.percentage,
                        fixedAmount: r.fixedAmount,
                        priority: r.priority
                    }))
                );
            }

            revalidatePath("/admin/finance/fees/allocation");
            return { success: true };
        });
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
