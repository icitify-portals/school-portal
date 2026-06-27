"use server";

import { auth } from "@/auth";
import { WorksMaintenanceService } from "@/services/WorksMaintenanceService";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const GeneralRequestSchema = z.object({
    locationType: z.enum(['classroom', 'lab', 'office', 'hostel_common', 'sports', 'other']),
    buildingName: z.string().min(1, "Building name is required"),
    roomOrAreaDescription: z.string().min(1, "Location description is required"),
    title: z.string().min(1, "Summary of fault is required"),
    description: z.string().min(1, "Detailed description is required"),
    category: z.enum(['electrical', 'plumbing', 'hvac', 'carpentry', 'masonry', 'other']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
});

/**
 * File a general campus request. Available to all authenticated users.
 */
export async function createGeneralRequestAction(data: z.infer<typeof GeneralRequestSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = GeneralRequestSchema.parse(data);
        const reporterUserId = parseInt(session.user.id);

        const result = await WorksMaintenanceService.createGeneralRequest(reporterUserId, validated);
        
        revalidatePath("/admin/works-maintenance");
        revalidatePath("/maintenance-request/history");
        
        return { 
            success: true, 
            message: "Maintenance request submitted successfully", 
            requestId: result.requestId 
        };
    } catch (error: any) {
        console.error("Create request action error:", error);
        return { success: false, error: error.message || "Failed to submit request" };
    }
}

/**
 * Get all technicians. Restricted to Works Director or Admin.
 */
export async function getTechniciansAction() {
    try {
        const isAuth = await hasPermission("maintenance.staff.manage");
        if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

        const technicians = await WorksMaintenanceService.getTechnicians();
        return { success: true, technicians };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to load technicians" };
    }
}

/**
 * Update a technician's specialty profile.
 */
export async function updateTechnicianProfileAction(userId: number, specialty: string, status: string) {
    try {
        const isAuth = await hasPermission("maintenance.staff.manage");
        if (!isAuth) return { success: false, error: "Unauthorized" };

        await WorksMaintenanceService.updateTechnicianProfile(userId, specialty, status);
        revalidatePath("/admin/works-maintenance");
        return { success: true, message: "Technician profile updated successfully" };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update profile" };
    }
}

/**
 * Get all maintenance requests. Restricted to Works Director or Admin.
 */
export async function getAllGeneralRequestsAction() {
    try {
        const isAuth = await hasPermission("maintenance.request.view");
        if (!isAuth) return { success: false, error: "Unauthorized" };

        const requests = await WorksMaintenanceService.getAllGeneralRequests();
        return { success: true, requests };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to load requests" };
    }
}

/**
 * Assign a request to a technician.
 */
export async function assignRequestAction(requestId: number, assignedStaffId: number) {
    try {
        const isAuth = await hasPermission("maintenance.request.assign");
        if (!isAuth) return { success: false, error: "Unauthorized" };

        await WorksMaintenanceService.assignRequest(requestId, assignedStaffId);
        
        revalidatePath("/admin/works-maintenance");
        revalidatePath("/staff/maintenance-tasks");
        
        return { success: true, message: "Task assigned successfully" };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to assign task" };
    }
}

/**
 * Resolve/Close a request. Available to assigned technicians or Director.
 */
export async function resolveRequestAction(requestId: number, resolutionNotes: string) {
    try {
        const isDirector = await hasPermission("maintenance.request.resolve");
        const isTech = await hasPermission("maintenance.technician.update");
        
        if (!isDirector && !isTech) {
            return { success: false, error: "Unauthorized" };
        }

        if (!resolutionNotes.trim()) {
            return { success: false, error: "Resolution notes are required" };
        }

        await WorksMaintenanceService.resolveRequest(requestId, resolutionNotes);
        
        revalidatePath("/admin/works-maintenance");
        revalidatePath("/staff/maintenance-tasks");
        
        return { success: true, message: "Work order resolved and closed" };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to resolve request" };
    }
}

/**
 * Get requests filed by the logged-in user.
 */
export async function getMyRequestsAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const myRequests = await WorksMaintenanceService.getRequestsByReporter(parseInt(session.user.id));
        return { success: true, requests: myRequests };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to load your requests" };
    }
}

/**
 * Get tasks assigned to the logged-in technician.
 */
export async function getMyTasksAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const isAuth = await hasPermission("maintenance.technician.view");
        if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

        const tasks = await WorksMaintenanceService.getRequestsByTechnician(parseInt(session.user.id));
        return { success: true, tasks };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to load assigned tasks" };
    }
}

const QuoteSubmissionSchema = z.object({
    requestId: z.number().min(1, "Request ID is required"),
    itemDescription: z.string().min(1, "Item description is required"),
    estimatedCost: z.number().min(1, "Estimated cost must be at least 1"),
    quoteNotes: z.string().optional()
});

/**
 * Submit a repair quote. Restricted to Maintenance Technicians.
 */
export async function submitRepairQuoteAction(data: z.infer<typeof QuoteSubmissionSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const isAuth = await hasPermission("maintenance.quote.submit");
        if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

        const validated = QuoteSubmissionSchema.parse(data);
        const technicianId = parseInt(session.user.id);

        await WorksMaintenanceService.submitRepairQuote(technicianId, validated);
        
        revalidatePath("/staff/maintenance-tasks");
        revalidatePath("/admin/maintenance-head");
        
        return { success: true, message: "Repair quote submitted successfully" };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to submit repair quote" };
    }
}

/**
 * Get all pending repair quotes. Restricted to Head of Maintenance.
 */
export async function getPendingQuotesAction() {
    try {
        const isAuth = await hasPermission("maintenance.quote.review");
        if (!isAuth) return { success: false, error: "Unauthorized" };

        const quotes = await WorksMaintenanceService.getPendingQuotes();
        return { success: true, quotes };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to load pending quotes" };
    }
}

/**
 * Approve or reject a repair quote. Restricted to Head of Maintenance.
 */
export async function reviewRepairQuoteAction(quoteId: number, approve: boolean, rejectionNotes?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const isAuth = await hasPermission("maintenance.quote.review");
        if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

        const reviewerUserId = parseInt(session.user.id);

        await WorksMaintenanceService.reviewRepairQuote(quoteId, reviewerUserId, approve, rejectionNotes);
        
        revalidatePath("/admin/maintenance-head");
        revalidatePath("/staff/maintenance-tasks");
        
        return { 
            success: true, 
            message: approve 
                ? "Repair quote approved. Expenditure request generated." 
                : "Repair quote rejected." 
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to review repair quote" };
    }
}

