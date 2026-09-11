"use server";

import { unifyCbt } from "@/services/migration/unifyCbt";
import { hasRole } from "@/lib/rbac";

/**
 * CBT-2: Trigger the unified CBT migration manually.
 * Requires admin/superadmin. Always defaults to dry-run.
 */
export async function runUnifyCbtMigration({
    dryRun = true,
}: { dryRun?: boolean } = {}) {
    const isAdmin = await hasRole(["admin", "superadmin"]);
    if (!isAdmin) {
        return { success: false, error: "Unauthorized: admin or superadmin required" };
    }

    try {
        const report = await unifyCbt({ dryRun, checkFlag: true });
        return { success: true, report };
    } catch (error: any) {
        console.error("[runUnifyCbtMigration] error:", error);
        return { success: false, error: error.message || "Migration failed" };
    }
}
