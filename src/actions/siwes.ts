"use server";

import { db } from "@/db/db";
import {
    siwesConfigs,
    siwesCompanies,
    siwesPlacements,
    siwesLogbooks,
    siwesAssessments,
    students,
    departments,
    programmes,
    faculties,
    users
} from "@/db/schema";
import { eq, and, or, isNull, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSiwesEligibility(studentId: number) {
    try {
        const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
        if (!student) return { success: false, error: "Student not found" };

        const programme = student.programmeId ? (await db.select().from(programmes).where(eq(programmes.id, student.programmeId)).limit(1))[0] : null;
        const department = student.deptId ? (await db.select().from(departments).where(eq(departments.id, student.deptId)).limit(1))[0] : null;

        const studentWithRel = { ...student, programme, department };

        if (!student) return { success: false, error: "Student not found" };

        // Check if there's a config that matches this student
        const configs = await db.query.siwesConfigs.findMany({
            where: eq(siwesConfigs.isActive, true)
        });

        const eligibility = configs.find(c =>
            (!c.facultyId || c.facultyId === studentWithRel.department?.facultyId) &&
            (!c.deptId || c.deptId === studentWithRel.deptId) &&
            (!c.programmeId || c.programmeId === studentWithRel.programmeId)
        );

        if (!eligibility) {
            return { success: false, isEligible: false, message: "Your programme is not eligible for SIWES at this time." };
        }

        return {
            success: true,
            isEligible: true,
            config: eligibility
        };
    } catch (error) {
        console.error("Failed to check SIWES eligibility:", error);
        return { success: false, error: "Database error" };
    }
}

export async function getSiwesCompanies(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const companies = await db.query.siwesCompanies.findMany({
            where: eq(siwesCompanies.isApproved, true)
        });
        return { success: true, data: companies };
    } catch (error) {
        return { success: false, error: "Failed to fetch companies" };
    }
}

export async function requestCompany(data: { name: string, address: string, email?: string, phone?: string, addedById: number }) {
    try {
        await db.insert(siwesCompanies).values({
            ...data,
            isApproved: false
        });
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to submit company request" };
    }
}

export async function applyToCompany(studentId: number, companyId: number) {
    try {
        // Check if student already has an active placement
        const existing = await db.query.siwesPlacements.findFirst({
            where: and(
                eq(siwesPlacements.studentId, studentId),
                or(
                    eq(siwesPlacements.status, 'applied'),
                    eq(siwesPlacements.status, 'accepted')
                )
            )
        });

        if (existing) return { success: false, error: "You already have an active placement or application." };

        await db.insert(siwesPlacements).values({
            studentId,
            companyId,
            status: 'applied'
        });
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to apply" };
    }
}

export async function uploadAcceptanceLetter(placementId: number, url: string) {
    try {
        await db.update(siwesPlacements)
            .set({
                acceptanceLetterUrl: url,
                status: 'accepted'
            })
            .where(eq(siwesPlacements.id, placementId));
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to upload letter" };
    }
}

export async function submitLogbook(data: { placementId: number, weekNumber: number, activities: string, signedLogbookUrl?: string }) {
    try {
        await db.insert(siwesLogbooks).values({
            ...data,
            status: 'submitted'
        });
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to submit logbook" };
    }
}

export async function getStudentPlacements(studentId: number): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const basePlacements = await db.select().from(siwesPlacements)
            .where(eq(siwesPlacements.studentId, studentId))
            .orderBy(desc(siwesPlacements.createdAt));
        
        if (basePlacements.length === 0) return { success: true, data: [] };

        const placementIds = basePlacements.map(p => p.id);
        const companyIds = Array.from(new Set(basePlacements.map(p => p.companyId).filter((id): id is number => id !== null)));

        const [companies, allLogbooks, allAssessments] = await Promise.all([
            companyIds.length > 0 ? db.select().from(siwesCompanies).where(inArray(siwesCompanies.id, companyIds)) : [],
            db.select().from(siwesLogbooks).where(inArray(siwesLogbooks.placementId, placementIds)),
            db.select().from(siwesAssessments).where(inArray(siwesAssessments.placementId, placementIds))
        ]);

        const data = basePlacements.map(p => ({
            ...p,
            company: companies.find(c => c.id === p.companyId),
            logbooks: allLogbooks.filter(l => l.placementId === p.id),
            assessment: allAssessments.find(a => a.placementId === p.id)
        }));

        return { success: true, data };
    } catch (error) {
        return { success: false, error: "Failed to fetch placements" };
    }
}

