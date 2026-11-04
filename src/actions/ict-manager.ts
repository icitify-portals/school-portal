"use server";

import { db } from "@/db/db";
import { 
    idCards, 
    users, 
    students, 
    departments, 
    programmes, 
    staffProfiles, 
    semesterSummaries, 
    studentCourseRegistrations, 
    courses, 
    academicSessions,
    admissionApplicationsV2,
    transactions,
    payment_transactions 
} from "@/db/schema";
import { eq, and, inArray, sql, desc, or, like, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";
import { viewableAssetUrl } from "@/lib/assets";

const ALLOWED_ICT_ROLES = [
    "admin",
    "superadmin",
    "super-admin",
    "super_admin",
    "developer",
    "icitify_dev",
    "ict_manager",
    "ict manager",
    "registrar"
];

async function ensureICTManager() {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");

    const userId = session.user.id ? parseInt(String(session.user.id)) : 0;
    const sessionRole = ((session.user as any)?.role || "").toString().toLowerCase().trim();
    const sessionRoles = (((session.user as any)?.roles || []) as string[]).map(r => r.toLowerCase().trim());

    if (
        ALLOWED_ICT_ROLES.includes(sessionRole) ||
        sessionRoles.some(r => ALLOWED_ICT_ROLES.includes(r))
    ) {
        return session.user.id;
    }

    // Check RBAC helper
    try {
        const isAllowedByRbac = await hasRole(ALLOWED_ICT_ROLES);
        if (isAllowedByRbac) {
            return session.user.id;
        }
    } catch (e) {
        // continue to DB check
    }

    // Direct database fallback
    if (userId) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { role: true }
        });
        const userDbRole = (user?.role || "").toString().toLowerCase().trim();
        if (user && ALLOWED_ICT_ROLES.includes(userDbRole)) {
            return session.user.id;
        }
    }

    throw new Error("Access denied. ICT Manager or Admin role required.");
}

