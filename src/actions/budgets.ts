"use server";

import { db } from "@/db/db";
import { budgets, expenditureRequests, departments } from "@/db/schema";
import { eq, and, sql, sum, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";

import { getCurrentSession } from "./portal";

async function ensureBursar() {
    const isBursar = await hasRole("bursar");
    const isAdmin = await hasRole("admin");
    if (!isBursar && !isAdmin) throw new Error("Unauthorized: Only the Bursar or Admin can manage budgets");
}

export async function getBudgets() {
    try {
        const allBudgets = await db.select().from(budgets).orderBy(desc(budgets.academicYear));
        const allDepts = await db.select().from(departments);

        return allBudgets.map(b => ({
            ...b,
            department: allDepts.find(d => d.id === b.departmentId)
        }));
    } catch (error) {
        console.error("Failed to fetch budgets:", error);
        return [];
    }
}

export async function createBudget(data: {
    departmentId: number;
    academicYear: string;
    amount: string;
    category: 'operating' | 'capital' | 'personnel' | 'research';
    notes?: string;
}) {
    try {
        await ensureBursar();
        await db.insert(budgets).values({
            ...data,
            status: 'active'
        });
        revalidatePath("/admin/accounting/budgets");
        return { success: true };
    } catch (error) {
        console.error("Failed to create budget:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getBudgetAnalysis(departmentId: number, academicYear?: string) {
    try {
        let yearToUse = academicYear;
        if (!yearToUse) {
            const currentSession = await getCurrentSession();
            yearToUse = currentSession?.name || "2025/2026"; // Fallback if no session set
        }

        // 1. Get total budget for this dept & year
        const [budget] = await db.select({
            total: sum(budgets.amount)
        })
            .from(budgets)
            .where(
                and(
                    eq(budgets.departmentId, departmentId),
                    eq(budgets.academicYear, yearToUse)
                )
            );

        // 2. Get total actual expenditure (disbursed)
        const [actual] = await db.select({
            total: sum(expenditureRequests.amount)
        })
            .from(expenditureRequests)
            .where(
                and(
                    eq(expenditureRequests.departmentId, departmentId),
                    eq(expenditureRequests.status, 'disbursed')
                    // Note: ideally we should filter by academic year too if expenditure had that field,
                    // but we can correlate by date if needed. For now, total disbursed for dept.
                )
            );

        const budgetAmount = parseFloat(budget?.total || "0");
        const actualAmount = parseFloat(actual?.total || "0");

        return {
            budget: budgetAmount,
            actual: actualAmount,
            remaining: budgetAmount - actualAmount,
            utilization: budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0
        };
    } catch (error) {
        console.error("Budget analysis failed:", error);
        return { budget: 0, actual: 0, remaining: 0, utilization: 0 };
    }
}
