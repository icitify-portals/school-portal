"use server";

import { db } from "@/db/db";
import {
    payrollLogs,
    staffProfiles,
    users,
    salaryStructures
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";

export async function getMyPayslips() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const [profile] = await db.select()
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, parseInt(session.user.id)))
        .limit(1);

    if (!profile) return [];

    return await db.select()
        .from(payrollLogs)
        .where(eq(payrollLogs.staffId, profile.id))
        .orderBy(desc(payrollLogs.year), desc(payrollLogs.month));
}

export async function getPayslipDetails(logId: number) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const results = await db.select({
        log: payrollLogs,
        staff: staffProfiles,
        user: users
    })
        .from(payrollLogs)
        .innerJoin(staffProfiles, eq(payrollLogs.staffId, staffProfiles.id))
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .where(eq(payrollLogs.id, logId))
        .limit(1);

    if (results.length === 0) return null;

    // Security check: ensure the staff member can only see their own payslip 
    // (unless they are admin, but staff portal handles this)
    if ((session.user as any).role !== 'admin' && results[0].user.id !== parseInt(session.user.id)) {
        return null;
    }

    return results[0];
}
