"use server";

import { SchoolFunctionService } from "@/services/SchoolFunctionService";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";

async function ensureDevAccess() {
    // This matches the 'Clearance::IcitifyDev' scope in the Rust code
    const isDev = await hasRole("icitify_dev") || await hasRole("superadmin");
    if (!isDev) throw new Error("Unauthorized: Developer access required");
}

export async function getSchoolFunction(branchId: number, property: string) {
    try {
        await ensureDevAccess();
        const result = await SchoolFunctionService.get(branchId, property);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function setSchoolFunction(data: {
    branchId: number,
    property: string,
    value: string,
    description?: string
}) {
    try {
        await ensureDevAccess();
        
        // Validate before saving
        const v = await SchoolFunctionService.validate(data.value);
        if (!v.valid) return { success: false, error: `Syntax Error: ${v.error}` };

        await SchoolFunctionService.set(data.branchId, data.property, data.value, data.description);
        revalidatePath("/admin/system/functions");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function listSchoolFunctions(branchId: number) {
    try {
        await ensureDevAccess();
        const result = await SchoolFunctionService.getAll(branchId);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function validateFunctionScript(script: string) {
    try {
        await ensureDevAccess();
        return await SchoolFunctionService.validate(script);
    } catch (error) {
        return { valid: false, error: (error as Error).message };
    }
}
