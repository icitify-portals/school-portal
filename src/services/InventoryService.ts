import { db } from "@/db/db";
import { 
    inventoryItems, 
    inventoryTransactions, 
    inventorySuppliers, 
    users, 
    institutionalUnits 
} from "@/db/schema";
import { eq, sql, and, desc, lt } from "drizzle-orm";

export class InventoryService {

    /**
     * Records a stock transaction (Purchase, Issuance, etc.)
     * and updates the master inventory stock levels.
     */
    static async recordTransaction(data: {
        itemId: number,
        quantity: number,
        type: 'purchase' | 'issuance' | 'adjustment' | 'return',
        recordedBy: number,
        supplierId?: number,
        recipientId?: number,
        notes?: string
    }) {
        return await db.transaction(async (tx) => {
            // 1. Record the transaction log
            await tx.insert(inventoryTransactions).values({
                itemId: data.itemId,
                quantity: data.quantity.toString(),
                type: data.type,
                recordedBy: data.recordedBy,
                supplierId: data.supplierId,
                recipientId: data.recipientId,
                notes: data.notes
            });

            // 2. Update stock levels based on transaction type
            const multiplier = (data.type === 'purchase' || data.type === 'return') ? 1 : -1;
            const adjustment = data.quantity * multiplier;

            await tx.update(inventoryItems)
                .set({ 
                    quantityInStock: sql`${inventoryItems.quantityInStock} + ${adjustment}` 
                })
                .where(eq(inventoryItems.id, data.itemId));
            
            return { success: true };
        });
    }

    /**
     * Identifies items that are below the institutional reorder level.
     */
    static async getLowStockAlerts() {
        return await db.select()
            .from(inventoryItems)
            .where(sql`${inventoryItems.quantityInStock} <= ${inventoryItems.reorderLevel}`);
    }

    /**
     * Retrieves the master inventory list with category and unit details.
     */
    static async getInventoryMasterList() {
        return await db.select({
            id: inventoryItems.id,
            name: inventoryItems.name,
            sku: inventoryItems.sku,
            stock: inventoryItems.quantityInStock,
            reorder: inventoryItems.reorderLevel,
            unit: inventoryItems.unitOfMeasure
        })
        .from(inventoryItems)
        .orderBy(desc(inventoryItems.createdAt));
    }
}
