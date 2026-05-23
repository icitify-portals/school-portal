"use server";

import { db } from "@/db/db";
import { studentCourseTransfers, students, faculties, departments, users, institutionalUnits } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function submitTransferRequest(data: {
    studentId: number;
    matricNumber: string;
    currentFacultyId: number;
    currentDeptId: number;
    currentLevel: number;
    currentDegreeInView: string;
    proposedFacultyId: number;
    proposedDeptId: number;
    proposedLevel: number;
    proposedDegreeInView: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // Check for existing pending request
        const existing = await db.query.studentCourseTransfers.findFirst({
            where: and(
                eq(studentCourseTransfers.studentId, data.studentId),
                eq(studentCourseTransfers.finalStatus, "pending")
            )
        });

        if (existing) return { success: false, error: "You already have a pending transfer request." };

        await db.insert(studentCourseTransfers).values({
            ...data,
            finalStatus: "pending"
        });

        revalidatePath("/student/transfer");
        return { success: true };
    } catch (error) {
        console.error("Transfer submission failed:", error);
        return { success: false, error: "Internal server error" };
    }
}

export async function processTransferApproval(
    transferId: number, 
    stage: 'admissions' | 'present_hod' | 'present_dean' | 'proposed_officer' | 'proposed_hod' | 'proposed_dean',
    status: 'eligible' | 'not_eligible' | 'agreed' | 'not_agreed' | 'satisfied' | 'not_satisfied' | 'accepted' | 'not_accepted',
    note?: string
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const userId = parseInt(session.user.id);
        const updateData: any = {};

        switch (stage) {
            case 'admissions':
                updateData.admissionsOfficerStatus = status;
                updateData.admissionsOfficerId = userId;
                updateData.admissionsOfficerNote = note;
                updateData.admissionsOfficerSignedAt = new Date();
                break;
            case 'present_hod':
                updateData.presentHodStatus = status;
                updateData.presentHodId = userId;
                updateData.presentHodSignedAt = new Date();
                break;
            case 'present_dean':
                updateData.presentDeanStatus = status;
                updateData.presentDeanId = userId;
                updateData.presentDeanSignedAt = new Date();
                break;
            case 'proposed_officer':
                updateData.proposedFacultyOfficerStatus = status;
                updateData.proposedFacultyOfficerId = userId;
                updateData.proposedFacultyOfficerSignedAt = new Date();
                break;
            case 'proposed_hod':
                updateData.proposedHodStatus = status;
                updateData.proposedHodId = userId;
                updateData.proposedHodSignedAt = new Date();
                break;
            case 'proposed_dean':
                updateData.proposedDeanStatus = status;
                updateData.proposedDeanId = userId;
                updateData.proposedDeanSignedAt = new Date();
                break;
        }

        await db.update(studentCourseTransfers)
            .set(updateData)
            .where(eq(studentCourseTransfers.id, transferId));

        revalidatePath("/admin/transfers");
        return { success: true };
    } catch (error) {
        console.error("Approval failed:", error);
        return { success: false, error: "Internal server error" };
    }
}

export async function finalizeTransfer(transferId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const transfer = await db.query.studentCourseTransfers.findFirst({
            where: eq(studentCourseTransfers.id, transferId)
        });

        if (!transfer) return { success: false, error: "Transfer request not found" };

        // Ensure all previous stages are completed/approved (Simplified check for demo)
        if (transfer.proposedDeanStatus !== "accepted") {
            return { success: false, error: "Proposed Faculty Dean has not yet accepted this transfer." };
        }

        const userId = parseInt(session.user.id);

        await db.transaction(async (tx) => {
            // 1. Update Student record
            await tx.update(students)
                .set({
                    deptId: transfer.proposedDeptId,
                    currentLevel: transfer.proposedLevel,
                    // Note: Faculty is usually derived from Department in our schema via programme, 
                    // but if students table has programmeId, we should update that too.
                })
                .where(eq(students.id, transfer.studentId));

            // 2. Mark transfer as completed
            await tx.update(studentCourseTransfers)
                .set({
                    finalStatus: "completed",
                    operationsManagerId: userId,
                    effectedAt: new Date()
                })
                .where(eq(studentCourseTransfers.id, transferId));
        });

        revalidatePath("/admin/transfers");
        return { success: true };
    } catch (error) {
        console.error("Finalization failed:", error);
        return { success: false, error: "Internal server error" };
    }
}

export async function getPendingTransfersForStaff(userId: number) {
    // This logic would fetch transfers where the current user is the HOD/Dean of the relevant unit
    // Simplified for now: fetch all
    const results = await db.select({
        transfer: studentCourseTransfers,
        student: students,
        currentDept: departments,
        proposedDept: departments, // This is tricky with double joins to same table
        currentFaculty: faculties,
        proposedFaculty: faculties
    })
    .from(studentCourseTransfers)
    .innerJoin(students, eq(studentCourseTransfers.studentId, students.id))
    .innerJoin(departments, eq(studentCourseTransfers.currentDeptId, departments.id))
    .innerJoin(faculties, eq(studentCourseTransfers.currentFacultyId, faculties.id));

    // To handle multiple joins to same table (Dept/Faculty), it's often cleaner for MariaDB < 10.10
    // to just fetch the base and then fetch the related info if the list is small, 
    // or use aliases in drizzle select. 
    // Let's use the alias approach or just sequential fetch for clarity in this refactor.

    const baseTransfers = await db.select().from(studentCourseTransfers);
    if (baseTransfers.length === 0) return [];

    const studentIds = Array.from(new Set(baseTransfers.map(t => t.studentId)));
    const deptIds = Array.from(new Set([...baseTransfers.map(t => t.currentDeptId), ...baseTransfers.map(t => t.proposedDeptId)]));
    const facultyIds = Array.from(new Set([...baseTransfers.map(t => t.currentFacultyId), ...baseTransfers.map(t => t.proposedFacultyId)]));

    const [allStudents, allDepts, allFaculties] = await Promise.all([
        db.select().from(students).where(inArray(students.id, studentIds)),
        db.select().from(departments).where(inArray(departments.id, deptIds)),
        db.select().from(faculties).where(inArray(faculties.id, facultyIds))
    ]);

    return baseTransfers.map(t => ({
        ...t,
        student: allStudents.find(s => s.id === t.studentId),
        currentDept: allDepts.find(d => d.id === t.currentDeptId),
        proposedDept: allDepts.find(d => d.id === t.proposedDeptId),
        currentFaculty: allFaculties.find(f => f.id === t.currentFacultyId),
        proposedFaculty: allFaculties.find(f => f.id === t.proposedFacultyId)
    }));
}
