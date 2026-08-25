'use server';

import { db } from "@/db";
import { admissionApplications, jambCandidates, programmes, oLevelResults, departments, admissionFormTemplates, systemSettings, admissionApplicationsV2, admissionExamResults, users as authUsers } from "@/db/schema";
import { eq, and, desc, inArray, isNotNull, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { AdmissionScoreCalculator } from "@/lib/admission/engine";
import { NotificationService } from "@/services/NotificationService";
import { hasPermission, hasRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { computeScreeningPercentage, decideFromScreening } from "@/lib/admission/screening";

export async function getApplicants(programmeId?: number) {
    try {
        const allowed = await hasPermission("admission.screening.view") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to view applicants", applications: [] };

        // 1. Fetch applications
        const apps = await db.select().from(admissionApplications).orderBy(desc(admissionApplications.appliedAt));

        // 2. Filter in memory if programmeId provided
        let filteredApps = apps;
        if (programmeId) {
            filteredApps = apps.filter(a => a.programmeId === programmeId);
        }

        if (filteredApps.length === 0) return { success: true, applications: [] };

        // 3. Batch fetch related data
        const candidateRegNos = [...new Set(filteredApps.map(a => a.jambRegNo))];
        const progIds = [...new Set(filteredApps.map(a => a.programmeId))];

        const [candidates, progs] = await Promise.all([
            db.select().from(jambCandidates).where(inArray(jambCandidates.jambRegNo, candidateRegNos)),
            db.select().from(programmes).where(inArray(programmes.id, progIds))
        ]);

        const deptIds = [...new Set(candidates.map(c => c.deptId).filter((id): id is number => id !== null))];
        const depts = deptIds.length > 0
            ? await db.select().from(departments).where(inArray(departments.id, deptIds))
            : [];

        // 4. Manual assembly
        const applicationsWithRelations = filteredApps.map(app => {
            const candidateRaw = candidates.find(c => c.jambRegNo === app.jambRegNo);
            const programme = progs.find(p => p.id === app.programmeId);

            let candidate = null;
            if (candidateRaw) {
                candidate = {
                    ...candidateRaw,
                    department: depts.find(d => d.id === candidateRaw.deptId) || null
                };
            }

            return {
                ...app,
                candidate,
                programme: programme || null
            };
        });

        return { success: true, applications: applicationsWithRelations };
    } catch (error) {
        console.error("Error fetching applicants:", error);
        return { success: false, error: "Failed to fetch applicants" };
    }
}

export async function updateScreeningScore(applicationId: number, score: number) {
    try {
        const allowed = await hasPermission("admission.applications.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update screening score" };

        // 1. Update the screening score
        await db.update(admissionApplications)
            .set({
                screeningScore: score.toString(), // It's a decimal (string) in the schema
                status: 'screened' // Valid status values: applied, screened, admitted, rejected
            })
            .where(eq(admissionApplications.id, applicationId));

        // 2. Recalculate full aggregate
        const applicationRaw = await db.select().from(admissionApplications)
            .where(eq(admissionApplications.id, applicationId))
            .limit(1)
            .then(res => res[0]);

        if (!applicationRaw) {
            return { success: false, error: "Application not found" };
        }

        const [candidate, programme] = await Promise.all([
            db.select().from(jambCandidates).where(eq(jambCandidates.jambRegNo, applicationRaw.jambRegNo)).limit(1).then(res => res[0]),
            db.select().from(programmes).where(eq(programmes.id, applicationRaw.programmeId)).limit(1).then(res => res[0])
        ]);

        if (!candidate) {
            return { success: false, error: "Candidate not found for recalculation" };
        }

        const application = {
            ...applicationRaw,
            candidate,
            programme
        };

        if (!application || !application.candidate) {
            return { success: false, error: "Application or Candidate not found for recalculation" };
        }

        // Fetch O-Level results
        const oLevels = await db.select().from(oLevelResults).where(eq(oLevelResults.jambRegNo, application.candidate.jambRegNo));

        // Use engine to calculate
        const aggregate = await AdmissionScoreCalculator.calculate({
            candidate: application.candidate as any,
            programme: application.programme as any,
            oLevelResults: oLevels as any,
            screeningScore: score
        });

        // Update aggregate
        await db.update(admissionApplications)
            .set({ aggregateScore: aggregate.toString() })
            .where(eq(admissionApplications.id, applicationId));

        return { success: true, aggregate };
    } catch (error) {
        console.error("Error updating screening score:", error);
        return { success: false, error: "Failed to update score" };
    }
}

/**
 * Upload Mathematics and English Language entrance exam scores.
 * The combined total (mathScore + englishScore) is stored as screeningScore for aggregate calculation.
 */
export async function updateSubjectScores(applicationId: number, mathScore: number, englishScore: number) {
    try {
        const allowed = await hasPermission("admission.applications.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update screening scores" };

        if (mathScore < 0 || mathScore > 100 || englishScore < 0 || englishScore > 100) {
            return { success: false, error: "Each subject score must be between 0 and 100" };
        }

        const total = mathScore + englishScore; // Out of 200

        // 1. Save individual subject scores + combined screening score
        await db.update(admissionApplications)
            .set({
                mathScore: mathScore.toString(),
                englishScore: englishScore.toString(),
                screeningScore: total.toString(),
                status: 'screened',
            })
            .where(eq(admissionApplications.id, applicationId));

        // 2. Fetch full application for aggregate recalculation
        const applicationRaw = await db.select().from(admissionApplications)
            .where(eq(admissionApplications.id, applicationId))
            .limit(1)
            .then(res => res[0]);

        if (!applicationRaw) return { success: false, error: "Application not found" };

        const [candidate, programme] = await Promise.all([
            db.select().from(jambCandidates).where(eq(jambCandidates.jambRegNo, applicationRaw.jambRegNo)).limit(1).then(res => res[0]),
            db.select().from(programmes).where(eq(programmes.id, applicationRaw.programmeId)).limit(1).then(res => res[0])
        ]);

        if (!candidate) return { success: false, error: "Candidate not found" };

        const oLevels = await db.select().from(oLevelResults).where(eq(oLevelResults.jambRegNo, candidate.jambRegNo));

        const aggregate = await AdmissionScoreCalculator.calculate({
            candidate: candidate as any,
            programme: programme as any,
            oLevelResults: oLevels as any,
            screeningScore: total
        });

        await db.update(admissionApplications)
            .set({ aggregateScore: aggregate.toString() })
            .where(eq(admissionApplications.id, applicationId));

        return { success: true, mathScore, englishScore, total, aggregate };
    } catch (error) {
        console.error("Error updating subject scores:", error);
        return { success: false, error: "Failed to update subject scores" };
    }
}

export async function updateAdmissionStatus(applicationId: number, status: 'admitted' | 'rejected') {
    try {
        const allowed = await hasPermission("admission.applicant.admit") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to admit applicant" };

        await db.update(admissionApplications)
            .set({ status })
            .where(eq(admissionApplications.id, applicationId));

        // Send WhatsApp Notification
        const appRows = await db.select({
            app: admissionApplications,
            candidate: jambCandidates
        })
            .from(admissionApplications)
            .leftJoin(jambCandidates, eq(admissionApplications.jambRegNo, jambCandidates.jambRegNo))
            .where(eq(admissionApplications.id, applicationId))
            .limit(1);

        const app = appRows[0] ? {
            ...appRows[0].app,
            candidate: appRows[0].candidate
        } : null;

        if (app?.candidate?.phone) {
            await NotificationService.sendAdmissionUpdate(
                app.candidate.phone,
                app.candidate.firstname || "Applicant",
                status
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export interface BulkScoreRow {
    formNumber: number;  // admission_applications.id
    mathScore: number;   // 0–100
    englishScore: number; // 0–100
}

export interface BulkUploadResult {
    formNumber: number;
    success: boolean;
    error?: string;
    mathScore?: number;
    englishScore?: number;
    total?: number;
}

/**
 * Bulk upload Mathematics and English Language screening scores from Excel.
 * Each row must have: Form Number (application ID), Math Score (0-100), English Score (0-100).
 */
export async function bulkUploadSubjectScores(rows: BulkScoreRow[]): Promise<{
    success: boolean;
    results: BulkUploadResult[];
    processed: number;
    failed: number;
    error?: string;
}> {
    try {
        const allowed = await hasPermission("admission.applications.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, results: [], processed: 0, failed: 0, error: "Unauthorized" };

        if (!rows || rows.length === 0) {
            return { success: false, results: [], processed: 0, failed: 0, error: "No rows provided" };
        }

        // Fetch all matching applications in one query
        const formNumbers = rows.map(r => r.formNumber);
        const existingApps = await db.select({
            id: admissionApplications.id,
            jambRegNo: admissionApplications.jambRegNo,
            programmeId: admissionApplications.programmeId,
        }).from(admissionApplications).where(inArray(admissionApplications.id, formNumbers));

        const appMap = new Map(existingApps.map(a => [a.id, a]));

        const results: BulkUploadResult[] = [];
        let processed = 0;
        let failed = 0;

        for (const row of rows) {
            const { formNumber, mathScore, englishScore } = row;

            // Validation
            if (isNaN(formNumber) || formNumber <= 0) {
                results.push({ formNumber, success: false, error: "Invalid form number" });
                failed++;
                continue;
            }
            if (isNaN(mathScore) || mathScore < 0 || mathScore > 100) {
                results.push({ formNumber, success: false, error: `Math score out of range (${mathScore})` });
                failed++;
                continue;
            }
            if (isNaN(englishScore) || englishScore < 0 || englishScore > 100) {
                results.push({ formNumber, success: false, error: `English score out of range (${englishScore})` });
                failed++;
                continue;
            }

            const app = appMap.get(formNumber);
            if (!app) {
                results.push({ formNumber, success: false, error: "Application not found" });
                failed++;
                continue;
            }

            try {
                const total = mathScore + englishScore;

                // Save scores
                await db.update(admissionApplications)
                    .set({
                        mathScore: mathScore.toString(),
                        englishScore: englishScore.toString(),
                        screeningScore: total.toString(),
                        status: 'screened',
                    })
                    .where(eq(admissionApplications.id, formNumber));

                // Recalculate aggregate
                const [candidate, programme] = await Promise.all([
                    db.select().from(jambCandidates).where(eq(jambCandidates.jambRegNo, app.jambRegNo)).limit(1).then(r => r[0]),
                    db.select().from(programmes).where(eq(programmes.id, app.programmeId)).limit(1).then(r => r[0]),
                ]);

                if (candidate) {
                    const oLevels = await db.select().from(oLevelResults).where(eq(oLevelResults.jambRegNo, candidate.jambRegNo));
                    const aggregate = await AdmissionScoreCalculator.calculate({
                        candidate: candidate as any,
                        programme: programme as any,
                        oLevelResults: oLevels as any,
                        screeningScore: total,
                    });
                    await db.update(admissionApplications)
                        .set({ aggregateScore: aggregate.toString() })
                        .where(eq(admissionApplications.id, formNumber));
                }

                results.push({ formNumber, success: true, mathScore, englishScore, total });
                processed++;
            } catch (rowErr: any) {
                results.push({ formNumber, success: false, error: rowErr.message || "Failed to save" });
                failed++;
            }
        }

        return { success: true, results, processed, failed };
    } catch (error: any) {
        console.error("Bulk upload error:", error);
        return { success: false, results: [], processed: 0, failed: 0, error: error.message || "Bulk upload failed" };
    }
}

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
    const fromForm = `${form.firstName || form.first_name || ''} ${form.surname || form.lastName || form.last_name || ''}`.trim();
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

        return { success: true, exercises, applicants };
    } catch (error) {
        console.error("Error fetching screening applicants:", error);
        return { success: false, error: "Failed to fetch screening applicants" };
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

        const [template] = await db.select({ cutoffPercent: admissionFormTemplates.cutoffPercent })
            .from(admissionFormTemplates).where(eq(admissionFormTemplates.id, app.templateId)).limit(1);

        const globalFallback = await getGlobalCutoffFallback();
        const cutoff = parseFloat(template?.cutoffPercent || '') || globalFallback;

        const total = mathScore + englishScore;
        const percentage = computeScreeningPercentage(total);
        const newStatus = decideFromScreening(percentage, cutoff, app.examAttendanceStatus);

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
    formNumber: number;   // admission_applications_v2.id (or numeric formNumber)
    mathScore: number;    // 0–100
    englishScore: number; // 0–100
}

export interface BulkUploadResultV2 {
    formNumber: number;
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
        const seen = new Set<number>();
        type ValidRow = { formNumber: number; mathScore: number; englishScore: number };
        const validRows: ValidRow[] = [];
        const results: BulkUploadResultV2[] = [];
        let failed = 0;

        for (const row of rows) {
            const { formNumber } = row;
            const pushFail = (error: string) => {
                results.push({ formNumber, success: false, error });
                failed++;
            };

            if (isNaN(formNumber) || formNumber <= 0) { pushFail("Invalid form number"); continue; }
            if (seen.has(formNumber)) { pushFail("Duplicate form number in this file"); continue; }
            seen.add(formNumber);
            if (isNaN(row.mathScore) || row.mathScore < 0 || row.mathScore > 100) { pushFail(`Math score out of range (${row.mathScore})`); continue; }
            if (isNaN(row.englishScore) || row.englishScore < 0 || row.englishScore > 100) { pushFail(`English score out of range (${row.englishScore})`); continue; }

            validRows.push({ formNumber, mathScore: row.mathScore, englishScore: row.englishScore });
        }

        if (validRows.length === 0) {
            return { success: true, results, processed: 0, failed, offeredCount: 0 };
        }

        // ── Pre-fetch applications + template cut-offs (2 queries) ──
        const formNumbers = validRows.map(r => r.formNumber);
        const existingApps = await db.select({
            id: admissionApplicationsV2.id,
            templateId: admissionApplicationsV2.templateId,
            status: admissionApplicationsV2.status,
            examAttendanceStatus: admissionApplicationsV2.examAttendanceStatus,
            acceptancePaymentStatus: admissionApplicationsV2.acceptancePaymentStatus,
        }).from(admissionApplicationsV2).where(inArray(admissionApplicationsV2.id, formNumbers));
        const appMap = new Map(existingApps.map(a => [a.id, a]));

        const templateIds = [...new Set(existingApps.map(a => a.templateId))];
        const templates = templateIds.length > 0
            ? await db.select({ id: admissionFormTemplates.id, cutoffPercent: admissionFormTemplates.cutoffPercent })
                .from(admissionFormTemplates).where(inArray(admissionFormTemplates.id, templateIds))
            : [];
        const templateCutoffMap = new Map(templates.map(t => [t.id, t.cutoffPercent]));

        const globalFallback = await getGlobalCutoffFallback();

        // ── Compute outcomes in memory ──
        const updates: Array<{ id: number; set: Partial<typeof admissionApplicationsV2.$inferInsert> }> = [];
        let offeredCount = 0;
        let processed = 0;

        for (const row of validRows) {
            const app = appMap.get(row.formNumber);
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
            const cutoff = parseFloat(templateCutoffMap.get(app.templateId) || '') || globalFallback;
            const newStatus = decideFromScreening(percentage, cutoff, app.examAttendanceStatus);
            const wasAdmitted = app.status === 'admitted';

            if (newStatus === 'admitted' && !wasAdmitted) offeredCount++;

            updates.push({
                id: row.formNumber,
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

        revalidatePath("/admin/admission/screening");
        return { success: true, results, processed, failed, offeredCount };
    } catch (error: any) {
        console.error("Bulk upload error (V2):", error);
        return { success: false, results: [], processed: 0, failed: 0, offeredCount: 0, error: error.message || "Bulk upload failed" };
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
        }).from(admissionApplicationsV2).where(and(...conditions));

        const templateIds = [...new Set(apps.map(a => a.templateId))];
        const templates = templateIds.length > 0
            ? await db.select({ id: admissionFormTemplates.id, cutoffPercent: admissionFormTemplates.cutoffPercent })
                .from(admissionFormTemplates).where(inArray(admissionFormTemplates.id, templateIds))
            : [];
        const templateCutoffMap = new Map(templates.map(t => [t.id, t.cutoffPercent]));

        const summary: RunSelectionSummary = {
            processed: 0, newlyOffered: 0, confirmedKept: 0, revoked: 0, blockedPaid: 0, blockedAbsent: 0,
        };
        const updates: Array<{ id: number; set: Partial<typeof admissionApplicationsV2.$inferInsert> }> = [];

        for (const app of apps) {
            summary.processed++;
            if (app.acceptancePaymentStatus === 'paid') { summary.blockedPaid++; continue; }
            if (app.decisionSource === 'manual') { continue; } // officer's explicit call stands

            const percentage = parseFloat(app.screeningPercentage || '');
            if (isNaN(percentage)) continue;

            const cutoff = parseFloat(templateCutoffMap.get(app.templateId) || '') || globalFallback;
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
            if (target === 'admitted') summary.newlyOffered++;
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
            acceptancePaymentStatus: admissionApplicationsV2.acceptancePaymentStatus,
            screeningPercentage: admissionApplicationsV2.screeningPercentage,
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

        // WhatsApp nudge consistent with legacy behaviour (email lands in Phase 6)
        try {
            const [full] = await db.select({ data: admissionApplicationsV2.data })
                .from(admissionApplicationsV2).where(eq(admissionApplicationsV2.id, applicationId)).limit(1);
            const form = parseApplicantData(full?.data);
            const phone = form.phone || form.phone_number;
            if (phone) {
                await NotificationService.sendAdmissionUpdate(phone, form.firstName || "Applicant", decision);
            }
        } catch (notifyErr) {
            console.error("Admission notification failed:", notifyErr);
        }

        return { success: true };
    } catch (error) {
        console.error("Error deciding applicant:", error);
        return { success: false, error: "Failed to save decision" };
    }
}
