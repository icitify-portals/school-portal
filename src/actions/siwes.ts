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
    users,
    staffProfiles
} from "@/db/schema";
import { NotificationService } from "@/services/NotificationService";
import { eq, and, or, isNull, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasRole, hasPermission } from "@/lib/rbac";

export async function getSiwesEligibility(studentId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = parseInt(session.user.id);

        const isStaff = await hasPermission("siwes.placement.view") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");

        const [student] = await db.select().from(students).where(
            isStaff ? eq(students.id, studentId) : and(eq(students.id, studentId), eq(students.userId, userId))
        ).limit(1);
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
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
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
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        if (data.addedById !== parseInt(session.user.id)) return { success: false, error: "Unauthorized" };
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
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = parseInt(session.user.id);

        const [student] = await db.select().from(students).where(and(eq(students.id, studentId), eq(students.userId, userId))).limit(1);
        if (!student) return { success: false, error: "Unauthorized" };

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
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = parseInt(session.user.id);

        const [placement] = await db.select().from(siwesPlacements).where(eq(siwesPlacements.id, placementId)).limit(1);
        if (!placement) return { success: false, error: "Placement not found" };

        const [student] = await db.select().from(students).where(and(eq(students.id, placement.studentId), eq(students.userId, userId))).limit(1);
        if (!student) return { success: false, error: "Unauthorized" };
        await db.update(siwesPlacements)
            .set({
                acceptanceLetterUrl: url
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
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = parseInt(session.user.id);

        const [placement] = await db.select().from(siwesPlacements).where(eq(siwesPlacements.id, data.placementId)).limit(1);
        if (!placement) return { success: false, error: "Placement not found" };

        const [student] = await db.select().from(students).where(and(eq(students.id, placement.studentId), eq(students.userId, userId))).limit(1);
        if (!student) return { success: false, error: "Unauthorized" };
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
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = parseInt(session.user.id);

        const isStaff = await hasPermission("siwes.placement.view") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");

        const [student] = await db.select().from(students).where(
            isStaff ? eq(students.id, studentId) : and(eq(students.id, studentId), eq(students.userId, userId))
        ).limit(1);
        if (!student) return { success: false, error: "Unauthorized" };

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

        const supervisorIds = Array.from(new Set(basePlacements.map(p => p.supervisorId).filter((id): id is number => id !== null)));
        const supervisors = supervisorIds.length > 0 ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, supervisorIds)) : [];

        const data = basePlacements.map(p => ({
            ...p,
            company: companies.find(c => c.id === p.companyId),
            logbooks: allLogbooks.filter(l => l.placementId === p.id),
            assessment: allAssessments.find(a => a.placementId === p.id),
            supervisor: p.supervisorId ? supervisors.find(s => s.id === p.supervisorId) : null
        }));

        return { success: true, data };
    } catch (error) {
        return { success: false, error: "Failed to fetch placements" };
    }
}

