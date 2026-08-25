'use server';

import { db } from "@/db";
import { admissionApplications, jambCandidates, programmes, oLevelResults, departments } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { AdmissionScoreCalculator } from "@/lib/admission/engine";
import { NotificationService } from "@/services/NotificationService";
import { hasPermission, hasRole } from "@/lib/rbac";

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
