"use server";

import { UserService } from "@/services/UserService";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";

export async function setUserPermissionAction(userId: number, permissionKey: string, isGranted: boolean) {
    try {
        const isAuth = await hasRole("superadmin") || await hasRole("it_admin");
        if (!isAuth) throw new Error("Unauthorized: Permission management requires Super Admin clearance.");

        const grantedBy = 1; // Current Admin Placeholder
        await UserService.setPermission(userId, permissionKey, isGranted, grantedBy);
        revalidatePath("/admin/users/permissions");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateOfficeDescriptionAction(userId: number, description: string) {
    try {
        const isAuth = await hasRole("superadmin") || await hasRole("admin");
        if (!isAuth) throw new Error("Unauthorized");

        await UserService.describeOffice(userId, description);
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function changeUserBranchAction(userId: number, branchId: number) {
    try {
        const isAuth = await hasRole("superadmin");
        if (!isAuth) throw new Error("Unauthorized");

        await UserService.changeBranch(userId, branchId);
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteUserAction(userId: number) {
    try {
        const isAuth = await hasRole("superadmin");
        if (!isAuth) throw new Error("Unauthorized");

        await UserService.deleteUser(userId);
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