export async function getPlacementsForAdmin(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const isAuth = await hasPermission("siwes.placement.view") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };
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

        const supervisorIds = Array.from(new Set(basePlacements.map(p => p.supervisorId).filter((id): id is number => id !== null)));
        const supervisors = supervisorIds.length > 0 ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, supervisorIds)) : [];

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
                assessment: allAssessments.find(a => a.placementId === p.id),
                supervisor: p.supervisorId ? supervisors.find(s => s.id === p.supervisorId) : null
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
    finalReportUrl?: string,
    centreApprovalStatus: 'pending' | 'approved' | 'rejected',
    centreComment?: string
}) {
    try {
        const isAuth = await hasPermission("siwes.placement.assess") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };
        // Upsert assessment
        const existing = await db.query.siwesAssessments.findFirst({
            where: eq(siwesAssessments.placementId, data.placementId)
        });

        const assessmentValues: any = {
            supervisorScore: data.supervisorScore,
            supervisorComment: data.supervisorComment,
            centreApprovalStatus: data.centreApprovalStatus,
            centreComment: data.centreComment || null,
            assessedAt: new Date()
        };
        if (data.finalReportUrl !== undefined) assessmentValues.finalReportUrl = data.finalReportUrl || null;

        if (existing) {
            await db.update(siwesAssessments)
                .set(assessmentValues)
                .where(eq(siwesAssessments.id, existing.id));
        } else {
            await db.insert(siwesAssessments).values({
                ...assessmentValues,
                placementId: data.placementId
            });
        }

        if (data.centreApprovalStatus === 'approved') {
            await db.update(siwesPlacements)
                .set({ status: 'completed' })
                .where(eq(siwesPlacements.id, data.placementId));
        }

        // Notify student of assessment outcome
        const [placement] = await db.select().from(siwesPlacements).where(eq(siwesPlacements.id, data.placementId)).limit(1);
        if (placement) {
            const [student] = await db.select().from(students).where(eq(students.id, placement.studentId)).limit(1);
            if (student?.userId) {
                await NotificationService.notifyUser(student.userId, {
                    title: "SIWES Assessment Completed",
                    message: data.centreApprovalStatus === 'approved'
                        ? `Congratulations! Your SIWES placement has been approved and marked completed. Final score: ${data.supervisorScore}/100.`
                        : data.centreApprovalStatus === 'rejected'
                            ? `Your SIWES assessment was not approved${data.centreComment ? `: ${data.centreComment}` : ''}.`
                            : `Your SIWES assessment has been recorded. Score: ${data.supervisorScore}/100.`,
                    type: data.centreApprovalStatus === 'approved' ? 'success' : data.centreApprovalStatus === 'rejected' ? 'error' : 'info',
                    channels: ['toast', 'email']
                });
            }
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
        const isAuth = await hasPermission("siwes.config.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };
        await db.insert(siwesConfigs).values(data);
        revalidatePath("/admin/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to add config" };
    }
}

export async function getSiwesConfigs(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const isAuth = await hasPermission("siwes.config.manage") || await hasPermission("siwes.placement.view") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };
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

export async function toggleSiwesConfig(configId: number) {
    try {
        const isAuth = await hasPermission("siwes.config.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };
        const [existing] = await db.select().from(siwesConfigs).where(eq(siwesConfigs.id, configId)).limit(1);
        if (!existing) return { success: false, error: "Configuration not found" };
        await db.update(siwesConfigs)
            .set({ isActive: !existing.isActive })
            .where(eq(siwesConfigs.id, configId));
        revalidatePath("/admin/siwes");
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update configuration" };
    }
}

export async function getAdminCompanies(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const isAuth = await hasPermission("siwes.placement.view") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };
        const companies = await db.select().from(siwesCompanies).orderBy(desc(siwesCompanies.id));
        const addedByIds = Array.from(new Set(companies.map(c => c.addedById).filter((id): id is number => id !== null)));
        const addedByUsers = addedByIds.length > 0 ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, addedByIds)) : [];
        const data = companies.map(c => ({
            ...c,
            addedBy: addedByIds.includes(c.addedById as number) ? addedByUsers.find(u => u.id === c.addedById) : null
        }));
        return { success: true, data };
    } catch (error) {
        return { success: false, error: "Failed to fetch companies" };
    }
}

