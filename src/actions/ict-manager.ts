"use server";

import { db } from "@/db/db";
import { idCards, users, students, departments, programmes, staffProfiles, semesterSummaries, studentCourseRegistrations, courses } from "@/db/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function ensureICTManager() {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { role: true }
    });
    if (!user || !["admin", "ict_manager", "registrar"].includes(user.role || "")) {
        throw new Error("Access denied. ICT Manager or Admin role required.");
    }
    return session.user.id;
}

export async function getPrintQueue(filters?: {
    status?: string;
    departmentId?: number;
    programmeType?: string;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    try {
        await ensureICTManager();

        const limit = filters?.limit || 50;
        const offset = filters?.offset || 0;

        let whereConditions = eq(idCards.userType, "student");

        if (filters?.status && filters.status !== "all") {
            whereConditions = and(whereConditions, eq(idCards.printStatus, filters.status as any));
        }

        const cards = await db.select({
            id: idCards.id,
            userId: idCards.userId,
            issueId: idCards.issueId,
            cardType: idCards.cardType,
            printStatus: idCards.printStatus,
            assignedTo: idCards.assignedTo,
            assignedAt: idCards.assignedAt,
            printedAt: idCards.printedAt,
            deliveredAt: idCards.deliveredAt,
            printNotes: idCards.printNotes,
            issuedAt: idCards.issuedAt,
            studentName: users.name,
            matricNumber: students.matricNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            deptId: students.deptId,
            deptName: departments.name,
            photoUrl: students.imageUrl,
            phoneNumber: users.phone,
            assignedStaffName: sql<string>`(SELECT name FROM users WHERE id = ${idCards.assignedTo})`,
        })
        .from(idCards)
        .innerJoin(users, eq(idCards.userId, users.id))
        .leftJoin(students, eq(users.id, students.userId))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(whereConditions)
        .orderBy(desc(idCards.issuedAt))
        .limit(limit)
        .offset(offset);

        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
            .from(idCards)
            .where(whereConditions);

        return { success: true, data: cards, total: count };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [], total: 0 };
    }
}

export async function getICTStaff() {
    try {
        await ensureICTManager();
        const staff = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
        })
        .from(users)
        .where(inArray(users.role, ["ict_manager", "staff", "admin"]))
        .orderBy(users.name);

        return { success: true, data: staff };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}

