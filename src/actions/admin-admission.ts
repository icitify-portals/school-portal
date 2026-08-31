'use server';

import { db } from "@/db";
import { programmes, admissionFormTemplates, systemSettings, admissionApplicationsV2, admissionExamResults, users as authUsers } from "@/db/schema";
import { eq, and, desc, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { NotificationService } from "@/services/NotificationService";
import { hasPermission, hasRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { computeScreeningPercentage, decideFromScreening } from "@/lib/admission/screening";
import { extractNameParts, buildFullName } from "@/lib/applicant-names";

// ─────────────────────────────────────────────────────────────────────
// Post-UTME Screening Unification (Phase 1): cut-off management
// Selection criterion = screening % only. Cut-offs are per exercise
// (template) so ND and HND can differ; the global setting is only the
// default applied to newly created exercises.
// ─────────────────────────────────────────────────────────────────────

const GLOBAL_CUTOFF_KEY = 'post_utme_cutoff_percent';

export async function getCutoffSettings() {
    try {
        const allowed = await hasPermission("admission.screening.view") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false as const, error: "Unauthorized" };

        const [settingRow, templates] = await Promise.all([
            db.select().from(systemSettings).where(eq(systemSettings.settingKey, GLOBAL_CUTOFF_KEY)).limit(1),
            db.select({
                id: admissionFormTemplates.id,
                name: admissionFormTemplates.name,
                level: admissionFormTemplates.level,
                slug: admissionFormTemplates.slug,
                cutoffPercent: admissionFormTemplates.cutoffPercent,
                idCardFee: admissionFormTemplates.idCardFee,
                isActive: admissionFormTemplates.isActive,
            }).from(admissionFormTemplates),
        ]);

        return {
            success: true as const,
            globalDefault: parseFloat(settingRow[0]?.settingValue || '40') || 40,
            exercises: templates,
        };
    } catch (error) {
        console.error("Error fetching cutoff settings:", error);
        return { success: false as const, error: "Failed to fetch cutoff settings" };
    }
}

export async function saveGlobalCutoffDefault(percent: number) {
    try {
        const allowed = await hasPermission("admission.applications.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false as const, error: "Unauthorized" };

        if (isNaN(percent) || percent < 0 || percent > 100) {
            return { success: false as const, error: "Cut-off must be between 0 and 100" };
        }

        const value = percent.toString();
        const existing = await db.select({ id: systemSettings.id })
            .from(systemSettings)
            .where(eq(systemSettings.settingKey, GLOBAL_CUTOFF_KEY))
            .limit(1);

        if (existing.length > 0) {
            await db.update(systemSettings)
                .set({ settingValue: value })
                .where(eq(systemSettings.settingKey, GLOBAL_CUTOFF_KEY));
        } else {
            await db.insert(systemSettings).values({
                settingKey: GLOBAL_CUTOFF_KEY,
                settingValue: value,
                description: 'Default Post-UTME screening cut-off (%) applied to newly created admission exercises',
            });
        }

        revalidatePath("/admin/admission/screening");
        return { success: true as const, globalDefault: percent };
    } catch (error) {
        console.error("Error saving global cutoff default:", error);
        return { success: false as const, error: "Failed to save default cut-off" };
    }
}

export async function updateExerciseCutoff(templateId: number, percent: number) {
    try {
        const allowed = await hasPermission("admission.applications.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false as const, error: "Unauthorized" };

        if (isNaN(percent) || percent < 0 || percent > 100) {
            return { success: false as const, error: "Cut-off must be between 0 and 100" };
        }

        await db.update(admissionFormTemplates)
            .set({ cutoffPercent: percent.toString() })
            .where(eq(admissionFormTemplates.id, templateId));

        revalidatePath("/admin/admission/screening");
        return { success: true as const, templateId, cutoffPercent: percent };
    } catch (error) {
        console.error("Error updating exercise cutoff:", error);
        return { success: false as const, error: "Failed to update cut-off" };
    }
}

// ─────────────────────────────────────────────────────────────────────
// Post-UTME Screening Unification (Phase 2): unified scoring engine
// Single selection criterion = screening % (Math + English /200).
// Decisions are computed against each exercise's own cut-off.
// ─────────────────────────────────────────────────────────────────────

function parseApplicantData(raw: unknown): Record<string, any> {
    try {
        return typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {};
    } catch {
        return {};
    }
}

function applicantNameFrom(form: Record<string, any>, user?: { name?: string | null; firstName?: string | null; surname?: string | null } | null): string {
    const parts = extractNameParts(form);
    const fromForm = buildFullName(parts) || `${parts.firstName} ${parts.lastName}`.trim();
    if (fromForm) return fromForm;
    if (user) return (user.name || `${user.firstName || ''} ${user.surname || ''}`.trim() || 'N/A');
    return 'N/A';
}

async function getGlobalCutoffFallback(): Promise<number> {
    const [row] = await db.select({ settingValue: systemSettings.settingValue })
        .from(systemSettings)
        .where(eq(systemSettings.settingKey, GLOBAL_CUTOFF_KEY))
        .limit(1);
    const parsed = parseFloat(row?.settingValue || '40');
    return isNaN(parsed) ? 40 : parsed;
}

export interface ScreeningExercise {
    id: number;
    name: string;
    level: string;
    cutoffPercent: number;
    applicantCount: number;
}

export interface ScreeningApplicant {
    id: number;
    formNumber: string | null;
    applicationNumber: string | null;
    name: string;
    email: string;
    phone: string;
    programmeName: string;
    templateId: number;
    templateName: string;
    templateLevel: string;
    cutoffPercent: number;
    mathScore: string | null;
    englishScore: string | null;
    screeningScore: string | null;
    screeningPercentage: string | null;
    status: string;
    decisionSource: string | null;
    attendance: string;
    acceptancePaymentStatus: string;
}

/**
 * Unified screening list — reads admission_applications_v2 only.
 * Strict per-exercise filtering: pass templateId to scope to one exercise,
 * omit it to load every exercise (grouped client-side by templateId).
 */
export async function getScreeningApplicants(templateId?: number): Promise<{
    success: boolean;
    exercises?: ScreeningExercise[];
    applicants?: ScreeningApplicant[];
    globalCutoff?: number;
    error?: string;
}> {
    try {
        const allowed = await hasPermission("admission.screening.view") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized" };

        const globalFallback = await getGlobalCutoffFallback();

        const templates = await db.select({
            id: admissionFormTemplates.id,
            name: admissionFormTemplates.name,
            level: admissionFormTemplates.level,
            cutoffPercent: admissionFormTemplates.cutoffPercent,
        }).from(admissionFormTemplates);

        const conditions = [ne(admissionApplicationsV2.status, 'draft')];
        if (templateId) conditions.push(eq(admissionApplicationsV2.templateId, templateId));

        // Explicit joins (not the relational API) for maximum DB-version portability
        const rows = await db.select({
            app: admissionApplicationsV2,
            templateName: admissionFormTemplates.name,
            templateLevel: admissionFormTemplates.level,
            templateCutoff: admissionFormTemplates.cutoffPercent,
            programmeName: programmes.name,
            userName: authUsers.name,
            userFirstName: authUsers.firstName,
            userSurname: authUsers.surname,
            userEmail: authUsers.email,
            userPhone: authUsers.phone,
        })
            .from(admissionApplicationsV2)
            .leftJoin(admissionFormTemplates, eq(admissionApplicationsV2.templateId, admissionFormTemplates.id))
            .leftJoin(authUsers, eq(admissionApplicationsV2.applicantId, authUsers.id))
            .leftJoin(programmes, eq(admissionApplicationsV2.programmeId, programmes.id))
            .where(and(...conditions))
            .orderBy(desc(admissionApplicationsV2.appliedAt));

        // Batch CBT presence detection for effective attendance
        const appIds = rows.map(r => r.app.id);
        const examResults = appIds.length > 0
            ? await db.select({ applicationId: admissionExamResults.applicationId })
                .from(admissionExamResults)
                .where(inArray(admissionExamResults.applicationId, appIds))
            : [];
        const cbtPresentIds = new Set(examResults.map(r => r.applicationId));

        const applicants: ScreeningApplicant[] = rows.map((row): ScreeningApplicant => {
            const app = row.app;
            const form = parseApplicantData(app.data);
            const cutoff = parseFloat(row.templateCutoff || '') || globalFallback;
            const attendance = (app.examAttendanceStatus && app.examAttendanceStatus !== 'pending')
                ? app.examAttendanceStatus
                : (cbtPresentIds.has(app.id) ? 'present' : 'pending');

            return {
                id: app.id,
                formNumber: app.formNumber || null,
                applicationNumber: app.applicationNumber || null,
                name: applicantNameFrom(form, { name: row.userName, firstName: row.userFirstName, surname: row.userSurname }),
                email: row.userEmail || form.email || form.email_address || '',
                phone: row.userPhone || form.phone || form.phone_number || '',
                programmeName: row.programmeName || 'Pending Course Selection',
                templateId: app.templateId,
                templateName: row.templateName || 'Unknown Exercise',
                templateLevel: row.templateLevel || 'tertiary',
                cutoffPercent: cutoff,
                mathScore: app.mathScore ?? null,
                englishScore: app.englishScore ?? null,
                screeningScore: app.screeningScore ?? null,
                screeningPercentage: app.screeningPercentage ?? null,
                status: app.status || 'submitted',
                decisionSource: app.decisionSource ?? null,
                attendance,
                acceptancePaymentStatus: app.acceptancePaymentStatus || 'pending',
            };
        });

        // Exercise summaries reflect the strict filtering above
        const exercises: ScreeningExercise[] = templates
            .filter(t => !templateId || t.id === templateId)
            .map(t => ({
                id: t.id,
                name: t.name,
                level: t.level,
                cutoffPercent: parseFloat(t.cutoffPercent || '') || globalFallback,
                applicantCount: applicants.filter(a => a.templateId === t.id).length,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return { success: true, exercises, applicants, globalCutoff: globalFallback };
    } catch (error) {
        console.error("Error fetching screening applicants:", error);
        return { success: false, error: "Failed to fetch screening applicants" };
    }
}

// ─────────────────────────────────────────────────────────────────────
// Phase 6: offer notifications (congratulations email + in-app + WhatsApp)
// Fired only on TRANSITIONS into 'admitted' so Run Selection re-runs and
// score corrections never spam applicants.
// ─────────────────────────────────────────────────────────────────────

interface OfferNotificationTarget {
    applicationId: number;
    applicantName: string;
    email: string;
    phone?: string;
    templateName: string;
    applicantId?: number | null;
}

function buildOfferTarget(
    appId: number,
    rawFormData: unknown,
    templateName: string,
    applicantId?: number | null,
    userEmail?: string | null,
): OfferNotificationTarget {
    const form = parseApplicantData(rawFormData);
    const name = applicantNameFrom(form, null);
    return {
        applicationId: appId,
        applicantName: name !== 'N/A' ? name : String(form.firstName || form.first_name || 'Applicant'),
        email: String(form.email || form.email_address || userEmail || ''),
        phone: form.phone ? String(form.phone) : (form.phone_number ? String(form.phone_number) : undefined),
        templateName,
        applicantId,
    };
}

async function notifyOneOffer(t: OfferNotificationTarget): Promise<void> {
    try {
        if (t.email) {
            await NotificationService.sendAdmissionOfferedByEmail(t.email, {
                applicantName: t.applicantName,
                templateName: t.templateName,
                userId: t.applicantId || undefined,
            });
        } else if (t.applicantId) {
            // No email on the form — still create the in-app notification
            await NotificationService.createNotification({
                userId: t.applicantId,
                title: "Admission Offered!",
                message: `Congratulations! You have been offered provisional admission for ${t.templateName}.`,
                type: "success",
                channel: "both",
            });
        }
        if (t.phone) {
            await NotificationService.sendAdmissionUpdate(t.phone, t.applicantName, 'admitted');
        }
    } catch (err) {
        console.error(`[offer-notification] Failed for application ${t.applicationId}:`, err);
    }
}

async function dispatchOfferNotifications(targets: OfferNotificationTarget[]): Promise<void> {
    if (targets.length === 0) return;
    const CHUNK = 10;
    for (let i = 0; i < targets.length; i += CHUNK) {
        await Promise.allSettled(targets.slice(i, i + CHUNK).map(notifyOneOffer));
    }
}

/**
 * Save Mathematics + English scores on a V2 application and auto-decide:
 * percentage >= exercise cut-off AND attendance != absent → admitted (auto).
 * Applicants who already paid their acceptance fee are locked.
 */
export async function updateSubjectScoresV2(applicationId: number, mathScore: number, englishScore: number): Promise<{
    success: boolean;
    error?: string;
    mathScore?: number;
    englishScore?: number;
    total?: number;
    percentage?: number;
    status?: string;
}> {
    try {
        const allowed = await hasPermission("admission.applications.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized" };

        if (isNaN(applicationId) || applicationId <= 0) return { success: false, error: "Invalid application" };
        if (isNaN(mathScore) || mathScore < 0 || mathScore > 100) return { success: false, error: "Mathematics score must be between 0 and 100" };
        if (isNaN(englishScore) || englishScore < 0 || englishScore > 100) return { success: false, error: "English Language score must be between 0 and 100" };

        const [app] = await db.select().from(admissionApplicationsV2).where(eq(admissionApplicationsV2.id, applicationId)).limit(1);
        if (!app) return { success: false, error: "Application not found" };
        if (app.acceptancePaymentStatus === 'paid') {
            return { success: false, error: "This applicant has already paid their acceptance fee — scores are locked." };
        }

        const [template] = await db.select({
            cutoffPercent: admissionFormTemplates.cutoffPercent,
            name: admissionFormTemplates.name,
        }).from(admissionFormTemplates).where(eq(admissionFormTemplates.id, app.templateId)).limit(1);

        const globalFallback = await getGlobalCutoffFallback();
        const cutoff = parseFloat(template?.cutoffPercent || '') || globalFallback;

        const total = mathScore + englishScore;
        const percentage = computeScreeningPercentage(total);
        const newStatus = decideFromScreening(percentage, cutoff, app.examAttendanceStatus);
        const wasAdmitted = app.status === 'admitted';

        await db.update(admissionApplicationsV2)
            .set({
                mathScore: mathScore.toString(),
                englishScore: englishScore.toString(),
                screeningScore: total.toString(),
                screeningPercentage: percentage.toString(),
                status: newStatus,
                decisionSource: 'auto',
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        revalidatePath("/admin/admission/screening");

        // Congratulate on NEW offers only
        if (newStatus === 'admitted' && !wasAdmitted) {
            await notifyOneOffer(buildOfferTarget(
                applicationId,
                app.data,
                template?.name || 'your application',
                app.applicantId,
            ));
        }

        return {
            success: true,
            mathScore,
            englishScore,
            total,
            percentage,
            status: newStatus,
        };
    } catch (error) {
        console.error("Error updating subject scores (V2):", error);
        return { success: false, error: "Failed to save subject scores" };
    }
}

export interface BulkScoreRowV2 {
    formNumber: string | number; // readable form number (e.g. FSS/2026/00123) OR numeric application id
    mathScore: number;    // 0–100
    englishScore: number; // 0–100
}

export interface BulkUploadResultV2 {
    formNumber: string | number;
    success: boolean;
    error?: string;
    note?: string;
    mathScore?: number;
    englishScore?: number;
    total?: number;
    percentage?: number;
    offered?: boolean;
}

/**
 * Bulk upload of screening scores onto V2 applications.
 * All validation happens up-front; updates run in a single transaction
 * with pre-fetched data (no per-row SELECTs).
 */
export async function bulkUploadSubjectScoresV2(rows: BulkScoreRowV2[]): Promise<{
    success: boolean;
    results: BulkUploadResultV2[];
    processed: number;
    failed: number;
    offeredCount: number;
    error?: string;
}> {
    try {
        const allowed = await hasPermission("admission.applications.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, results: [], processed: 0, failed: 0, offeredCount: 0, error: "Unauthorized" };

        if (!rows || rows.length === 0) {
            return { success: false, results: [], processed: 0, failed: 0, offeredCount: 0, error: "No rows provided" };
        }

        // ── Up-front validation ──
        const seen = new Set<string>();
        type ValidRow = { formNumber: string; mathScore: number; englishScore: number };
        const validRows: ValidRow[] = [];
        const results: BulkUploadResultV2[] = [];
        let failed = 0;

        for (const row of rows) {
            const rawFn = String(row.formNumber ?? "").trim();
            const pushFail = (error: string) => {
                results.push({ formNumber: row.formNumber ?? rawFn, success: false, error });
                failed++;
            };

            if (!rawFn) { pushFail("Invalid form number"); continue; }
            if (isNaN(row.mathScore) || row.mathScore < 0 || row.mathScore > 100) { pushFail(`Math score out of range (${row.mathScore})`); continue; }
            if (isNaN(row.englishScore) || row.englishScore < 0 || row.englishScore > 100) { pushFail(`English score out of range (${row.englishScore})`); continue; }

            const dedupeKey = rawFn.toLowerCase();
            if (seen.has(dedupeKey)) { pushFail("Duplicate form number in this file"); continue; }
            seen.add(dedupeKey);

            validRows.push({ formNumber: rawFn, mathScore: row.mathScore, englishScore: row.englishScore });
        }

        if (validRows.length === 0) {
            return { success: true, results, processed: 0, failed, offeredCount: 0 };
        }

        // ── Split identifiers: numeric = application id, else readable form number ──
        const numericKeys = new Map<number, ValidRow>();
        const formStrings = new Set<string>();
        for (const r of validRows) {
            if (/^\d+$/.test(r.formNumber)) numericKeys.set(Number(r.formNumber), r);
            else formStrings.add(r.formNumber);
        }

        type AppRow = {
            id: number;
            formNumber: string | null;
            templateId: number | null;
            status: string | null;
            examAttendanceStatus: string | null;
            acceptancePaymentStatus: string | null;
            applicantId: number | null;
            data: string | null;
        };

        const selectApp = {
            id: admissionApplicationsV2.id,
            formNumber: admissionApplicationsV2.formNumber,
            templateId: admissionApplicationsV2.templateId,
            status: admissionApplicationsV2.status,
            examAttendanceStatus: admissionApplicationsV2.examAttendanceStatus,
            acceptancePaymentStatus: admissionApplicationsV2.acceptancePaymentStatus,
            applicantId: admissionApplicationsV2.applicantId,
            data: admissionApplicationsV2.data,
        };

        // ── Pre-fetch applications + template cut-offs (2 queries) ──
        const [numericApps, stringApps] = await Promise.all([
            numericKeys.size > 0
                ? db.select(selectApp).from(admissionApplicationsV2).where(inArray(admissionApplicationsV2.id, [...numericKeys.keys()]))
                : Promise.resolve([] as AppRow[]),
            formStrings.size > 0
                ? db.select(selectApp).from(admissionApplicationsV2).where(inArray(
                    sql`lower(${admissionApplicationsV2.formNumber})`,
                    [...formStrings].map(s => s.toLowerCase())
                ))
                : Promise.resolve([] as AppRow[]),
        ]);

        const idMap = new Map<number, AppRow>(numericApps.map(a => [a.id, a]));
        const formMap = new Map<string, AppRow>();
        for (const a of stringApps) {
            if (a.formNumber) formMap.set(a.formNumber.trim().toLowerCase(), a);
        }

        const templateIds = [...new Set([...numericApps, ...stringApps].map(a => a.templateId))].filter((id): id is number => id !== null);
        const templates = templateIds.length > 0
            ? await db.select({ id: admissionFormTemplates.id, cutoffPercent: admissionFormTemplates.cutoffPercent, name: admissionFormTemplates.name })
                .from(admissionFormTemplates).where(inArray(admissionFormTemplates.id, templateIds))
            : [];
        const templateMap = new Map(templates.map(t => [t.id, t]));

        const globalFallback = await getGlobalCutoffFallback();

        // ── Compute outcomes in memory ──
        const updates: Array<{ id: number; set: Partial<typeof admissionApplicationsV2.$inferInsert> }> = [];
        const newOfferTargets: OfferNotificationTarget[] = [];
        let offeredCount = 0;
        let processed = 0;

        for (const row of validRows) {
            const app = /^\d+$/.test(row.formNumber)
                ? idMap.get(Number(row.formNumber))
                : formMap.get(row.formNumber.toLowerCase());
            if (!app) {
                results.push({ formNumber: row.formNumber, success: false, error: "Application not found" });
                failed++;
                continue;
            }
            if (app.acceptancePaymentStatus === 'paid') {
                results.push({ formNumber: row.formNumber, success: false, error: "Acceptance fee already paid — scores are locked" });
                failed++;
                continue;
            }

            const total = row.mathScore + row.englishScore;
            const percentage = computeScreeningPercentage(total);
            const tmpl = templateMap.get(app.templateId || 0);
            const cutoff = parseFloat(tmpl?.cutoffPercent || '') || globalFallback;
            const newStatus = decideFromScreening(percentage, cutoff, app.examAttendanceStatus);
            const wasAdmitted = app.status === 'admitted';

            if (newStatus === 'admitted' && !wasAdmitted) {
                offeredCount++;
                newOfferTargets.push(buildOfferTarget(
                    app.id,
                    app.data,
                    tmpl?.name || 'your application',
                    app.applicantId,
                ));
            }

            updates.push({
                id: app.id,
                set: {
                    mathScore: row.mathScore.toString(),
                    englishScore: row.englishScore.toString(),
                    screeningScore: total.toString(),
                    screeningPercentage: percentage.toString(),
                    status: newStatus,
                    decisionSource: 'auto',
                },
            });

            results.push({
                formNumber: row.formNumber,
                success: true,
                mathScore: row.mathScore,
                englishScore: row.englishScore,
                total,
                percentage,
                offered: newStatus === 'admitted',
                note: app.examAttendanceStatus === 'absent'
                    ? "Marked ABSENT — scored but not offered admission"
                    : undefined,
            });
            processed++;
        }

        // ── Persist in one transaction ──
        if (updates.length > 0) {
            await db.transaction(async (tx) => {
                for (const u of updates) {
                    await tx.update(admissionApplicationsV2)
                        .set(u.set)
                        .where(eq(admissionApplicationsV2.id, u.id));
                }
            });
        }

        // Congratulate all newly-offered applicants (chunked, non-fatal)
        if (newOfferTargets.length > 0) {
            await dispatchOfferNotifications(newOfferTargets);
        }

        revalidatePath("/admin/admission/screening");
        return { success: true, results, processed, failed, offeredCount };
    } catch (error: any) {
        console.error("Bulk upload error (V2):", error);
        return { success: false, results: [], processed: 0, failed: 0, offeredCount: 0, error: error.message || "Bulk upload failed" };
    }
}

/**
 * Bulk attendance sweep: marks every still-'pending' applicant (optionally
 * scoped to one exercise) as present or absent. Used after an exam window
 * closes — physical or online.
 */
export async function sweepPendingAttendance(templateId: number | undefined, markAs: 'present' | 'absent'): Promise<{
    success: boolean;
    count?: number;
    error?: string;
}> {
    try {
        const allowed = await hasPermission("admission.applications.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized" };

        const conditions = [
            ne(admissionApplicationsV2.status, 'draft'),
            eq(admissionApplicationsV2.examAttendanceStatus, 'pending'),
        ];
        if (templateId) conditions.push(eq(admissionApplicationsV2.templateId, templateId));

        const result = await db.update(admissionApplicationsV2)
            .set({ examAttendanceStatus: markAs })
            .where(and(...conditions));

        const count = (result as any)?.rowsAffected ?? (result as any)?.affectedRows ?? 0;
        revalidatePath("/admin/admission/screening");
        revalidatePath("/admin/admission/v2");
        return { success: true, count: Number(count) };
    } catch (error) {
        console.error("Error sweeping attendance:", error);
        return { success: false, error: "Failed to update attendance" };
    }
}

/**
 * Start a new examination round: resets every NON-ADMITTED applicant's
 * attendance back to 'pending' so a fresh register can be taken for the
 * next exam date. Being absent from one sitting is never a final
 * disqualification — candidates may attend a later date.
 *
 * - Admitted applicants (and therefore fee-payers) are untouched.
 * - Existing scores are KEPT: they remain valid until overwritten by a
 *   better/newer attempt at the next sitting.
 */
export async function startNewExamRound(templateId?: number): Promise<{
    success: boolean;
    count?: number;
    error?: string;
}> {
    try {
        const allowed = await hasPermission("admission.applications.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized" };

        const conditions = [
            ne(admissionApplicationsV2.status, 'draft'),
            ne(admissionApplicationsV2.status, 'admitted'),
        ];
        if (templateId) conditions.push(eq(admissionApplicationsV2.templateId, templateId));

        const result = await db.update(admissionApplicationsV2)
            .set({ examAttendanceStatus: 'pending' })
            .where(and(...conditions));

        const count = (result as any)?.rowsAffected ?? (result as any)?.affectedRows ?? 0;
        revalidatePath("/admin/admission/screening");
        revalidatePath("/admin/admission/v2");
        return { success: true, count: Number(count) };
    } catch (error) {
        console.error("Error starting new exam round:", error);
        return { success: false, error: "Failed to reset attendance" };
    }
}

export interface RunSelectionSummary {
    processed: number;
    newlyOffered: number;
    confirmedKept: number;
    revoked: number;
    blockedPaid: number;
    blockedAbsent: number;
}

/**
 * Re-run the selection for one exercise (pass templateId) or all exercises
 * (omit it). Every scored applicant is re-evaluated against their exercise's
 * CURRENT cut-off. Applicants who already paid acceptance fees are never
 * touched. Manual decisions (decision_source='manual') are preserved.
 */
export async function runSelection(templateId?: number): Promise<{
    success: boolean;
    summary?: RunSelectionSummary;
    error?: string;
}> {
    try {
        const allowed = await hasPermission("admission.applications.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized" };

        const globalFallback = await getGlobalCutoffFallback();

        const conditions = [
            ne(admissionApplicationsV2.status, 'draft'),
            isNotNull(admissionApplicationsV2.screeningScore),
        ];
        if (templateId) conditions.push(eq(admissionApplicationsV2.templateId, templateId));

        const apps = await db.select({
            id: admissionApplicationsV2.id,
            templateId: admissionApplicationsV2.templateId,
            status: admissionApplicationsV2.status,
            screeningPercentage: admissionApplicationsV2.screeningPercentage,
            decisionSource: admissionApplicationsV2.decisionSource,
            examAttendanceStatus: admissionApplicationsV2.examAttendanceStatus,
            acceptancePaymentStatus: admissionApplicationsV2.acceptancePaymentStatus,
            applicantId: admissionApplicationsV2.applicantId,
            data: admissionApplicationsV2.data,
        }).from(admissionApplicationsV2).where(and(...conditions));

        const templateIds = [...new Set(apps.map(a => a.templateId))];
        const templates = templateIds.length > 0
            ? await db.select({ id: admissionFormTemplates.id, cutoffPercent: admissionFormTemplates.cutoffPercent, name: admissionFormTemplates.name })
                .from(admissionFormTemplates).where(inArray(admissionFormTemplates.id, templateIds))
            : [];
        const templateMap = new Map(templates.map(t => [t.id, t]));

        const summary: RunSelectionSummary = {
            processed: 0, newlyOffered: 0, confirmedKept: 0, revoked: 0, blockedPaid: 0, blockedAbsent: 0,
        };
        const updates: Array<{ id: number; set: Partial<typeof admissionApplicationsV2.$inferInsert> }> = [];
        const newOfferTargets: OfferNotificationTarget[] = [];

        for (const app of apps) {
            summary.processed++;
            if (app.acceptancePaymentStatus === 'paid') { summary.blockedPaid++; continue; }
            if (app.decisionSource === 'manual') { continue; } // officer's explicit call stands

            const percentage = parseFloat(app.screeningPercentage || '');
            if (isNaN(percentage)) continue;

            const tmpl = templateMap.get(app.templateId);
            const cutoff = parseFloat(tmpl?.cutoffPercent || '') || globalFallback;
            const target = decideFromScreening(percentage, cutoff, app.examAttendanceStatus);

            if (app.examAttendanceStatus === 'absent') summary.blockedAbsent++;

            if (target === app.status) {
                if (target === 'admitted') summary.confirmedKept++;
                continue;
            }

            updates.push({
                id: app.id,
                set: { status: target, decisionSource: 'auto' },
            });
            if (target === 'admitted') {
                summary.newlyOffered++;
                newOfferTargets.push(buildOfferTarget(
                    app.id,
                    app.data,
                    tmpl?.name || 'your application',
                    app.applicantId,
                ));
            }
            else summary.revoked++; // previously admitted, now below cut-off
        }

        if (updates.length > 0) {
            await db.transaction(async (tx) => {
                for (const u of updates) {
                    await tx.update(admissionApplicationsV2)
                        .set(u.set)
                        .where(eq(admissionApplicationsV2.id, u.id));
                }
            });
        }

        // Congratulate all newly-offered applicants (chunked, non-fatal)
        if (newOfferTargets.length > 0) {
            await dispatchOfferNotifications(newOfferTargets);
        }

        revalidatePath("/admin/admission/screening");
        return { success: true, summary };
    } catch (error) {
        console.error("Error running selection:", error);
        return { success: false, error: "Failed to run selection" };
    }
}

/**
 * Explicit manual override by an admission officer.
 * Manual decisions survive re-runs of runSelection().
 * An applicant who has paid their acceptance fee can never be rejected.
 */
export async function decideApplicantManual(applicationId: number, decision: 'admitted' | 'rejected'): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const allowed = await hasPermission("admission.applicant.admit") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized" };

        const [app] = await db.select({
            status: admissionApplicationsV2.status,
            acceptancePaymentStatus: admissionApplicationsV2.acceptancePaymentStatus,
            screeningPercentage: admissionApplicationsV2.screeningPercentage,
            applicantId: admissionApplicationsV2.applicantId,
            templateId: admissionApplicationsV2.templateId,
            data: admissionApplicationsV2.data,
        }).from(admissionApplicationsV2).where(eq(admissionApplicationsV2.id, applicationId)).limit(1);

        if (!app) return { success: false, error: "Application not found" };
        if (app.acceptancePaymentStatus === 'paid') {
            return { success: false, error: "Cannot reverse — acceptance fee already paid." };
        }
        if (decision === 'admitted' && (app.screeningPercentage === null || app.screeningPercentage === undefined)) {
            return { success: false, error: "Save screening scores before admitting manually." };
        }

        await db.update(admissionApplicationsV2)
            .set({ status: decision, decisionSource: 'manual' })
            .where(eq(admissionApplicationsV2.id, applicationId));

        revalidatePath("/admin/admission/screening");

        // Full congratulations (email + in-app + WhatsApp) on NEW offers;
        // rejections get the WhatsApp nudge only.
        if (decision === 'admitted' && app.status !== 'admitted') {
            const [tmpl] = await db.select({ name: admissionFormTemplates.name })
                .from(admissionFormTemplates).where(eq(admissionFormTemplates.id, app.templateId)).limit(1);
            await notifyOneOffer(buildOfferTarget(
                applicationId,
                app.data,
                tmpl?.name || 'your application',
                app.applicantId,
            ));
        } else if (decision === 'rejected') {
            try {
                const form = parseApplicantData(app.data);
                const phone = form.phone || form.phone_number;
                if (phone) {
                    await NotificationService.sendAdmissionUpdate(String(phone), String(form.firstName || 'Applicant'), decision);
                }
            } catch (notifyErr) {
                console.error("Rejection notification failed:", notifyErr);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error deciding applicant:", error);
        return { success: false, error: "Failed to save decision" };
    }
}