export async function setCompanyApproval(companyId: number, approved: boolean) {
    try {
        const isAuth = await hasPermission("siwes.config.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };
        await db.update(siwesCompanies)
            .set({ isApproved: approved })
            .where(eq(siwesCompanies.id, companyId));
        revalidatePath("/admin/siwes");
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update company" };
    }
}

export async function updateCompany(companyId: number, data: { name?: string; address?: string; email?: string | null; phone?: string | null }) {
    try {
        const isAuth = await hasPermission("siwes.config.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };
        const [company] = await db.select().from(siwesCompanies).where(eq(siwesCompanies.id, companyId)).limit(1);
        if (!company) return { success: false, error: "Company not found" };

        const updates: Record<string, any> = {};
        if (data.name !== undefined && data.name.trim()) updates.name = data.name.trim();
        if (data.address !== undefined) updates.address = data.address || null;
        if (data.email !== undefined) updates.email = data.email || null;
        if (data.phone !== undefined) updates.phone = data.phone || null;

        if (Object.keys(updates).length === 0) return { success: false, error: "No changes provided" };

        await db.update(siwesCompanies)
            .set(updates)
            .where(eq(siwesCompanies.id, companyId));
        revalidatePath("/admin/siwes");
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update company" };
    }
}

export async function reviewLogbook(logbookId: number, status: 'approved' | 'flagged', coordinatorComment?: string) {
    try {
        const isAuth = await hasPermission("siwes.placement.assess") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };
        await db.update(siwesLogbooks)
            .set({ status, coordinatorComment: coordinatorComment || null })
            .where(eq(siwesLogbooks.id, logbookId));
        revalidatePath("/admin/siwes");
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to review logbook entry" };
    }
}

export async function editLogbook(logbookId: number, activities: string, signedLogbookUrl?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = parseInt(session.user.id);

        const [logbook] = await db.select().from(siwesLogbooks).where(eq(siwesLogbooks.id, logbookId)).limit(1);
        if (!logbook) return { success: false, error: "Logbook entry not found" };
        if (logbook.status === 'approved') return { success: false, error: "Approved entries cannot be edited." };

        const [placement] = await db.select().from(siwesPlacements).where(eq(siwesPlacements.id, logbook.placementId)).limit(1);
        if (!placement) return { success: false, error: "Placement not found" };
        const [student] = await db.select().from(students).where(and(eq(students.id, placement.studentId), eq(students.userId, userId))).limit(1);
        if (!student) return { success: false, error: "Unauthorized" };

        await db.update(siwesLogbooks)
            .set({ activities, signedLogbookUrl: signedLogbookUrl || null, status: 'submitted' })
            .where(eq(siwesLogbooks.id, logbookId));
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update logbook entry" };
    }
}

export async function deleteLogbook(logbookId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = parseInt(session.user.id);

        const [logbook] = await db.select().from(siwesLogbooks).where(eq(siwesLogbooks.id, logbookId)).limit(1);
        if (!logbook) return { success: false, error: "Logbook entry not found" };
        if (logbook.status === 'approved') return { success: false, error: "Approved entries cannot be deleted." };

        const [placement] = await db.select().from(siwesPlacements).where(eq(siwesPlacements.id, logbook.placementId)).limit(1);
        if (!placement) return { success: false, error: "Placement not found" };
        const [student] = await db.select().from(students).where(and(eq(students.id, placement.studentId), eq(students.userId, userId))).limit(1);
        if (!student) return { success: false, error: "Unauthorized" };

        await db.delete(siwesLogbooks).where(eq(siwesLogbooks.id, logbookId));
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete logbook entry" };
    }
}

