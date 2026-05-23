"use server";

import { UserService } from "@/services/UserService";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";
import { cookies } from "next/headers";

export async function viewUserAccountAction(targetUserId: number) {
    try {
        const isSuperAdmin = await hasRole("superadmin");
        if (!isSuperAdmin) throw new Error("Unauthorized: Identity assumption is restricted to Super Administrators.");

        const adminId = 1; // Current Admin Placeholder
        const { token, targetName } = await UserService.viewAccount(adminId, targetUserId);

        // In a real app, you would set a temporary session cookie here
        // cookies().set("session_token", token);
        
        return { 
            success: true, 
            message: `Identity assumed: You are now viewing the portal as ${targetName}.`,
            token 
        };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateUserPropertyAction(userId: number, property: string, value: string) {
    try {
        // Self-update check or Admin check
        const isAdmin = await hasRole("admin") || await hasRole("superadmin");
        const currentUserId = 1; // Placeholder
        
        if (!isAdmin && userId !== currentUserId) {
            throw new Error("Unauthorized: You can only update your own profile.");
        }

        await UserService.updateProfile(userId, property, value);
        revalidatePath("/user/profile/studio");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
