"use server";

import { db } from "@/db/db";
import { fixedAssets, depreciationLogs, chartOfAccounts, assetMaintenanceLogs, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";
import { recordTransaction } from "./accounting";

async function ensureAssetManager() {
    const isBursar = await hasPermission("finance.ledger.manage") || await hasRole("bursar");
    const isAdmin = await hasRole("admin");
    if (!isBursar && !isAdmin) throw new Error("Unauthorized: Asset management requires Bursar/Admin role");
}

export async function getFixedAssets() {
    try {
        const assets = await db.select().from(fixedAssets).orderBy(desc(fixedAssets.purchaseDate));
        const allAccounts = await db.select().from(chartOfAccounts);
        const allLogs = await db.select().from(depreciationLogs);

        return assets.map(asset => ({
            ...asset,
            glAccount: allAccounts.find(a => a.id === asset.glAccountId),
            depAccount: allAccounts.find(a => a.id === asset.depAccountId),
            accumDepAccount: allAccounts.find(a => a.id === asset.accumDepAccountId),
            depreciationLogs: allLogs.filter(l => l.assetId === asset.id)
        }));
    } catch (error) {
        console.error("Failed to fetch fixed assets:", error);
        return [];
    }
}

export async function createFixedAsset(data: {
    name: string;
    description?: string;
    purchaseDate: Date;
    purchasePrice: string;
    salvageValue?: string;
    usefulLifeYears: number;
    depreciationMethod?: 'straight_line' | 'double_declining';
    glAccountId?: number;
    depAccountId?: number;
    accumDepAccountId?: number;
}) {
    try {
        await ensureAssetManager();
        await db.insert(fixedAssets).values({
            ...data,
            status: 'active'
        });
        revalidatePath("/admin/accounting/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to create fixed asset:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function runDepreciationForMonth(month: string) { // Format: YYYY-MM
    try {
        await ensureAssetManager();
        const assets = await db.select().from(fixedAssets).where(eq(fixedAssets.status, 'active'));

        const results = await db.transaction(async (tx) => {
            const processed = [];
            for (const asset of assets) {
                // Simplistic Straight-Line Depreciation
                const cost = parseFloat(asset.purchasePrice);
                const salvage = parseFloat(asset.salvageValue || "0");
                const life = asset.usefulLifeYears;

                if (life <= 0) continue;

                const annualDep = (cost - salvage) / life;
                const monthlyDep = annualDep / 12;

                // 1. Record Log
                await tx.insert(depreciationLogs).values({
                    assetId: asset.id,
                    amount: monthlyDep.toFixed(2),
                    period: month
                });

                // 2. Post to GL (Simulated)
                if (asset.depAccountId && asset.accumDepAccountId) {
                    await recordTransaction({
                        description: `Depreciation: ${asset.name} - ${month}`,
                        recordedBy: 1, // System
                        entries: [
                            { accountId: asset.depAccountId, debit: monthlyDep.toFixed(2), credit: "0" },    // Expense (Depreciation) DR ↑
                            { accountId: asset.accumDepAccountId, debit: "0", credit: monthlyDep.toFixed(2) } // Contra-Asset (Accum. Dep) CR ↑
                        ]
                    });
                }

                processed.push({ id: asset.id, amount: monthlyDep });
            }
            return processed;
        });

        revalidatePath("/admin/accounting/assets");
        return { success: true, processedCount: results.length };
    } catch (error) {
        console.error("Depreciation run failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function disposeAsset(id: number, disposalPrice: number, reason: string, bankAccountId: number) {
    try {
        await ensureAssetManager();
        await db.update(fixedAssets)
            .set({ status: 'disposed' })
            .where(eq(fixedAssets.id, id));

        revalidatePath("/admin/accounting/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to dispose asset:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function addAssetMaintenance(
    assetId: number,
    title: string,
    description: string | undefined,
    cost: number,
    performedBy: string | undefined,
    creditAccountId?: number,
    nextServiceDate?: Date
) {
    const data = {
        assetId,
        title,
        description,
        cost: cost.toString(),
        performedBy,
        nextServiceDate,
        maintenanceDate: new Date(),
        postToGL: !!creditAccountId
    };
    try {
        await ensureAssetManager();
        await db.transaction(async (tx) => {
            await tx.insert(assetMaintenanceLogs).values({
                assetId: data.assetId,
                title: data.title,
                description: data.description,
                maintenanceDate: data.maintenanceDate,
                cost: data.cost,
                performedBy: data.performedBy,
                nextServiceDate: data.nextServiceDate
            });

            // If it's a significant cost that needs to be capitalized or recorded as expense
            if (data.postToGL && parseFloat(data.cost) > 0) {
                const [asset] = await tx.select().from(fixedAssets).where(eq(fixedAssets.id, data.assetId));
                if (asset?.depAccountId) {
                    await recordTransaction({
                        description: `Maintenance: ${asset.name} - ${data.title}`,
                        recordedBy: 1,
                        entries: [
                            { accountId: asset.depAccountId, debit: data.cost, credit: "0" }, // Maintenance Expense DR ↑
                            { accountId: 1, debit: "0", credit: data.cost } // Bank/Cash CR ↓ (Assuming account 1 is cash for now)
                        ]
                    });
                }
            }
        });

        revalidatePath("/admin/accounting/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to add asset maintenance:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function revalueAsset(assetId: number, newValuation: number, reason: string) {
    try {
        await ensureAssetManager();
        await db.update(fixedAssets)
            .set({
                currentValuation: newValuation.toString(),
                lastRevaluedAt: new Date(),
                description: sql`CONCAT(${fixedAssets.description}, '\n[REVALUATION]: ', ${reason})`
            })
            .where(eq(fixedAssets.id, assetId));

        revalidatePath("/admin/accounting/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to revalue asset:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getAssetDetails(id: number) {
    try {
        const [asset] = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id));
        if (!asset) return null;

        const maintenance = await db.select().from(assetMaintenanceLogs)
            .where(eq(assetMaintenanceLogs.assetId, id))
            .orderBy(desc(assetMaintenanceLogs.maintenanceDate));

        const logs = await db.select().from(depreciationLogs)
            .where(eq(depreciationLogs.assetId, id))
            .orderBy(desc(depreciationLogs.recordedAt));

        return { ...asset, maintenance, depreciationLogs: logs };
    } catch (error) {
        console.error("Failed to fetch asset details:", error);
        return null;
    }
}
