import { db } from "@/db/db";
import { institutionalUnits } from "@/db/schema";
import { eq } from "drizzle-orm";

export class SchoolService {
    
    /**
     * Retrieves the report sheet template code for a specific institutional unit.
     */
    static async getReportSheetTemplateCode(unitId: number): Promise<string> {
        const [unit] = await db.select({ settings: institutionalUnits.settings })
            .from(institutionalUnits)
            .where(eq(institutionalUnits.id, unitId))
            .limit(1);

        if (!unit?.settings) return "STANDARD_K12";

        try {
            const settings = JSON.parse(unit.settings);
            return settings.reportSheetTemplateCode || "STANDARD_K12";
        } catch (e) {
            console.error("Failed to parse unit settings:", e);
            return "STANDARD_K12";
        }
    }

    /**
     * Updates academic settings for an institutional unit.
     */
    static async updateUnitSettings(unitId: number, newSettings: any) {
        const [unit] = await db.select({ settings: institutionalUnits.settings })
            .from(institutionalUnits)
            .where(eq(institutionalUnits.id, unitId))
            .limit(1);

        let currentSettings = {};
        if (unit?.settings) {
            try {
                currentSettings = JSON.parse(unit.settings);
            } catch (e) {}
        }

        const updatedSettings = { ...currentSettings, ...newSettings };

        return await db.update(institutionalUnits)
            .set({ settings: JSON.stringify(updatedSettings) })
            .where(eq(institutionalUnits.id, unitId));
    }
    /**
     * Determines if positions/rankings should be displayed for a specific institutional unit.
     */
    static async shouldShowPosition(unitId: number): Promise<boolean> {
        const [unit] = await db.select({ settings: institutionalUnits.settings })
            .from(institutionalUnits)
            .where(eq(institutionalUnits.id, unitId))
            .limit(1);

        if (!unit?.settings) return true;

        try {
            const settings = JSON.parse(unit.settings);
            return settings.showPosition !== undefined ? settings.showPosition : true;
        } catch (e) {
            return true;
        }
    }
    /**
     * Retrieves all branches (institutional units).
     * Matches 'School::branches(&pool)' from Rust.
     */
    static async listBranches() {
        return await db.select({ name: institutionalUnits.name })
            .from(institutionalUnits);
    }

    /**
     * Adds a new branch.
     * Matches 'School::add_branch(&args.branch, &pool)' from Rust.
     */
    static async addBranch(name: string) {
        const code = name.toUpperCase().replace(/\s+/g, "_").slice(0, 40) + "_" + Date.now().toString().slice(-4);
        const slug = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString().slice(-4);
        
        return await db.insert(institutionalUnits).values({
            name,
            code,
            slug,
            type: 'branch',
            isActive: true
        });
    }

    /**
     * Deletes a branch by name.
     * Matches 'School::delete_branch(&args.branch, &pool)' from Rust.
     */
    static async deleteBranch(name: string) {
        return await db.delete(institutionalUnits)
            .where(eq(institutionalUnits.name, name));
    }

    /**
     * Renames a branch.
     * Matches 'school.change_branch_name(&args.new_branch)' from Rust.
     */
    static async renameBranch(oldName: string, newName: string) {
        return await db.update(institutionalUnits)
            .set({ name: newName })
            .where(eq(institutionalUnits.name, oldName));
    }
}
