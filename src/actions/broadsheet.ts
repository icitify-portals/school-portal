"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { staffProfiles, staffClassAssignments, staffSubjectAssignments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { BroadsheetService } from "@/services/BroadsheetService";

export async function getBroadsheetAction(
    groupId: number,
    sessionId: number,
    semester: number
) {
    const sessionUser = await auth();
    const user = sessionUser?.user as any;
    if (!user) return { success: false, error: "Unauthorized" };

    const role = user.role;
    const userId = parseInt(user.id);

    try {
        let authorized = false;

        // Admins, Superadmins, DVCs get global access
        if (role === 'admin' || role === 'superadmin' || role === 'dvc') {
            authorized = true;
        } else if (role === 'staff') {
            // Check HOD/Dean clearance, or check specific class teacher assignment
            const [staff] = await db.select({ id: staffProfiles.id })
                .from(staffProfiles)
                .where(eq(staffProfiles.userId, userId))
                .limit(1);

            if (staff) {
                // 1. Check if assigned as Class Teacher
                const [classAsg] = await db.select()
                    .from(staffClassAssignments)
                    .where(and(
                        eq(staffClassAssignments.staffProfileId, staff.id),
                        eq(staffClassAssignments.groupId, groupId),
                        eq(staffClassAssignments.sessionId, sessionId)
                    ))
                    .limit(1);

                if (classAsg) {
                    authorized = true;
                } else {
                    // 2. Check if assigned to any subject in this class group
                    const [subjAsg] = await db.select()
                        .from(staffSubjectAssignments)
                        .where(and(
                            eq(staffSubjectAssignments.staffProfileId, staff.id),
                            eq(staffSubjectAssignments.groupId, groupId),
                            eq(staffSubjectAssignments.sessionId, sessionId)
                        ))
                        .limit(1);
                    
                    if (subjAsg) {
                        authorized = true;
                    }
                }
            }
        }

        if (!authorized) {
            return { success: false, error: "You are not authorized to view the broadsheet for this class." };
        }

        const data = await BroadsheetService.compileClassBroadsheet(groupId, sessionId, semester);
        if (!data) return { success: false, error: "Failed to compile broadsheet data" };

        return { success: true, data };

    } catch (error: any) {
        console.error("Broadsheet Action Error:", error);
        return { success: false, error: error.message || "Failed to load broadsheet" };
    }
}