export async function updatePlacementStatus(
    placementId: number,
    newStatus: 'accepted' | 'rejected' | 'completed' | 'cancelled',
    comment?: string
) {
    try {
        const isAuth = await hasPermission("siwes.placement.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };

        const [placement] = await db.select().from(siwesPlacements).where(eq(siwesPlacements.id, placementId)).limit(1);
        if (!placement) return { success: false, error: "Placement not found" };

        // Validate transitions
        if (newStatus === 'accepted' && placement.status !== 'applied') return { success: false, error: "Only applied placements can be accepted." };
        if (newStatus === 'rejected' && placement.status !== 'applied') return { success: false, error: "Only applied placements can be rejected." };
        if (newStatus === 'completed' && placement.status !== 'accepted') return { success: false, error: "Only accepted placements can be completed." };
        if (newStatus === 'cancelled' && placement.status !== 'accepted' && placement.status !== 'applied') return { success: false, error: "This placement cannot be cancelled." };

        await db.update(siwesPlacements)
            .set({ status: newStatus })
            .where(eq(siwesPlacements.id, placementId));

        // Notify student via email + in-app
        const [student] = await db.select().from(students).where(eq(students.id, placement.studentId)).limit(1);
        if (student?.userId) {
            const label = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
            await NotificationService.notifyUser(student.userId, {
                title: `SIWES Placement ${label}`,
                message: comment || `Your SIWES placement status has changed to ${label}.`,
                type: newStatus === 'accepted' || newStatus === 'completed' ? 'success' : newStatus === 'rejected' ? 'error' : 'warning',
                channels: ['toast', 'email']
            });
        }

        revalidatePath("/admin/siwes");
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        console.error("Failed to update placement status:", error);
        return { success: false, error: "Failed to update placement status" };
    }
}

export async function updatePlacementDetails(
    placementId: number,
    data: { startDate?: string; endDate?: string; supervisorId?: number | null }
) {
    try {
        const isAuth = await hasPermission("siwes.placement.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };

        const [placement] = await db.select().from(siwesPlacements).where(eq(siwesPlacements.id, placementId)).limit(1);
        if (!placement) return { success: false, error: "Placement not found" };

        const updates: Record<string, any> = {};
        if (data.startDate !== undefined) updates.startDate = data.startDate || null;
        if (data.endDate !== undefined) updates.endDate = data.endDate || null;
        if (data.supervisorId !== undefined) updates.supervisorId = data.supervisorId || null;

        if (Object.keys(updates).length === 0) return { success: false, error: "No changes provided" };

        await db.update(siwesPlacements)
            .set(updates)
            .where(eq(siwesPlacements.id, placementId));

        // Notify student about supervisor assignment
        if (data.supervisorId) {
            const [supervisorUser] = await db.select({ name: users.name })
                .from(staffProfiles)
                .innerJoin(users, eq(staffProfiles.userId, users.id))
                .where(eq(staffProfiles.id, data.supervisorId))
                .limit(1);
            const [student] = await db.select().from(students).where(eq(students.id, placement.studentId)).limit(1);
            if (student?.userId && supervisorUser) {
                await NotificationService.notifyUser(student.userId, {
                    title: "SIWES Supervisor Assigned",
                    message: `${supervisorUser.name} has been assigned as your SIWES supervisor.`,
                    type: "info",
                    channels: ['toast', 'email']
                });
            }
        }

        revalidatePath("/admin/siwes");
        revalidatePath("/student/siwes");
        return { success: true };
    } catch (error) {
        console.error("Failed to update placement details:", error);
        return { success: false, error: "Failed to update placement details" };
    }
}

export async function getStaffList(): Promise<{ success: boolean; data?: { userId: number; name: string; jobTitle: string; department: string | null; staffId: string | null }[]; error?: string }> {
    try {
        const isAuth = await hasPermission("siwes.placement.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("siwes_coordinator");
        if (!isAuth) return { success: false, error: "Unauthorized" };

        const rows = await db.select({
            staffId: staffProfiles.staffId,
            jobTitle: staffProfiles.jobTitle,
            department: staffProfiles.department,
            userId: staffProfiles.userId,
            name: users.name,
        })
            .from(staffProfiles)
            .innerJoin(users, eq(staffProfiles.userId, users.id))
            .where(eq(staffProfiles.isActive, true))
            .orderBy(users.name);

        return {
            success: true,
            data: rows.map(r => ({
                userId: r.userId!,
                name: r.name,
                jobTitle: r.jobTitle,
                department: r.department,
                staffId: r.staffId,
            }))
        };
    } catch (error) {
        console.error("Failed to fetch staff list:", error);
        return { success: false, error: "Failed to fetch staff" };
    }
}
