"use server";

import { InventoryService } from "@/services/InventoryService";
import { AssetService } from "@/services/AssetService";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";

export async function recordInventoryTransactionAction(data: {
    itemId: number,
    quantity: number,
    type: 'purchase' | 'issuance' | 'adjustment' | 'return',
    recipientId?: number,
    notes?: string
}) {
    try {
        const isAuth = await hasPermission("inventory.items.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("store_keeper");
        if (!isAuth) throw new Error("Unauthorized: Store Keeper access required");

        const recordedBy = 1; // Current User Placeholder
        await InventoryService.recordTransaction({ ...data, recordedBy });
        revalidatePath("/admin/inventory");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getInventoryStatusAction() {
    try {
        const masterList = await InventoryService.getInventoryMasterList();
        const lowStock = await InventoryService.getLowStockAlerts();
        return { success: true, masterList, lowStock };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function registerFixedAssetAction(data: {
    name: string,
    purchaseDate: Date,
    purchasePrice: number,
    usefulLifeYears: number
}) {
    try {
        const isAuth = await hasRole("admin") || await hasRole("superadmin");
        if (!isAuth) throw new Error("Unauthorized");

        await AssetService.registerAsset(data);
        revalidatePath("/admin/assets");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
