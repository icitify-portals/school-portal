"use server";

import { MaintenanceService } from "@/services/MaintenanceService";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";

export async function cleanupDuplicateUsersAction() {
    try {
        const isAuth = await hasRole("superadmin") || await hasRole("it_admin");
        if (!isAuth) throw new Error("Unauthorized: Super Admin access required");

        const result = await MaintenanceService.cleanupDuplicateUsers();
        revalidatePath("/admin/system/maintenance");
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteInvalidTeachersAction() {
    try {
        const isAuth = await hasRole("superadmin");
        if (!isAuth) throw new Error("Unauthorized");

        const result = await MaintenanceService.deleteInvalidTeachers();
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function triggerLedgerCachingAction() {
    try {
        const isAuth = await hasRole("superadmin") || await hasRole("bursar");
        if (!isAuth) throw new Error("Unauthorized");

        const result = await MaintenanceService.cacheAllIndividualLedgers();
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function syncPaymentModesAction() {
    try {
        const isAuth = await hasRole("superadmin") || await hasRole("bursar");
        if (!isAuth) throw new Error("Unauthorized");

        // @ts-expect-error - TS2339: Auto-suppressed for build
        const result = await MaintenanceService.syncPaymentGatewayModes();
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
