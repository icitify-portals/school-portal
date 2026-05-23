"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { crmLeads, crmLeadInteractions, users, institutionalUnits, programmes } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitInquiry(data: {
    name: string;
    email: string;
    phone?: string;
    programmeId?: number;
    unitId?: number;
    source?: string;
}) {
    try {
        await db.insert(crmLeads).values({
            name: data.name,
            email: data.email,
            phone: data.phone,
            programmeId: data.programmeId,
            unitId: data.unitId,
            source: data.source || 'website',
            status: 'new'
        });
        return { success: true, message: "Inquiry submitted successfully. We will contact you soon." };
    } catch (error) {
        console.error("Submit Inquiry Error:", error);
        return { error: "Failed to submit inquiry. Please try again." };
    }
}

export async function getLeads(filters?: { status?: any; unitId?: number }) {
    try {
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        let query = db.select({
            id: crmLeads.id,
            name: crmLeads.name,
            email: crmLeads.email,
            phone: crmLeads.phone,
            status: crmLeads.status,
            priority: crmLeads.priority,
            createdAt: crmLeads.createdAt,
            programmeName: programmes.name,
            unitName: institutionalUnits.name,
            assignedTo: users.name
        })
        .from(crmLeads)
        .leftJoin(programmes, eq(crmLeads.programmeId, programmes.id))
        .leftJoin(institutionalUnits, eq(crmLeads.unitId, institutionalUnits.id))
        .leftJoin(users, eq(crmLeads.assignedStaffId, users.id))
        .orderBy(desc(crmLeads.createdAt));

        const leads = await query;
        return { success: true, leads };
    } catch (error) {
        console.error("Get Leads Error:", error);
        return { error: "Failed to fetch leads." };
    }
}

export async function updateLeadStatus(leadId: number, status: any) {
    try {
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        await db.update(crmLeads)
            .set({ status, updatedAt: new Date() })
            .where(eq(crmLeads.id, leadId));

        revalidatePath("/admin/crm");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update lead status." };
    }
}

export async function addLeadInteraction(leadId: number, data: { type: any; summary: string }) {
    try {
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        const userId = parseInt(session.user.id!);

        await db.insert(crmLeadInteractions).values({
            leadId,
            staffId: userId,
            type: data.type,
            summary: data.summary
        });

        // Update lead's last contacted timestamp
        await db.update(crmLeads)
            .set({ lastContactedAt: new Date(), updatedAt: new Date() })
            .where(eq(crmLeads.id, leadId));

        revalidatePath(`/admin/crm/lead/${leadId}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to add interaction." };
    }
}

export async function getLeadDetails(leadId: number) {
    try {
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        const lead = await db.query.crmLeads.findFirst({
            where: eq(crmLeads.id, leadId),
            with: {
                programme: true,
                unit: true,
                assignedStaff: true,
                interactions: {
                    with: {
                        staff: true
                    },
                    orderBy: desc(crmLeadInteractions.createdAt)
                }
            }
        });

        return { success: true, lead };
    } catch (error) {
        return { error: "Failed to fetch lead details." };
    }
}
