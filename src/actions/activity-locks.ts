"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasPermission, hasRole } from "@/lib/rbac";
import {
    getActivityLocks,
    createActivityLock,
    updateActivityLock,
    deleteActivityLock,
    ACTIVITIES,
    ACTIVITY_LABELS,
    ACTIVITY_SCOPES,
    type ActivityLockInput,
    type ActivityScope,
} from "@/services/ActivityLockService";

async function canManage(): Promise<boolean> {
    return (await hasPermission("system.settings.manage")) || (await hasRole("admin")) || (await hasRole("superadmin"));
}

async function currentUserId(): Promise<number | null> {
    try {
        const session = await auth();
        const id = (session as any)?.user?.id;
        return typeof id === 'number' ? id : typeof id === 'string' ? parseInt(id) || null : null;
    } catch {
        return null;
    }
}

function revalidateAdminPaths() {
    revalidatePath('/admin/settings/activity-locks');
    revalidatePath('/admin');
}

export async function getActivityLocksAction() {
    const allowed = await canManage();
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };
    try {
        const locks = await getActivityLocks();
        return { success: true, locks, activities: ACTIVITIES, activityLabels: ACTIVITY_LABELS, scopes: ACTIVITY_SCOPES };
    } catch (error: any) {
        return { success: false, error: error?.message || "Failed to load activity locks" };
    }
}

export async function createActivityLockAction(input: Omit<ActivityLockInput, 'createdBy'>) {
    const allowed = await canManage();
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };
    try {
        if (!input.activity || !input.scope) return { success: false, error: "Activity and scope are required" };
        const created = await createActivityLock({ ...input, createdBy: await currentUserId() });
        revalidateAdminPaths();
        return { success: true, lock: created };
    } catch (error: any) {
        return { success: false, error: error?.message || "Failed to create activity lock" };
    }
}

export async function updateActivityLockAction(id: number, input: Partial<ActivityLockInput>) {
    const allowed = await canManage();
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };
    try {
        const updated = await updateActivityLock(id, input);
        if (!updated) return { success: false, error: "Activity lock not found" };
        revalidateAdminPaths();
        return { success: true, lock: updated };
    } catch (error: any) {
        return { success: false, error: error?.message || "Failed to update activity lock" };
    }
}

export async function toggleActivityLockAction(id: number, isLocked: boolean) {
    const allowed = await canManage();
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };
    try {
        const updated = await updateActivityLock(id, { isLocked });
        if (!updated) return { success: false, error: "Activity lock not found" };
        revalidateAdminPaths();
        return { success: true, lock: updated };
    } catch (error: any) {
        return { success: false, error: error?.message || "Failed to toggle activity lock" };
    }
}

export async function deleteActivityLockAction(id: number) {
    const allowed = await canManage();
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };
    try {
        await deleteActivityLock(id);
        revalidateAdminPaths();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.message || "Failed to delete activity lock" };
    }
}

export type { ActivityKey, ActivityLockContext, ActivityUnlockResult } from "@/services/ActivityLockService";