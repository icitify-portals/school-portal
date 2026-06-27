"use server";

import { db } from "@/db/db";
import { admissionLeads, admissionWaitlists, admissionInterviews, admissionApplicationsV2, users } from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- LEADS / CRM ---
export async function createLead(data: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.insert(admissionLeads).values({
            name: data.name,
            email: data.email,
            phone: data.phone,
            programOfInterest: data.programOfInterest,
            source: data.source,
            notes: data.notes,
            status: "new"
        });

        revalidatePath("/admin/admission/leads");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateLeadStatus(leadId: number, status: "new" | "contacted" | "applied" | "cold") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.update(admissionLeads).set({ status }).where(eq(admissionLeads.id, leadId));
        
        revalidatePath("/admin/admission/leads");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getLeads() {
    return await db.select().from(admissionLeads).orderBy(desc(admissionLeads.createdAt));
}


// --- WAITLIST ---
export async function addToWaitlist(applicationId: number, rankPosition?: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // check if already on waitlist
        const existing = await db.select().from(admissionWaitlists).where(eq(admissionWaitlists.applicationId, applicationId));
        if (existing.length > 0) return { success: false, error: "Application is already on waitlist" };

        await db.insert(admissionWaitlists).values({
            applicationId,
            rankPosition: rankPosition || null,
            status: "waiting"
        });

        // Update application status optionally
        await db.update(admissionApplicationsV2).set({ status: 'rejected' }).where(eq(admissionApplicationsV2.id, applicationId));

        revalidatePath("/admin/admission/waitlist");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateWaitlistStatus(waitlistId: number, status: "waiting" | "offered" | "rejected") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.update(admissionWaitlists).set({ status }).where(eq(admissionWaitlists.id, waitlistId));
        
        if (status === 'offered') {
            const w = await db.select().from(admissionWaitlists).where(eq(admissionWaitlists.id, waitlistId));
            if (w[0]) {
                await db.update(admissionApplicationsV2).set({ status: 'admitted' }).where(eq(admissionApplicationsV2.id, w[0].applicationId));
            }
        }

        revalidatePath("/admin/admission/waitlist");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


// --- INTERVIEWS ---
export async function scheduleInterview(data: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.insert(admissionInterviews).values({
            applicationId: data.applicationId,
            interviewDate: new Date(data.interviewDate),
            interviewerId: data.interviewerId ? Number(data.interviewerId) : Number(session.user.id),
            mode: data.mode,
            locationOrLink: data.locationOrLink,
            notes: data.notes,
            status: "scheduled"
        });

        revalidatePath("/admin/admission/interviews");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateInterviewResult(interviewId: number, status: "scheduled" | "completed" | "no_show" | "cancelled", score?: number, notes?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.update(admissionInterviews).set({ 
            status,
            score: score ?? null,
            notes: notes ?? null
        }).where(eq(admissionInterviews.id, interviewId));

        revalidatePath("/admin/admission/interviews");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
