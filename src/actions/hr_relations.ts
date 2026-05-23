"use server";

import { db } from "@/db/db";
import { disciplinaryRecords, staffTraining, exitRecords, staffProfiles, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// --- DISCIPLINARY RECORDS ---
export async function getDisciplinaryRecords(staffId?: number) {
    let query = db.select({
        record: disciplinaryRecords,
        staff: staffProfiles,
        user: users,
    })
        .from(disciplinaryRecords)
        .innerJoin(staffProfiles, eq(disciplinaryRecords.staffId, staffProfiles.id))
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .$dynamic();

    if (staffId) {
        query = query.where(eq(disciplinaryRecords.staffId, staffId));
    }

    return await query.orderBy(desc(disciplinaryRecords.incidentDate));
}

export async function logDisciplinaryAction(data: any) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await db.insert(disciplinaryRecords).values({
            ...data,
            recordedBy: parseInt(session.user.id),
            incidentDate: new Date(data.incidentDate),
        });
        revalidatePath("/admin/hr/relations");
        return { success: true };
    } catch (error) {
        console.error("Log disciplinary action error:", error);
        return { success: false, error: "Failed to log action" };
    }
}

// --- STAFF TRAINING ---
export async function getStaffTraining(staffId?: number) {
    let query = db.select({
        training: staffTraining,
        staff: staffProfiles,
        user: users,
    })
        .from(staffTraining)
        .innerJoin(staffProfiles, eq(staffTraining.staffId, staffProfiles.id))
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .$dynamic();

    if (staffId) {
        query = query.where(eq(staffTraining.staffId, staffId));
    }

    return await query.orderBy(desc(staffTraining.completionDate));
}

export async function registerTraining(data: any) {
    try {
        await db.insert(staffTraining).values({
            ...data,
            completionDate: data.completionDate ? new Date(data.completionDate) : null,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            status: data.status || 'completed',
        });
        revalidatePath("/admin/hr/relations");
        return { success: true };
    } catch (error) {
        console.error("Register training error:", error);
        return { success: false, error: "Failed to register training" };
    }
}

export async function verifyStaffTraining(id: number, status: 'verified' | 'rejected') {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await db.update(staffTraining)
            .set({
                status,
                verifiedBy: parseInt(session.user.id),
                verifiedAt: new Date()
            })
            .where(eq(staffTraining.id, id));
        revalidatePath("/admin/hr/relations");
        return { success: true };
    } catch (error) {
        console.error("Verify training error:", error);
        return { success: false, error: "Failed to verify training" };
    }
}

// --- EXIT MANAGEMENT ---
export async function getExitRecords() {
    return await db.select({
        record: exitRecords,
        staff: staffProfiles,
        user: users,
    })
        .from(exitRecords)
        .innerJoin(staffProfiles, eq(exitRecords.staffId, staffProfiles.id))
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .orderBy(desc(exitRecords.lastWorkingDay));
}

export async function initiateExitWorkflow(data: any) {
    try {
        await db.insert(exitRecords).values({
            ...data,
            lastWorkingDay: new Date(data.lastWorkingDay),
        });
        // Mark staff as inactive when exit is initiated? Or only when completed?
        // For now, just log the record.
        revalidatePath("/admin/hr/relations");
        return { success: true };
    } catch (error) {
        console.error("Initiate exit error:", error);
        return { success: false, error: "Failed to initiate exit" };
    }
}

export async function updateExitStatus(id: number, status: any, clearanceStatus?: any) {
    try {
        const updateData: any = { status };
        if (clearanceStatus) updateData.clearanceStatus = clearanceStatus;

        await db.update(exitRecords)
            .set(updateData)
            .where(eq(exitRecords.id, id));

        // If completed, maybe deactivate staff profile
        if (status === 'completed') {
            const [exit] = await db.select().from(exitRecords).where(eq(exitRecords.id, id)).limit(1);
            if (exit) {
                await db.update(staffProfiles)
                    .set({ isActive: false })
                    .where(eq(staffProfiles.id, exit.staffId));
            }
        }

        revalidatePath("/admin/hr/relations");
        return { success: true };
    } catch (error) {
        console.error("Update exit status error:", error);
        return { success: false, error: "Failed to update exit status" };
    }
}
