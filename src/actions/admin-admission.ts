
'use server';

import { db } from "@/db";
import { admissionApplications, jambCandidates, programmes, oLevelResults, departments } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { AdmissionScoreCalculator } from "@/lib/admission/engine";
import { NotificationService } from "@/services/NotificationService";

export async function getApplicants(programmeId?: number) {
    try {
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

export async function updateAdmissionStatus(applicationId: number, status: 'admitted' | 'rejected') {
    try {
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