export async function getPlacementsForAdmin(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const basePlacements = await db.select().from(siwesPlacements);
        if (basePlacements.length === 0) return { success: true, data: [] };

        const placementIds = basePlacements.map(p => p.id);
        const studentIds = Array.from(new Set(basePlacements.map(p => p.studentId).filter((id): id is number => id !== null)));
        const companyIds = Array.from(new Set(basePlacements.map(p => p.companyId).filter((id): id is number => id !== null)));

        const [studentsList, companies, allLogbooks, allAssessments] = await Promise.all([
            db.select().from(students).where(inArray(students.id, studentIds)),
            db.select().from(siwesCompanies).where(inArray(siwesCompanies.id, companyIds)),
            db.select().from(siwesLogbooks).where(inArray(siwesLogbooks.placementId, placementIds)),
            db.select().from(siwesAssessments).where(inArray(siwesAssessments.placementId, placementIds))
        ]);

        const userIds = Array.from(new Set(studentsList.map(s => s.userId).filter((id): id is number => id !== null)));
        const progIds = Array.from(new Set(studentsList.map(s => s.programmeId).filter((id): id is number => id !== null)));

        const [usersList, programmesList] = await Promise.all([
            userIds.length > 0 ? db.select().from(users).where(inArray(users.id, userIds)) : [],
            progIds.length > 0 ? db.select().from(programmes).where(inArray(programmes.id, progIds)) : []
        ]);

        const data = basePlacements.map(p => {
            const student = studentsList.find(s => s.id === p.studentId);
            return {
                ...p,
                student: student ? {
                    ...student,
                    user: usersList.find(u => u.id === student.userId),
                    programme: programmesList.find(pr => pr.id === student.programmeId)
                } : null,
                company: companies.find(c => c.id === p.companyId),
                logbooks: allLogbooks.filter(l => l.placementId === p.id),
                assessment: allAssessments.find(a => a.placementId === p.id)
            };
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error: "Failed to fetch admin placements" };
    }
}

export async function assessPlacement(data: {
    placementId: number,
    supervisorScore: number,
    supervisorComment: string,
    centreApprovalStatus: 'pending' | 'approved' | 'rejected'
}) {
    try {
        // Upsert assessment
        const existing = await db.query.siwesAssessments.findFirst({
            where: eq(siwesAssessments.placementId, data.placementId)
        });

        if (existing) {
            await db.update(siwesAssessments)
                .set({
                    ...data,
                    assessedAt: new Date()
                })
                .where(eq(siwesAssessments.id, existing.id));
        } else {
            await db.insert(siwesAssessments).values({
                ...data,
                assessedAt: new Date()
            });
        }

        if (data.centreApprovalStatus === 'approved') {
            await db.update(siwesPlacements)
                .set({ status: 'completed' })
                .where(eq(siwesPlacements.id, data.placementId));
        }

        revalidatePath("/admin/siwes");
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to save assessment" };
    }
}

export async function addSiwesConfig(data: any): Promise<{ success: boolean; error?: string }> {
    try {
        await db.insert(siwesConfigs).values(data);
        revalidatePath("/admin/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to add config" };
    }
}

export async function getSiwesConfigs(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const baseConfigs = await db.select().from(siwesConfigs);
        if (baseConfigs.length === 0) return { success: true, data: [] };

        const facultyIds = Array.from(new Set(baseConfigs.map(c => c.facultyId).filter(Boolean))) as number[];
        const deptIds = Array.from(new Set(baseConfigs.map(c => c.deptId).filter(Boolean))) as number[];
        const progIds = Array.from(new Set(baseConfigs.map(c => c.programmeId).filter(Boolean))) as number[];

        const [facultiesList, deptsList, progsList] = await Promise.all([
            facultyIds.length > 0 ? db.select().from(faculties).where(inArray(faculties.id, facultyIds)) : [],
            deptIds.length > 0 ? db.select().from(departments).where(inArray(departments.id, deptIds)) : [],
            progIds.length > 0 ? db.select().from(programmes).where(inArray(programmes.id, progIds)) : []
        ]);

        const data = baseConfigs.map(c => ({
            ...c,
            faculty: facultiesList.find(f => f.id === c.facultyId),
            department: deptsList.find(d => d.id === c.deptId),
            programme: progsList.find(p => p.id === c.programmeId)
        }));


        return { success: true, data };
    } catch (error) {
        return { success: false, error: "Failed to fetch configs" };
    }
}