export async function getPrintQueue(filters?: {
    status?: string;
    departmentId?: number;
    programmeType?: string;
    level?: string | number;
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

        if (filters?.level && filters.level !== "all") {
            const parsedLvl = parseInt(String(filters.level));
            if (!isNaN(parsedLvl)) {
                whereConditions = and(whereConditions, eq(students.currentLevel, parsedLvl));
            }
        }

        if (filters?.programmeType && filters.programmeType !== "all") {
            whereConditions = and(whereConditions, eq(students.programmeType, filters.programmeType as any));
        }

        if (filters?.search) {
            const q = `%${filters.search}%`;
            whereConditions = and(
                whereConditions,
                or(like(users.name, q), like(students.matricNumber, q), like(idCards.issueId, q))
            );
        }

        const cards = await db.select({
            id: idCards.id,
            userId: idCards.userId,
            studentId: students.id,
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
            signatureUrl: students.signatureUrl,
            phoneNumber: users.phone,
            assignedStaffName: sql<string>`(SELECT name FROM users WHERE id = ${idCards.assignedTo})`,
        })
        .from(idCards)
        .innerJoin(users, eq(idCards.userId, users.id))
        .leftJoin(students, and(eq(users.id, students.userId), isNull(students.deletedAt)))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(whereConditions)
        .orderBy(desc(idCards.issuedAt))
        .limit(limit)
        .offset(offset);

        // Fallback photo and signature resolution from admission applications for freshmen
        const enhancedCards = await Promise.all(cards.map(async (c) => {
            let photoUrl = c.photoUrl;
            let signatureUrl = c.signatureUrl;

            if ((!photoUrl || !signatureUrl) && (c.studentId || c.userId)) {
                try {
                    const orConds = [];
                    if (c.studentId) orConds.push(eq(admissionApplicationsV2.studentId, c.studentId));
                    if (c.userId) orConds.push(eq(admissionApplicationsV2.applicantId, c.userId));
                    if (orConds.length > 0) {
                        const [app] = await db.select({
                            applicantPhoto: admissionApplicationsV2.applicantPhoto,
                            data: admissionApplicationsV2.data
                        }).from(admissionApplicationsV2).where(or(...orConds)).limit(1);

                        if (app) {
                            if (!photoUrl) {
                                if (app.applicantPhoto) {
                                    photoUrl = app.applicantPhoto;
                                } else if (app.data) {
                                    try {
                                        const d = typeof app.data === 'string' ? JSON.parse(app.data) : app.data;
                                        photoUrl = d['Photograph/camera'] || d['Passport Photograph'] || d['Passport Photo'] || d['Passport'] || d['photo'] || d['Photo'] || d['Photograph'] || null;
                                    } catch(e) {}
                                }
                            }
                            if (!signatureUrl && app.data) {
                                try {
                                    const d = typeof app.data === 'string' ? JSON.parse(app.data) : app.data;
                                    signatureUrl = d['Signature'] || d['signature'] || d['Applicant Signature'] || d['Student Signature'] || null;
                                } catch(e) {}
                            }
                        }
                    }
                } catch(e) {}
            }

            // Sync resolved assets back to students record if currently missing
            if (c.studentId) {
                const updates: any = {};
                if (!c.photoUrl && photoUrl) updates.imageUrl = photoUrl;
                if (!c.signatureUrl && signatureUrl) updates.signatureUrl = signatureUrl;
                if (Object.keys(updates).length > 0) {
                    db.update(students).set(updates).where(eq(students.id, c.studentId)).catch(() => {});
                }
            }

            return {
                ...c,
                photoUrl: viewableAssetUrl(photoUrl) || photoUrl || undefined,
                signatureUrl: viewableAssetUrl(signatureUrl) || signatureUrl || undefined
            };
        }));

        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
            .from(idCards)
            .innerJoin(users, eq(idCards.userId, users.id))
            .leftJoin(students, and(eq(users.id, students.userId), isNull(students.deletedAt)))
            .where(whereConditions);

        return { success: true, data: enhancedCards, total: count };
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
        .where(inArray(users.role, ["ict_manager", "staff", "admin", "superadmin", "super-admin", "developer", "icitify_dev"]))
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
        .leftJoin(students, and(eq(users.id, students.userId), isNull(students.deletedAt)))
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

        // Fetch students to check level & eligibility rules
        const studentRows = await db.select({
            userId: students.userId,
            currentLevel: students.currentLevel,
            programmeType: students.programmeType,
            hasPhoto: sql<number>`(${students.imageUrl} IS NOT NULL AND ${students.imageUrl} <> '')`,
            hasSignature: sql<number>`(${students.signatureUrl} IS NOT NULL AND ${students.signatureUrl} <> '')`,
            studentName: users.name,
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(inArray(students.userId, userIds));

        const studentMap = new Map(studentRows.map(s => [s.userId, s]));

        // Check ND 2 / HND 2 restriction: must have photo AND signature
        for (const uid of userIds) {
            const s = studentMap.get(uid);
            if (s) {
                const lvl = parseInt(String(s.currentLevel || 1));
                const isReturning = lvl === 2 || lvl === 200 || lvl === 400 || lvl === 4;
                if (isReturning && (!Number(s.hasPhoto) || !Number(s.hasSignature))) {
                    throw new Error(`Student ${s.studentName} (ND 2 / HND 2) cannot be processed without both photograph and signature. Please update via Profile or ICT Photo Capture.`);
                }
            }
        }

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
                        .set({ cardType: "physical_print", printStatus: "pending" })
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

/** Full card data for the PVC batch print view (front + back per card). */
export async function getPrintCardsByIds(cardIds: number[]) {
    try {
        await ensureICTManager();
        if (!cardIds.length) throw new Error("No cards selected");

        const cards = await db.select({
            id: idCards.id,
            userId: idCards.userId,
            studentId: students.id,
            issueId: idCards.issueId,
            verificationCode: idCards.verificationCode,
            studentName: users.name,
            matricNumber: students.matricNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            deptName: departments.name,
            photoUrl: students.imageUrl,
            signatureUrl: students.signatureUrl,
            phoneNumber: users.phone,
        })
        .from(idCards)
        .innerJoin(users, eq(idCards.userId, users.id))
        .leftJoin(students, and(eq(users.id, students.userId), isNull(students.deletedAt)))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(inArray(idCards.id, cardIds))
        .orderBy(users.name);

        // Enhance with fallback photos and signatures from admission applications
        const enhancedCards = await Promise.all(cards.map(async (c) => {
            let photoUrl = c.photoUrl;
            let signatureUrl = c.signatureUrl;

            if ((!photoUrl || !signatureUrl) && (c.studentId || c.userId)) {
                try {
                    const orConds = [];
                    if (c.studentId) orConds.push(eq(admissionApplicationsV2.studentId, c.studentId));
                    if (c.userId) orConds.push(eq(admissionApplicationsV2.applicantId, c.userId));
                    if (orConds.length > 0) {
                        const [app] = await db.select({
                            applicantPhoto: admissionApplicationsV2.applicantPhoto,
                            data: admissionApplicationsV2.data
                        }).from(admissionApplicationsV2).where(or(...orConds)).limit(1);

                        if (app) {
                            if (!photoUrl) {
                                if (app.applicantPhoto) {
                                    photoUrl = app.applicantPhoto;
                                } else if (app.data) {
                                    try {
                                        const d = typeof app.data === 'string' ? JSON.parse(app.data) : app.data;
                                        photoUrl = d['Photograph/camera'] || d['Passport Photograph'] || d['Passport Photo'] || d['Passport'] || d['photo'] || d['Photo'] || d['Photograph'] || null;
                                    } catch(e) {}
                                }
                            }

                            if (!signatureUrl && app.data) {
                                try {
                                    const d = typeof app.data === 'string' ? JSON.parse(app.data) : app.data;
                                    signatureUrl = d['Signature'] || d['signature'] || d['Applicant Signature'] || d['Student Signature'] || null;
                                } catch(e) {}
                            }
                        }
                    }
                } catch(e) {}
            }

            // Sync resolved assets back to students record if currently missing
            if (c.studentId) {
                const updates: any = {};
                if (!c.photoUrl && photoUrl) updates.imageUrl = photoUrl;
                if (!c.signatureUrl && signatureUrl) updates.signatureUrl = signatureUrl;
                if (Object.keys(updates).length > 0) {
                    db.update(students).set(updates).where(eq(students.id, c.studentId)).catch(() => {});
                }
            }

            return {
                ...c,
                photoUrl: viewableAssetUrl(photoUrl) || photoUrl || undefined,
                signatureUrl: viewableAssetUrl(signatureUrl) || signatureUrl || undefined,
            };
        }));

        return { success: true, data: enhancedCards };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}

/** Active students that do not yet have an active ID card (for ICT bulk issuing). */
export async function getStudentsWithoutCards(filters?: {
    search?: string;
    departmentId?: number;
    levelFilter?: 'all' | 'freshmen' | 'returning_ready' | 'returning_incomplete';
    limit?: number;
}) {
    try {
        await ensureICTManager();
        let where: any = and(
            sql`${students.deletedAt} IS NULL`,
            sql`NOT EXISTS (SELECT 1 FROM id_cards ic WHERE ic.user_id = ${students.userId} AND ic.status = 'active')`
        );
        if (filters?.departmentId) where = and(where, eq(students.deptId, filters.departmentId));
        if (filters?.search) {
            const q = `%${filters.search}%`;
            where = and(where, or(like(users.name, q), like(students.matricNumber, q)));
        }

        const rows = await db.select({
            userId: students.userId,
            studentName: users.name,
            matricNumber: students.matricNumber,
            deptName: departments.name,
            currentLevel: students.currentLevel,
            programmeType: students.programmeType,
            hasPhoto: sql<number>`(
                (${students.imageUrl} IS NOT NULL AND ${students.imageUrl} <> '')
                OR EXISTS (
                    SELECT 1 FROM admission_applications_v2 a 
                    WHERE (a.student_id = ${students.id} OR a.applicant_id = ${students.userId})
                      AND ((a.applicant_photo IS NOT NULL AND a.applicant_photo <> '') OR a.data LIKE '%Passport%' OR a.data LIKE '%Photograph%' OR a.data LIKE '%photo%')
                )
            )`,
            hasSignature: sql<number>`(
                (${students.signatureUrl} IS NOT NULL AND ${students.signatureUrl} <> '')
                OR EXISTS (
                    SELECT 1 FROM admission_applications_v2 a 
                    WHERE (a.student_id = ${students.id} OR a.applicant_id = ${students.userId})
                      AND (a.data LIKE '%Signature%' OR a.data LIKE '%signature%')
                )
            )`,
            isPaymentLocked: students.isPaymentLocked,
            hasPaidAcceptance: sql<number>`(
                (${students.matricNumber} IS NOT NULL AND ${students.matricNumber} <> '' AND ${students.status} = 'active')
                OR EXISTS (
                    SELECT 1 FROM transactions t 
                    WHERE (t.student_id = ${students.id} OR t.gateway_reference LIKE '%ACC%')
                      AND t.purpose LIKE '%acceptance%' 
                      AND t.status = 'completed'
                )
                OR EXISTS (
                    SELECT 1 FROM payment_transactions pt 
                    WHERE pt.user_id = ${students.userId} 
                      AND pt.transaction_type LIKE '%acceptance%' 
                      AND pt.status IN ('completed', 'paid')
                ) 
                OR EXISTS (
                    SELECT 1 FROM admission_applications_v2 a 
                    WHERE (a.applicant_id = ${students.userId} OR a.student_id = ${students.id})
                      AND a.acceptance_payment_status = 'paid'
                )
            )`,
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(where)
        .orderBy(users.name)
        .limit(filters?.limit || 150);

        const data = rows.map(r => {
            const rawLvl = parseInt(String(r.currentLevel || 1));
            const prog = (r.programmeType || '').toUpperCase();
            const isFreshman = rawLvl === 100 || (rawLvl === 1 && prog === 'ND') || rawLvl === 300 || rawLvl === 3 || (rawLvl === 1 && prog === 'HND');
            const levelLabel = isFreshman ? (prog === 'HND' ? 'HND 1' : 'ND 1') : (prog === 'HND' ? 'HND 2' : 'ND 2');
            const hasPhoto = Boolean(Number(r.hasPhoto));
            const hasSignature = Boolean(Number(r.hasSignature));
            const hasPaidAcceptance = Boolean(Number(r.hasPaidAcceptance));
            const isPaymentLocked = Boolean(r.isPaymentLocked);

            let isEligible = false;
            let statusTag: 'freshman_paid' | 'freshman_unpaid' | 'returning_ready' | 'returning_incomplete' = 'returning_incomplete';
            let eligibilityNote = '';

            if (isFreshman) {
                if (hasPaidAcceptance) {
                    isEligible = true;
                    statusTag = 'freshman_paid';
                    eligibilityNote = 'Acceptance / Enrolled Verified — Ready for ID Card';
                } else {
                    isEligible = false;
                    statusTag = 'freshman_unpaid';
                    eligibilityNote = 'Awaiting Acceptance Payment';
                }
            } else {
                // ND 2 / HND 2
                if (!hasPhoto && !hasSignature) {
                    isEligible = false;
                    statusTag = 'returning_incomplete';
                    eligibilityNote = 'Awaiting Photograph & Signature (update on profile or ICT capture unit)';
                } else if (!hasPhoto) {
                    isEligible = false;
                    statusTag = 'returning_incomplete';
                    eligibilityNote = 'Awaiting Photograph upload';
                } else if (!hasSignature) {
                    isEligible = false;
                    statusTag = 'returning_incomplete';
                    eligibilityNote = 'Awaiting Specimen Signature';
                } else if (isPaymentLocked) {
                    isEligible = false;
                    statusTag = 'returning_incomplete';
                    eligibilityNote = 'Fee Payment Required';
                } else {
                    isEligible = true;
                    statusTag = 'returning_ready';
                    eligibilityNote = 'Profile & Payment Verified';
                }
            }

            return {
                ...r,
                levelLabel,
                isFreshman,
                hasPhoto,
                hasSignature,
                hasPaidAcceptance,
                isEligible,
                statusTag,
                eligibilityNote
            };
        });

        // Filter if requested
        let filtered = data;
        if (filters?.levelFilter === 'freshmen') {
            filtered = data.filter(d => d.isFreshman && d.isEligible);
        } else if (filters?.levelFilter === 'returning_ready') {
            filtered = data.filter(d => !d.isFreshman && d.isEligible);
        } else if (filters?.levelFilter === 'returning_incomplete') {
            filtered = data.filter(d => !d.isFreshman && !d.isEligible);
        }

        return { success: true, data: filtered };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}

/** Automatically process all eligible ND 1 and HND 1 students who paid acceptance fee into the print queue. */
export async function processAcceptancePaidFreshmenIDCards() {
    try {
        await ensureICTManager();

        // Find all ND 1 and HND 1 students who paid acceptance fee or are active matriculated freshmen and don't have an active card
        const eligibleRows = await db.select({
            userId: students.userId,
            name: users.name,
            matricNumber: students.matricNumber,
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(and(
            sql`${students.deletedAt} IS NULL`,
            sql`NOT EXISTS (SELECT 1 FROM id_cards ic WHERE ic.user_id = ${students.userId} AND ic.status = 'active')`,
            sql`(
                ${students.currentLevel} IN (1, 100, 300, 3)
                OR (${students.currentLevel} = 1 AND ${students.programmeType} IN ('ND', 'HND'))
            )`,
            sql`(
                (${students.matricNumber} IS NOT NULL AND ${students.matricNumber} <> '' AND ${students.status} = 'active')
                OR EXISTS (
                    SELECT 1 FROM transactions t 
                    WHERE (t.student_id = ${students.id} OR t.gateway_reference LIKE '%ACC%')
                      AND t.purpose LIKE '%acceptance%' 
                      AND t.status = 'completed'
                )
                OR EXISTS (
                    SELECT 1 FROM payment_transactions pt 
                    WHERE pt.user_id = ${students.userId} 
                      AND pt.transaction_type LIKE '%acceptance%' 
                      AND pt.status IN ('completed', 'paid')
                ) 
                OR EXISTS (
                    SELECT 1 FROM admission_applications_v2 a 
                    WHERE (a.applicant_id = ${students.userId} OR a.student_id = ${students.id})
                      AND a.acceptance_payment_status = 'paid'
                )
            )`
        ));

        if (!eligibleRows.length) {
            return { success: true, count: 0, message: "All eligible ND 1 and HND 1 freshmen already have active cards in queue." };
        }

        const { v4: uuidv4 } = await import("uuid");
        const userIds = eligibleRows.map(r => r.userId);
        
        // Batch insert in chunks of 50
        const chunkSize = 50;
        let insertedCount = 0;
        for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);
            const values = chunk.map(uid => {
                const issueId = `ID-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                const verificationCode = uuidv4();
                const expiresAt = new Date();
                expiresAt.setFullYear(expiresAt.getFullYear() + 4);
                return {
                    userId: uid,
                    userType: "student" as const,
                    cardType: "physical_print" as const,
                    issueId,
                    verificationCode,
                    expiresAt,
                    status: "active" as const,
                    printStatus: "pending" as const,
                };
            });
            await db.insert(idCards).values(values);
            insertedCount += chunk.length;
        }

        revalidatePath("/admin/ict/print-queue");
        return {
            success: true,
            count: insertedCount,
            message: `Successfully processed ${insertedCount} ID card(s) for ND 1 & HND 1 freshmen into the print queue.`
        };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

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