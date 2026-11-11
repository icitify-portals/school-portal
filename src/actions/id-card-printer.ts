"use server";

import { db } from "@/db/db";
import {
    idCardPrinterProfiles,
    idCardPrintBatches,
    idCardPrintBatchItems,
    idCards,
    users,
    students,
    departments,
    academicSessions,
    admissionApplicationsV2
} from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { viewableAssetUrl } from "@/lib/assets";

async function ensureStaffOrAdmin() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || !["admin", "superadmin", "ict_manager", "staff", "super-admin", "developer", "icitify_dev"].includes(role)) {
        throw new Error("Unauthorized. ICT Manager or Administrator access required.");
    }
    return session.user;
}

// ──────────────────────────────────────────────────────────────
// 1. PRINTER PROFILES & CALIBRATION ACTIONS
// ──────────────────────────────────────────────────────────────

export async function getPrinterProfiles() {
    try {
        await ensureStaffOrAdmin();
        const profiles = await db.select().from(idCardPrinterProfiles).orderBy(desc(idCardPrinterProfiles.isDefault), idCardPrinterProfiles.name);
        return { success: true, data: profiles };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}

export async function savePrinterProfile(profile: {
    id?: number;
    name: string;
    printerModel: "canon_ts704a" | "canon_ts705a" | "generic_cr80" | "a4_sheet";
    carrierType: "inksystem_mp_2card" | "single_cr80" | "a4_grid";
    trayWidthMm?: number | string;
    trayHeightMm?: number | string;
    slot1XOffsetMm?: number | string;
    slot1YOffsetMm?: number | string;
    slot2XOffsetMm?: number | string;
    slot2YOffsetMm?: number | string;
    cardWidthMm?: number | string;
    cardHeightMm?: number | string;
    scalePercent?: number | string;
    bleedMm?: number | string;
    orientation?: "portrait" | "landscape";
    mediaTypeRef?: string;
    isDefault?: boolean;
    notes?: string;
}) {
    try {
        await ensureStaffOrAdmin();

        const profileData = {
            name: profile.name.trim(),
            printerModel: profile.printerModel,
            carrierType: profile.carrierType,
            trayWidthMm: String(profile.trayWidthMm ?? "130.00"),
            trayHeightMm: String(profile.trayHeightMm ?? "253.00"),
            slot1XOffsetMm: String(profile.slot1XOffsetMm ?? "22.20"),
            slot1YOffsetMm: String(profile.slot1YOffsetMm ?? "32.00"),
            slot2XOffsetMm: String(profile.slot2XOffsetMm ?? "22.20"),
            slot2YOffsetMm: String(profile.slot2YOffsetMm ?? "100.00"),
            cardWidthMm: String(profile.cardWidthMm ?? "85.60"),
            cardHeightMm: String(profile.cardHeightMm ?? "53.98"),
            scalePercent: String(profile.scalePercent ?? "100.00"),
            bleedMm: String(profile.bleedMm ?? "0.00"),
            orientation: profile.orientation || "portrait",
            mediaTypeRef: profile.mediaTypeRef || "Multi-Purpose Tray",
            isDefault: Boolean(profile.isDefault),
            notes: profile.notes || null,
        };

        if (profile.isDefault) {
            // Unset other defaults
            await db.update(idCardPrinterProfiles).set({ isDefault: false });
        }

        if (profile.id) {
            await db.update(idCardPrinterProfiles)
                .set(profileData)
                .where(eq(idCardPrinterProfiles.id, profile.id));
        } else {
            await db.insert(idCardPrinterProfiles).values(profileData);
        }

        revalidatePath("/admin/ict/print-queue");
        return { success: true, message: `Calibration profile "${profile.name}" saved successfully.` };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function setDefaultPrinterProfile(id: number) {
    try {
        await ensureStaffOrAdmin();
        await db.update(idCardPrinterProfiles).set({ isDefault: false });
        await db.update(idCardPrinterProfiles).set({ isDefault: true }).where(eq(idCardPrinterProfiles.id, id));
        revalidatePath("/admin/ict/print-queue");
        return { success: true, message: "Default printer profile updated." };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function resetDefaultPrinterProfiles() {
    try {
        await ensureStaffOrAdmin();
        // Reset TS704a and TS705a factory specs
        await db.update(idCardPrinterProfiles)
            .set({
                trayWidthMm: "130.00",
                trayHeightMm: "253.00",
                slot1XOffsetMm: "22.20",
                slot1YOffsetMm: "32.00",
                slot2XOffsetMm: "22.20",
                slot2YOffsetMm: "100.00",
                cardWidthMm: "85.60",
                cardHeightMm: "53.98",
                scalePercent: "100.00",
                bleedMm: "0.50",
                mediaTypeRef: "Multi-Purpose Tray (Disc Tray J)"
            })
            .where(inArray(idCardPrinterProfiles.printerModel, ["canon_ts704a", "canon_ts705a"]));

        revalidatePath("/admin/ict/print-queue");
        return { success: true, message: "Canon TS704a / TS705a profiles reset to factory defaults." };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ──────────────────────────────────────────────────────────────
// 2. BATCH CREATION & 2-CARD TRAY SLOT ALLOCATION
// ──────────────────────────────────────────────────────────────

export async function createPrintBatch(params: {
    cardIds: number[];
    printerProfileId: number;
    notes?: string;
    filterSessionId?: number;
    filterDeptId?: number;
    filterLevel?: string;
}) {
    try {
        const user = await ensureStaffOrAdmin();
        const validIds = (params.cardIds || []).map(Number).filter((n) => !isNaN(n) && n > 0);
        if (!validIds.length) throw new Error("No cards selected for batch printing.");

        // Check printer profile
        const [profile] = await db.select().from(idCardPrinterProfiles).where(eq(idCardPrinterProfiles.id, params.printerProfileId)).limit(1);
        if (!profile) throw new Error("Selected printer profile not found.");

        // Fetch cards with student relationships
        const cards = await db.select({
            id: idCards.id,
            userId: idCards.userId,
            studentId: students.id,
            studentName: users.name,
            matricNumber: students.matricNumber,
        })
        .from(idCards)
        .innerJoin(users, eq(idCards.userId, users.id))
        .leftJoin(students, and(eq(users.id, students.userId), sql`${students.deletedAt} IS NULL`))
        .where(inArray(idCards.id, validIds))
        .orderBy(users.name);

        if (!cards.length) throw new Error("No valid card records found.");

        const is2CardTray = profile.carrierType === "inksystem_mp_2card";
        const cardsPerTray = is2CardTray ? 2 : 1;
        const totalTrays = Math.ceil(cards.length / cardsPerTray);

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const batchNumber = `BATCH-${dateStr}-${randSuffix}`;

        // Insert batch record
        const [batchResult] = await db.insert(idCardPrintBatches).values({
            batchNumber,
            operatorId: parseInt(user.id as string),
            printerProfileId: profile.id,
            filterSessionId: params.filterSessionId || null,
            filterDeptId: params.filterDeptId || null,
            filterLevel: params.filterLevel || null,
            totalCards: cards.length,
            totalTrays,
            frontStatus: "pending",
            backStatus: "pending",
            status: "queued",
            notes: params.notes || null,
        });

        const batchId = (batchResult as any).insertId;

        // Allocate cards to Tray and Slot
        const batchItemsData = cards.map((card, idx) => {
            const trayNumber = Math.floor(idx / cardsPerTray) + 1;
            const slotNumber = is2CardTray ? (idx % 2) + 1 : 1;
            return {
                batchId,
                idCardId: card.id,
                studentId: card.studentId || null,
                trayNumber,
                slotNumber,
                frontPrinted: false,
                backPrinted: false,
                reprintCount: 0,
            };
        });

        await db.insert(idCardPrintBatchItems).values(batchItemsData);

        // Update card status to printing
        await db.update(idCards)
            .set({
                printStatus: "printing",
                assignedTo: parseInt(user.id as string),
                assignedAt: now,
            })
            .where(inArray(idCards.id, validIds));

        revalidatePath("/admin/ict/print-queue");
        return {
            success: true,
            batchId,
            batchNumber,
            totalCards: cards.length,
            totalTrays,
            message: `Batch ${batchNumber} created with ${cards.length} card(s) across ${totalTrays} tray load(s).`,
        };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ──────────────────────────────────────────────────────────────
// 3. BATCH AUDIT TRAIL & HISTORY
// ──────────────────────────────────────────────────────────────

export async function getPrintBatches(filters?: {
    limit?: number;
    offset?: number;
    status?: string;
    sessionId?: number;
    departmentId?: number;
}) {
    try {
        await ensureStaffOrAdmin();
        const limit = filters?.limit || 20;
        const offset = filters?.offset || 0;

        const whereConds = [];
        if (filters?.status && filters.status !== "all") {
            whereConds.push(eq(idCardPrintBatches.status, filters.status as any));
        }
        if (filters?.sessionId) {
            whereConds.push(eq(idCardPrintBatches.filterSessionId, filters.sessionId));
        }
        if (filters?.departmentId) {
            whereConds.push(eq(idCardPrintBatches.filterDeptId, filters.departmentId));
        }

        const batches = await db.select({
            id: idCardPrintBatches.id,
            batchNumber: idCardPrintBatches.batchNumber,
            totalCards: idCardPrintBatches.totalCards,
            totalTrays: idCardPrintBatches.totalTrays,
            frontStatus: idCardPrintBatches.frontStatus,
            backStatus: idCardPrintBatches.backStatus,
            status: idCardPrintBatches.status,
            notes: idCardPrintBatches.notes,
            createdAt: idCardPrintBatches.createdAt,
            completedAt: idCardPrintBatches.completedAt,
            operatorName: users.name,
            operatorEmail: users.email,
            profileName: idCardPrinterProfiles.name,
            printerModel: idCardPrinterProfiles.printerModel,
            carrierType: idCardPrinterProfiles.carrierType,
            deptName: departments.name,
            sessionName: academicSessions.name,
        })
        .from(idCardPrintBatches)
        .leftJoin(users, eq(idCardPrintBatches.operatorId, users.id))
        .leftJoin(idCardPrinterProfiles, eq(idCardPrintBatches.printerProfileId, idCardPrinterProfiles.id))
        .leftJoin(departments, eq(idCardPrintBatches.filterDeptId, departments.id))
        .leftJoin(academicSessions, eq(idCardPrintBatches.filterSessionId, academicSessions.id))
        .where(whereConds.length > 0 ? and(...whereConds) : undefined)
        .orderBy(desc(idCardPrintBatches.createdAt))
        .limit(limit)
        .offset(offset);

        const [{ total }] = await db.select({ total: sql<number>`count(*)` })
            .from(idCardPrintBatches)
            .where(whereConds.length > 0 ? and(...whereConds) : undefined);

        return { success: true, data: batches, total };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [], total: 0 };
    }
}

export async function getPrintBatchDetails(batchId: number) {
    try {
        await ensureStaffOrAdmin();

        const [batch] = await db.select({
            id: idCardPrintBatches.id,
            batchNumber: idCardPrintBatches.batchNumber,
            totalCards: idCardPrintBatches.totalCards,
            totalTrays: idCardPrintBatches.totalTrays,
            frontStatus: idCardPrintBatches.frontStatus,
            backStatus: idCardPrintBatches.backStatus,
            status: idCardPrintBatches.status,
            notes: idCardPrintBatches.notes,
            createdAt: idCardPrintBatches.createdAt,
            completedAt: idCardPrintBatches.completedAt,
            operatorName: users.name,
            profile: idCardPrinterProfiles,
            deptName: departments.name,
            sessionName: academicSessions.name,
        })
        .from(idCardPrintBatches)
        .leftJoin(users, eq(idCardPrintBatches.operatorId, users.id))
        .leftJoin(idCardPrinterProfiles, eq(idCardPrintBatches.printerProfileId, idCardPrinterProfiles.id))
        .leftJoin(departments, eq(idCardPrintBatches.filterDeptId, departments.id))
        .leftJoin(academicSessions, eq(idCardPrintBatches.filterSessionId, academicSessions.id))
        .where(eq(idCardPrintBatches.id, batchId))
        .limit(1);

        if (!batch) throw new Error("Print batch not found.");

        // Fetch batch items with student data
        const items = await db.select({
            id: idCardPrintBatchItems.id,
            batchId: idCardPrintBatchItems.batchId,
            idCardId: idCardPrintBatchItems.idCardId,
            studentId: idCardPrintBatchItems.studentId,
            trayNumber: idCardPrintBatchItems.trayNumber,
            slotNumber: idCardPrintBatchItems.slotNumber,
            frontPrinted: idCardPrintBatchItems.frontPrinted,
            backPrinted: idCardPrintBatchItems.backPrinted,
            reprintCount: idCardPrintBatchItems.reprintCount,
            failed: idCardPrintBatchItems.failed,
            failureReason: idCardPrintBatchItems.failureReason,
            printedAt: idCardPrintBatchItems.printedAt,
            studentName: users.name,
            matricNumber: students.matricNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            photoUrl: students.imageUrl,
            signatureUrl: students.signatureUrl,
            deptName: departments.name,
            issueId: idCards.issueId,
            verificationCode: idCards.verificationCode,
            phone: users.phone,
        })
        .from(idCardPrintBatchItems)
        .innerJoin(idCards, eq(idCardPrintBatchItems.idCardId, idCards.id))
        .innerJoin(users, eq(idCards.userId, users.id))
        .leftJoin(students, eq(idCardPrintBatchItems.studentId, students.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(eq(idCardPrintBatchItems.batchId, batchId))
        .orderBy(idCardPrintBatchItems.trayNumber, idCardPrintBatchItems.slotNumber);

        // Resolve Wasabi image proxy URLs
        const enhancedItems = items.map((item) => ({
            ...item,
            photoUrl: viewableAssetUrl(item.photoUrl) || item.photoUrl || undefined,
            signatureUrl: viewableAssetUrl(item.signatureUrl) || item.signatureUrl || undefined,
        }));

        return { success: true, batch, items: enhancedItems };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateBatchPrintProgress(params: {
    batchId: number;
    frontStatus?: "pending" | "in_progress" | "completed" | "failed";
    backStatus?: "pending" | "in_progress" | "completed" | "failed";
    markAllCompleted?: boolean;
    notes?: string;
}) {
    try {
        await ensureStaffOrAdmin();
        const { batchId, frontStatus, backStatus, markAllCompleted, notes } = params;

        const updateData: any = {};
        if (frontStatus) updateData.frontStatus = frontStatus;
        if (backStatus) updateData.backStatus = backStatus;
        if (notes) updateData.notes = notes;

        const now = new Date();

        if (markAllCompleted || (frontStatus === "completed" && backStatus === "completed")) {
            updateData.status = "completed";
            updateData.frontStatus = "completed";
            updateData.backStatus = "completed";
            updateData.completedAt = now;

            // Mark batch items as printed
            await db.update(idCardPrintBatchItems)
                .set({
                    frontPrinted: true,
                    backPrinted: true,
                    printedAt: now,
                })
                .where(eq(idCardPrintBatchItems.batchId, batchId));

            // Mark student idCards as printed
            const batchItems = await db.select({ idCardId: idCardPrintBatchItems.idCardId })
                .from(idCardPrintBatchItems)
                .where(eq(idCardPrintBatchItems.batchId, batchId));

            const cardIds = batchItems.map((b) => b.idCardId).filter(Boolean) as number[];
            if (cardIds.length > 0) {
                await db.update(idCards)
                    .set({
                        printStatus: "printed",
                        printedAt: now,
                    })
                    .where(inArray(idCards.id, cardIds));
            }
        } else {
            updateData.status = "printing";
        }

        await db.update(idCardPrintBatches)
            .set(updateData)
            .where(eq(idCardPrintBatches.id, batchId));

        revalidatePath("/admin/ict/print-queue");
        return { success: true, message: "Batch print progress updated." };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function recordCardReprint(batchItemId: number, reason: string) {
    try {
        await ensureStaffOrAdmin();
        const [item] = await db.select().from(idCardPrintBatchItems).where(eq(idCardPrintBatchItems.id, batchItemId)).limit(1);
        if (!item) throw new Error("Batch card item not found.");

        await db.update(idCardPrintBatchItems)
            .set({
                reprintCount: (item.reprintCount || 0) + 1,
                failureReason: reason ? `${item.failureReason || ""}\n[${new Date().toISOString()}] Reprint requested: ${reason}`.trim() : item.failureReason,
            })
            .where(eq(idCardPrintBatchItems.id, batchItemId));

        revalidatePath("/admin/ict/print-queue");
        return { success: true, message: `Reprint recorded (Count: ${(item.reprintCount || 0) + 1}).` };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
