"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";
import { SupportTicketService } from "@/services/SupportTicketService";

/**
 * Resolves current user record from active session.
 */
async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.email) return null;

    const [user] = await db.select({
        id: users.id,
        role: users.role,
        name: users.name
    })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

    return user || null;
}

/**
 * Create a personal support ticket.
 */
export async function createSupportTicketAction(data: {
    title: string;
    description: string;
    category: 'technical' | 'academic' | 'financial' | 'hostel' | 'administrative' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
}) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized: Please log in" };

        const result = await SupportTicketService.createTicket(user.id, data);
        revalidatePath("/support/tickets");
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get ticket details and conversation thread. Enforces ownership and RBAC bounds.
 */
export async function getTicketWithMessagesAction(ticketId: number) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const ticket = await SupportTicketService.getTicketWithMessages(ticketId);
        if (!ticket) return { success: false, error: "Ticket not found" };

        // Ownership and Admin checks
        const isOwner = ticket.userId === user.id;
        const hasInboxAccess = await hasPermission("support.tickets.view") || 
                               await hasRole("admin") || 
                               await hasRole("superadmin") || 
                               await hasRole("Support Agent") || 
                               await hasRole("Support Manager");

        if (!isOwner && !hasInboxAccess) {
            return { success: false, error: "Unauthorized: Insufficient access to view this ticket" };
        }

        return { success: true, data: ticket };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Fetch all tickets submitted by active user.
 */
export async function getUserTicketsAction() {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const data = await SupportTicketService.getUserTickets(user.id);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Fetch all tickets filter queue (Helpdesk).
 */
export async function getHelpdeskTicketsAction(filters?: {
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    category?: string;
    priority?: string;
    assignedToId?: number;
}) {
    try {
        const allowed = await hasPermission("support.tickets.view") || 
                        await hasRole("admin") || 
                        await hasRole("superadmin") || 
                        await hasRole("Support Agent") || 
                        await hasRole("Support Manager");

        if (!allowed) return { success: false, error: "Unauthorized: Helpdesk inbox access denied" };

        const data = await SupportTicketService.getHelpdeskTickets(filters);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Submit message response. Enforces thread access.
 */
export async function addMessageAction(ticketId: number, data: {
    messageText: string;
    attachmentUrl?: string;
}) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        // Fetch ticket ownership
        const ticket = await SupportTicketService.getTicketWithMessages(ticketId);
        if (!ticket) return { success: false, error: "Ticket not found" };

        const isOwner = ticket.userId === user.id;
        const hasInboxAccess = await hasPermission("support.tickets.reply") || 
                               await hasRole("admin") || 
                               await hasRole("superadmin") || 
                               await hasRole("Support Agent") || 
                               await hasRole("Support Manager");

        if (!isOwner && !hasInboxAccess) {
            return { success: false, error: "Unauthorized: Cannot post replies on this ticket" };
        }

        const result = await SupportTicketService.addMessage(ticketId, user.id, data);
        revalidatePath(`/support/tickets`);
        revalidatePath(`/admin/support`);
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Assign ticket to agent.
 */
export async function assignTicketAction(ticketId: number, staffProfileId: number) {
    try {
        const allowed = await hasPermission("support.tickets.assign") || 
                        await hasRole("admin") || 
                        await hasRole("superadmin") || 
                        await hasRole("Support Manager");

        if (!allowed) return { success: false, error: "Unauthorized: Cannot assign tickets" };

        const result = await SupportTicketService.assignTicket(ticketId, staffProfileId);
        revalidatePath(`/admin/support`);
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Update support ticket status.
 */
export async function updateTicketStatusAction(ticketId: number, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
    try {
        const allowed = await hasPermission("support.tickets.manage") || 
                        await hasRole("admin") || 
                        await hasRole("superadmin") || 
                        await hasRole("Support Manager") ||
                        await hasRole("Support Agent"); // Agents can resolve tickets they work on

        if (!allowed) return { success: false, error: "Unauthorized: Cannot update ticket state" };

        const result = await SupportTicketService.updateTicketStatus(ticketId, status);
        revalidatePath(`/support/tickets`);
        revalidatePath(`/admin/support`);
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get potential assignment staff.
 */
export async function getSupportStaffAction() {
    try {
        const allowed = await hasPermission("support.tickets.assign") || 
                        await hasRole("admin") || 
                        await hasRole("superadmin") || 
                        await hasRole("Support Manager");

        if (!allowed) return { success: false, error: "Unauthorized" };

        const data = await SupportTicketService.getSupportStaff();
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Load helpdesk dashboard charts and counters data.
 */
export async function getHelpdeskOverviewMetricsAction() {
    try {
        const allowed = await hasPermission("support.tickets.view") || 
                        await hasRole("admin") || 
                        await hasRole("superadmin") || 
                        await hasRole("Support Agent") || 
                        await hasRole("Support Manager");

        if (!allowed) return { success: false, error: "Unauthorized" };

        const data = await SupportTicketService.getHelpdeskOverviewMetrics();
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
