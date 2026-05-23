import { db } from "@/db/db";
import { 
    fixedAssets, 
    assetMaintenanceLogs, 
    chartOfAccounts 
} from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export class AssetService {

    /**
     * Registers a new institutional fixed asset.
     */
    static async registerAsset(data: {
        name: string,
        description?: string,
        purchaseDate: Date,
        purchasePrice: number,
        usefulLifeYears: number,
        salvageValue?: number,
        glAccountId?: number
    }) {
        return await db.insert(fixedAssets).values({
            name: data.name,
            description: data.description,
            purchaseDate: data.purchaseDate,
            purchasePrice: data.purchasePrice.toString(),
            usefulLifeYears: data.usefulLifeYears,
            salvageValue: data.salvageValue?.toString() || "0.00",
            glAccountId: data.glAccountId,
            currentValuation: data.purchasePrice.toString()
        });
    }

    /**
     * Records maintenance work performed on an asset.
     */
    static async logMaintenance(data: {
        assetId: number,
        title: string,
        description?: string,
        cost: number,
        maintenanceDate: Date
    }) {
        return await db.insert(assetMaintenanceLogs).values({
            assetId: data.assetId,
            title: data.title,
            description: data.description,
            cost: data.cost.toString(),
            maintenanceDate: data.maintenanceDate
        });
    }

    /**
     * Computes the current book value of an asset using Straight-Line Depreciation.
     */
    static async computeCurrentBookValue(assetId: number) {
        const asset = await db.select().from(fixedAssets).where(eq(fixedAssets.id, assetId)).limit(1);
        if (!asset[0]) return null;

        const a = asset[0];
        const cost = parseFloat(a.purchasePrice);
        const salvage = parseFloat(a.salvageValue || "0");
        const life = a.usefulLifeYears;
        const purchaseDate = new Date(a.purchaseDate);
        const currentDate = new Date();

        const yearsHeld = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        const annualDepreciation = (cost - salvage) / life;
        const totalDepreciation = Math.min(annualDepreciation * yearsHeld, cost - salvage);

        const bookValue = cost - totalDepreciation;

        // Update current valuation in DB
        await db.update(fixedAssets).set({ currentValuation: bookValue.toFixed(2) }).where(eq(fixedAssets.id, assetId));

        return bookValue;
    }
}
