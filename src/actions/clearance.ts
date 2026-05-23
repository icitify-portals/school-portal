"use server";

import { db } from "@/db/db";
import { studentClearances, studentLedger, students, users, bursarySettings, programmes, departments } from "@/db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";
import { v4 as uuidv4 } from 'uuid';
import { getCurrentSession } from "./portal";

// Helper to get clearance threshold
async function getClearanceThreshold() {
    const settings = await db.select().from(bursarySettings);
    const threshold = settings.find(s => s.key === 'clearance_min_payment_percentage')?.value || "70";
    return parseFloat(threshold);
}

export async function getClearanceStatus(studentId: number, academicYear: string, semester: '1' | '2' | 'both') {
    try {
        // 1. Get current clearance record if exists
        const [existing] = await db.select().from(studentClearances).where(
            and(
                eq(studentClearances.studentId, studentId),
                eq(studentClearances.academicYear, academicYear),
                eq(studentClearances.semester, semester)
            )
        );

        // 2. Calculate balance from ledger
        const ledger = await db.select().from(studentLedger).where(eq(studentLedger.studentId, studentId));
        const totalDebit = ledger.reduce((sum, e) => sum + parseFloat(e.debit || "0"), 0);
        const totalCredit = ledger.reduce((sum, e) => sum + parseFloat(e.credit || "0"), 0);

        const percentagePaid = totalDebit > 0 ? (totalCredit / totalDebit) * 100 : 0;
        const threshold = await getClearanceThreshold();

        return {
            existing,
            totalDebit,
            totalCredit,
            percentagePaid,
            threshold,
            isEligible: percentagePaid >= threshold || totalDebit === 0
        };
    } catch (error) {
        console.error("Failed to get clearance status:", error);
        return null;
    }
}

export async function syncClearanceStatus(studentId: number, academicYear: string, semester: '1' | '2' | 'both') {
    try {
        const stats = await getClearanceStatus(studentId, academicYear, semester);
        if (!stats) return { success: false, error: "Failed to calculate status" };

        const newStatus = stats.isEligible ? 'cleared' : 'blocked';

        if (stats.existing) {
            // Only auto-update if it wasn't manually overridden
            if (stats.existing.clearedByType === 'auto') {
                if (stats.existing.status !== newStatus) {
                    await db.update(studentClearances)
                        .set({
                            status: newStatus,
                            clearanceCode: newStatus === 'cleared' ? (stats.existing.clearanceCode || uuidv4()) : null,
                            updatedAt: new Date()
                        })
                        .where(eq(studentClearances.id, stats.existing.id));
                }
            }
        } else {
            await db.insert(studentClearances).values({
                studentId,
                academicYear,
                semester,
                status: newStatus,
                clearedByType: 'auto',
                clearanceCode: newStatus === 'cleared' ? uuidv4() : null
            });
        }

        revalidatePath("/admin/bursary/clearance");
        revalidatePath("/student/clearance");
        return { success: true };
    } catch (error) {
        console.error("Sync failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function manuallyClearStudent(data: {
    studentId: number;
    academicYear: string;
    semester: '1' | '2' | 'both';
    approvedBy: number;
    notes?: string;
}) {
    try {
        const isBursar = await hasRole("bursar");
        if (!isBursar) throw new Error("Unauthorized: Only Bursar can manually clear students");

        const [existing] = await db.select().from(studentClearances).where(
            and(
                eq(studentClearances.studentId, data.studentId),
                eq(studentClearances.academicYear, data.academicYear),
                eq(studentClearances.semester, data.semester)
            )
        );

        if (existing) {
            await db.update(studentClearances)
                .set({
                    status: 'cleared',
                    clearedByType: 'manual',
                    approvedBy: data.approvedBy,
                    notes: data.notes,
                    clearanceCode: existing.clearanceCode || uuidv4(),
                    updatedAt: new Date()
                })
                .where(eq(studentClearances.id, existing.id));
        } else {
            await db.insert(studentClearances).values({
                ...data,
                status: 'cleared',
                clearedByType: 'manual',
                clearanceCode: uuidv4()
            });
        }

        revalidatePath("/admin/bursary/clearance");
        return { success: true };
    } catch (error) {
        console.error("Manual clearance failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getClearanceStats() {
    try {
        const allStudents = await db.select().from(students);
        const clearances = await db.select().from(studentClearances);

        const total = allStudents.length;
        const clearedCount = clearances.filter(c => c.status === 'cleared').length;
        const blockedCount = clearances.filter(c => c.status === 'blocked').length;
        const pendingCount = total - clearances.length;

        return {
            total,
            clearedCount,
            blockedCount,
            pendingCount,
            clearedPercentage: total > 0 ? (clearedCount / total) * 100 : 0
        };
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return { total: 0, clearedCount: 0, blockedCount: 0, pendingCount: 0, clearedPercentage: 0 };
    }
}

export async function getClearanceList() {
    try {
        const studentList = await db
            .select({
                student: students,
                user: users,
                programme: programmes,
                department: departments,
            })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(programmes.deptId, departments.id));

        if (studentList.length === 0) return [];

        const studentIds = studentList.map(s => s.student.id);

        // Fetch relations separately to avoid JSON functions
        const allClearances = await db.select().from(studentClearances).where(sql`${studentClearances.studentId} IN (${sql.join(studentIds, sql`, `)})`);
        const allLedger = await db.select().from(studentLedger).where(sql`${studentLedger.studentId} IN (${sql.join(studentIds, sql`, `)})`);

        const threshold = await getClearanceThreshold();

        return studentList.map(s => {
            const studentClearancesList = allClearances.filter(c => c.studentId === s.student.id);
            const currentClearance = studentClearancesList[0];
            const studentLedgerEntries = allLedger.filter(e => e.studentId === s.student.id);

            const totalDebit = studentLedgerEntries.reduce((sum, e) => sum + parseFloat(e.debit || "0"), 0);
            const totalCredit = studentLedgerEntries.reduce((sum, e) => sum + parseFloat(e.credit || "0"), 0);
            const percentagePaid = totalDebit > 0 ? (totalCredit / totalDebit) * 100 : 0;

            // Injected session logic will be handled at the start of the function or via a separate call
            // For this mapping, we rely on the caller or default to current
            const currentYear = "2025/2026";
            // TODO: Ideally pass currentSession name into this mapping from the top level

            return {
                id: s.student.id,
                name: s.user.name,
                regNumber: s.student.id.toString().padStart(6, '0'),
                programme: s.programme?.name,
                department: s.department?.name,
                totalDebit,
                totalCredit,
                percentagePaid,
                status: currentClearance?.status || 'pending',
                type: currentClearance?.clearedByType,
                isEligible: percentagePaid >= threshold || totalDebit === 0
            };
        });
    } catch (error) {
        console.error("Failed to fetch clearance list:", error);
        return [];
    }
}

export async function getStudentClearance(userId: number) {
    try {
        const [student] = await db.select().from(students).where(eq(students.userId, userId));
        if (!student) return null;

        const currentSession = await getCurrentSession();
        const yearToUse = currentSession?.name || "2025/2026";
        const semesterToUse = (currentSession?.currentSemester as '1' | '2') || "1";

        const stats = await getClearanceStatus(student.id, yearToUse, semesterToUse);
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        return {
            student,
            user: user[0],
            stats
        };
    } catch (error) {
        console.error("Failed to fetch student clearance:", error);
        return null;
    }
}
