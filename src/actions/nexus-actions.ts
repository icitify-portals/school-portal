"use server";

import { NexusOrchestratorService } from "@/services/NexusOrchestratorService";
import { hasRole } from "@/lib/rbac";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * High-authority actions for the Institutional Nexus.
 * Restricted strictly to Super Administrators.
 */

export async function synchronizeNodeFromCloudAction(nodeId: string) {
    try {
        const session = await auth();
        if (!session || !(await hasRole("superadmin"))) {
            throw new Error("Unauthorized: Nexus operations require Super Administrator clearance.");
        }

        const userId = parseInt((session?.user as any)?.id || "0");
        const result = await NexusOrchestratorService.synchronizeFromCloud(nodeId, userId);
        revalidatePath("/admin/system/nexus");
        return result;
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function orchestrateNodeSetupAction(nodeId: string, schoolName: string) {
    try {
        const session = await auth();
        if (!session || !(await hasRole("superadmin"))) {
            throw new Error("Unauthorized");
        }

        const userId = parseInt((session?.user as any)?.id || "0");
        const result = await NexusOrchestratorService.orchestrateNodeSetup(nodeId, schoolName, userId);
        revalidatePath("/");
        return result;
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function listCloudNodesAction() {
    try {
        if (!(await hasRole("superadmin"))) throw new Error("Unauthorized");
        return await NexusOrchestratorService.listCloudNodes();
    } catch (error) {
        return [];
    }
}