export async function assignPrintJob(cardIds: number[], staffId: number) {
    try {
        await ensureICTManager();

        if (!cardIds.length) throw new Error("No cards selected");
        if (!staffId) throw new Error("No staff member selected");

        await db.update(idCards)
            .set({
                printStatus: "assigned",
                assignedTo: staffId,
                assignedAt: new Date(),
            })
            .where(inArray(idCards.id, cardIds));

        revalidatePath("/admin/ict/print-queue");
        return { success: true, message: `${cardIds.length} card(s) assigned successfully.` };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function bulkUpdatePrintStatus(cardIds: number[], status: string, notes?: string) {
    try {
        await ensureICTManager();

        if (!cardIds.length) throw new Error("No cards selected");

        const updateData: any = { printStatus: status };
        if (status === "printed") updateData.printedAt = new Date();
        if (status === "delivered") updateData.deliveredAt = new Date();
        if (notes) updateData.printNotes = notes;

        await db.update(idCards)
            .set(updateData)
            .where(inArray(idCards.id, cardIds));

        revalidatePath("/admin/ict/print-queue");
        return { success: true, message: `${cardIds.length} card(s) updated to ${status}.` };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getMyAssignedPrintJobs() {
    try {
        const session = await auth();
        if (!session?.user) throw new Error("Not authenticated");

        const cards = await db.select({
            id: idCards.id,
            userId: idCards.userId,
            issueId: idCards.issueId,
            cardType: idCards.cardType,
            printStatus: idCards.printStatus,
            assignedAt: idCards.assignedAt,
            printedAt: idCards.printedAt,
            deliveredAt: idCards.deliveredAt,
            printNotes: idCards.printNotes,
            issuedAt: idCards.issuedAt,
            studentName: users.name,
            matricNumber: students.matricNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            deptName: departments.name,
            photoUrl: students.imageUrl,
        })
        .from(idCards)
        .innerJoin(users, eq(idCards.userId, users.id))
        .leftJoin(students, eq(users.id, students.userId))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(eq(idCards.assignedTo, session.user.id))
        .orderBy(desc(idCards.assignedAt));

        return { success: true, data: cards };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}

export async function getPrintQueueStats() {
    try {
        await ensureICTManager();

        const stats = await db.select({
            status: idCards.printStatus,
            count: sql<number>`count(*)`,
        })
        .from(idCards)
        .where(eq(idCards.userType, "student"))
        .groupBy(idCards.printStatus);

        return { success: true, data: stats };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}

export async function issueBatchIDCards(userIds: number[]) {
    try {
        await ensureICTManager();

        if (!userIds.length) throw new Error("No users selected");

        const issued = [];
        for (const userId of userIds) {
            // Check if already has active card
            const existing = await db.query.idCards.findFirst({
                where: and(
                    eq(idCards.userId, userId),
                    eq(idCards.status, "active")
                ),
            });

            if (existing) {
                // Update to physical_print if not already
                if (existing.cardType !== "physical_print") {
                    await db.update(idCards)
                        .set({ cardType: "physical_print" })
                        .where(eq(idCards.id, existing.id));
                }
                issued.push({ userId, issueId: existing.issueId, status: "updated" });
            } else {
                // Issue new card
                const { v4: uuidv4 } = await import("uuid");
                const issueId = `ID-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                const verificationCode = uuidv4();
                const expiresAt = new Date();
                expiresAt.setFullYear(expiresAt.getFullYear() + 4);

                await db.insert(idCards).values({
                    userId,
                    userType: "student",
                    cardType: "physical_print",
                    issueId,
                    verificationCode,
                    expiresAt,
                    status: "active",
                    printStatus: "pending",
                });
                issued.push({ userId, issueId, status: "issued" });
            }
        }

        revalidatePath("/admin/ict/print-queue");
        return { success: true, message: `${issued.length} card(s) issued/updated.`, data: issued };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ──────────────────────────────────────────────────────────────
// Course Registration Print Management
// ──────────────────────────────────────────────────────────────

export async function getCourseRegistrationPrintQueue(filters?: {
    departmentId?: number;
    programmeType?: string;
    sessionId?: number;
    semester?: string;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    try {
        await ensureICTManager();

        const limit = filters?.limit || 50;
        const offset = filters?.offset || 0;
        const sessionId = filters?.sessionId || 6;
        const semester = filters?.semester || '1';

        // Get students who have registered courses and paid print fee
        const rows = await db.select({
            studentId: students.id,
            studentName: users.name,
            firstName: students.firstName,
            lastName: students.lastName,
            matricNumber: students.matricNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            deptId: students.deptId,
            deptName: departments.name,
            sessionId: semesterSummaries.sessionId,
            semester: semesterSummaries.semester,
            isPrintFeePaid: semesterSummaries.isPrintFeePaid,
            tcr: semesterSummaries.tcr,
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .leftJoin(semesterSummaries, and(
            eq(semesterSummaries.studentId, students.id),
            eq(semesterSummaries.sessionId, sessionId),
            eq(semesterSummaries.semester, semester as any)
        ))
        .where(and(
            eq(students.status, 'active'),
            eq(students.deletedAt, null as any),
            eq(students.currentSessionId, sessionId),
        ))
        .orderBy(users.name)
        .limit(limit)
        .offset(offset);

        // Filter by search
        let filtered = rows;
        if (filters?.search) {
            const q = filters.search.toLowerCase();
            filtered = rows.filter(r =>
                (r.studentName || '').toLowerCase().includes(q) ||
                (r.matricNumber || '').toLowerCase().includes(q)
            );
        }
        if (filters?.departmentId) {
            filtered = filtered.filter(r => r.deptId === filters.departmentId);
        }
        if (filters?.programmeType) {
            filtered = filtered.filter(r => r.programmeType === filters.programmeType);
        }

        // Get registered courses for each student
        const studentIds = filtered.map(r => r.studentId);
        const registrations = studentIds.length > 0 ? await db.select({
            studentId: studentCourseRegistrations.studentId,
            courseId: studentCourseRegistrations.courseId,
            courseCode: courses.code,
            courseName: courses.name,
            creditUnits: courses.creditUnits,
            advisorStatus: studentCourseRegistrations.advisorStatus,
            hodStatus: studentCourseRegistrations.hodStatus,
            finalStatus: studentCourseRegistrations.finalStatus,
        })
        .from(studentCourseRegistrations)
        .innerJoin(courses, eq(studentCourseRegistrations.courseId, courses.id))
        .where(and(
            inArray(studentCourseRegistrations.studentId, studentIds),
            eq(studentCourseRegistrations.sessionId, sessionId),
            eq(studentCourseRegistrations.semester, semester as any)
        )) : [];

        // Group registrations by student
        const regMap = new Map<number, any[]>();
        for (const reg of registrations) {
            if (!regMap.has(reg.studentId)) regMap.set(reg.studentId, []);
            regMap.get(reg.studentId)!.push(reg);
        }

        const result = filtered.map(r => ({
            ...r,
            courses: regMap.get(r.studentId) || [],
            courseCount: (regMap.get(r.studentId) || []).length,
            totalUnits: (regMap.get(r.studentId) || []).reduce((sum, c) => sum + (c.creditUnits || 0), 0),
        }));

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}