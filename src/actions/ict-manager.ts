"use server";

import { db } from "@/db/db";
import { idCards, users, students, departments, programmes, staffProfiles, semesterSummaries, studentCourseRegistrations, courses, academicSessions } from "@/db/schema";
import { eq, and, inArray, sql, desc, or } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function ensureICTManager() {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { role: true }
    });
    if (!user || !["admin", "ict_manager", "registrar", "superadmin"].includes(user.role || "")) {
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
        const { courseDepartmentSettings, transactions } = await import("@/db/schema");
        const { resolveLevel } = await import("@/lib/levels");

        const limit = filters?.limit || 100;
        const offset = filters?.offset || 0;
        const activeSession = await db.query.academicSessions.findFirst({
            where: eq(academicSessions.isCurrent, true)
        });
        const sessionId = filters?.sessionId || activeSession?.id || 41;
        const sessionRow = filters?.sessionId
            ? await db.query.academicSessions.findFirst({ where: eq(academicSessions.id, sessionId) })
            : activeSession;
        const sessionName = (sessionRow?.name || activeSession?.name || "2026/2027").replace("/", "-");
        const semester = filters?.semester || activeSession?.currentSemester || '1';
        const semesterLabel = semester === '2' ? 'Second Semester' : 'First Semester';

        // Get students who have registered courses or are active in session
        const rows = await db.select({
            studentId: students.id,
            studentName: users.name,
            firstName: students.firstName,
            lastName: students.lastName,
            otherNames: students.otherNames,
            matricNumber: students.matricNumber,
            admissionNumber: students.admissionNumber,
            jambNumber: students.jambNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            studyMode: students.studyMode,
            imageUrl: students.imageUrl,
            signatureUrl: students.signatureUrl,
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
            sql`${students.deletedAt} IS NULL`,
            or(
                eq(students.currentSessionId, sessionId),
                sql`${students.id} IN (SELECT student_id FROM student_course_registrations WHERE session_id = ${sessionId})`
            )
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
                (r.matricNumber || '').toLowerCase().includes(q) ||
                (r.admissionNumber || '').toLowerCase().includes(q)
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
            courseName: sql<string>`COALESCE(${courseDepartmentSettings.courseTitle}, ${courses.name})`,
            creditUnits: sql<number>`COALESCE(${courseDepartmentSettings.creditUnits}, ${courses.creditUnits})`.mapWith(Number),
            status: courseDepartmentSettings.status,
            courseLevel: courseDepartmentSettings.level,
            advisorStatus: studentCourseRegistrations.advisorStatus,
            hodStatus: studentCourseRegistrations.hodStatus,
            finalStatus: studentCourseRegistrations.finalStatus,
        })
        .from(studentCourseRegistrations)
        .innerJoin(courses, eq(studentCourseRegistrations.courseId, courses.id))
        .innerJoin(students, eq(studentCourseRegistrations.studentId, students.id))
        .leftJoin(courseDepartmentSettings, and(
            eq(courseDepartmentSettings.courseId, courses.id),
            eq(courseDepartmentSettings.deptId, students.deptId),
            sql`${studentCourseRegistrations.semester} = ${courseDepartmentSettings.semester}`
        ))
        .where(and(
            inArray(studentCourseRegistrations.studentId, studentIds),
            eq(studentCourseRegistrations.sessionId, sessionId),
            eq(studentCourseRegistrations.semester, semester as any)
        )) : [];

        // Also check completed print fee transactions
        const paidPrintTxs = studentIds.length > 0 ? await db.select({
            studentId: transactions.studentId
        })
        .from(transactions)
        .where(and(
            inArray(transactions.studentId, studentIds),
            eq(transactions.status, "completed"),
            sql`(${transactions.purpose} LIKE '%Print Fee%' OR ${transactions.purpose} LIKE '%Course Form%' OR ${transactions.gatewayReference} LIKE 'PRINT_%')`
        )) : [];
        const paidStudentIds = new Set(paidPrintTxs.map(t => t.studentId));

        // Group registrations by student
        const regMap = new Map<number, any[]>();
        for (const reg of registrations) {
            if (!regMap.has(reg.studentId)) regMap.set(reg.studentId, []);
            regMap.get(reg.studentId)!.push(reg);
        }

        const result = filtered.map(r => {
            const resolvedLvl = resolveLevel(r.currentLevel, r.programmeType);
            const ownNumericLevel = resolvedLvl?.numeric || 100;
            const matricOrReg = r.matricNumber || r.admissionNumber || r.jambNumber || '';
            const fullName = (`${r.lastName || ''} ${r.firstName || ''} ${r.otherNames || ''}`.trim() || r.studentName || '').toUpperCase();
            let programLabel = 'FULL-TIME';
            if (matricOrReg.toUpperCase().includes('/DPP/')) {
                programLabel = 'DPP';
            } else if (matricOrReg.toUpperCase().includes('/PT/') || r.studyMode === 'part_time') {
                programLabel = 'PART-TIME';
            } else if (r.studyMode) {
                programLabel = r.studyMode.replace('_', '-').toUpperCase();
            }

            const studentCourses = (regMap.get(r.studentId) || []).map((c: any) => ({
                ...c,
                statusCode: c.status === 'elective' ? 'E' : c.status === 'required' ? 'R' : 'C',
                isCarryOver: Boolean(c.courseLevel && c.courseLevel < ownNumericLevel),
            }));

            return {
                ...r,
                matricNumber: matricOrReg,
                fullName,
                levelLabel: resolvedLvl?.label || `${r.programmeType || ''} ${r.currentLevel || ''}`.trim(),
                program: programLabel,
                sessionSemester: `${sessionName} ${semesterLabel}`,
                isPrintFeePaid: Boolean(r.isPrintFeePaid || paidStudentIds.has(r.studentId)),
                courses: studentCourses,
                courseCount: studentCourses.length,
                totalUnits: studentCourses.reduce((sum: number, c: any) => sum + (c.creditUnits || 0), 0),
            };
        });

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}