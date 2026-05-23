"use server";

import { db } from "@/db/db";
import { vendors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";

async function ensureVendorManagementAccess() {
    const isBursar = await hasRole("bursar");
    const isStaff = await hasRole("bursary_staff");
    if (!isBursar && !isStaff) throw new Error("Unauthorized vendor management access");
}

export async function getVendors() {
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
}

export async function createVendor(data: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    bankName?: string;
    accountNumber?: string;
    category?: string;
}) {
    try {
        await ensureVendorManagementAccess();
        await db.insert(vendors).values(data);
        revalidatePath("/admin/accounting/vendors");
        return { success: true };
    } catch (error) {
        console.error("Failed to create vendor:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function updateVendorStatus(id: number, isActive: boolean) {
    try {
        await ensureVendorManagementAccess();
        await db.update(vendors).set({ isActive }).where(eq(vendors.id, id));
        revalidatePath("/admin/accounting/vendors");
        return { success: true };
    } catch (error) {
        console.error("Failed to update vendor status:", error);
        return { success: false, error: (error as Error).message };
    }
}
