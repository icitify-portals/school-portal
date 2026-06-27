"use server";

import { AuditService, AuditDecision } from "@/services/AuditService";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";
import { db } from "@/db/db";
import { activityLogs, users } from "@/db/schema";
import { headers } from "next/headers";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";

async function ensureAuditorAccess() {
    const isAuditor = await hasPermission("audit.logs.view") || await hasPermission("audit.financials.verify") || await hasRole("auditor") || await hasRole("admin") || await hasRole("superadmin");
    if (!isAuditor) throw new Error("Unauthorized access: Internal Audit only");
}

export async function getAuditQueue() {
    try {
        await ensureAuditorAccess();
        const result = await AuditService.getAuditQueue();
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function verifyFinancialEntity(options: {
    entityType: 'voucher' | 'retirement' | 'payroll' | 'inventory',
    entityId: number,
    auditorId: number,
    decision: AuditDecision,
    findings?: string,
    recommendation?: string
}) {
    try {
        await ensureAuditorAccess();
        const result = await AuditService.verifyEntity(options);
        revalidatePath("/admin/audit/queue");
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getAuditTrail() {
    try {
        await ensureAuditorAccess();
        const result = await AuditService.getAuditTrail();
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Logs a user activity or system action to the audit trail.
 */
export async function logActivity(
    action: string, 
    resource?: string, 
    resourceId?: number, 
    details?: any
) {
    try {
        let ipAddress = null;
        let userAgent = null;

        try {
            const reqHeaders = await headers();
            ipAddress = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || null;
            userAgent = reqHeaders.get("user-agent") || null;
        } catch (e) {
            // Outside of request context
        }

        await db.insert(activityLogs).values({
            action,
            resource,
            resourceId,
            details: details ? JSON.stringify(details) : null,
            ipAddress,
            userAgent
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

async function ensureAuditOrAdminAccess() {
    const isAuthorized = await hasRole("auditor") || await hasRole("admin") || await hasRole("superadmin");
    if (!isAuthorized) throw new Error("Unauthorized: Internal Audit / Admin access required");
}

export async function getActivityLogs(options: {
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}) {
    try {
        await ensureAuditOrAdminAccess();
        
        const page = options.page || 1;
        const pageSize = options.pageSize || 50;
        const offset = (page - 1) * pageSize;
        
        const conditions = [];
        if (options.action) {
            conditions.push(eq(activityLogs.action, options.action));
        }
        if (options.startDate) {
            conditions.push(gte(activityLogs.createdAt, new Date(options.startDate)));
        }
        if (options.endDate) {
            const end = new Date(options.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(activityLogs.createdAt, end));
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        const logsList = await db.select({
            id: activityLogs.id,
            action: activityLogs.action,
            resource: activityLogs.resource,
            resourceId: activityLogs.resourceId,
            details: activityLogs.details,
            ipAddress: activityLogs.ipAddress,
            userAgent: activityLogs.userAgent,
            createdAt: activityLogs.createdAt,
            userName: users.name,
            userEmail: users.email,
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.userId, users.id))
        .where(whereClause)
        .orderBy(desc(activityLogs.createdAt))
        .limit(pageSize)
        .offset(offset);
        
        const [totalCountResult] = await db.select({ count: sql<number>`count(*)` })
            .from(activityLogs)
            .where(whereClause);
            
        const total = totalCountResult?.count || 0;
        
        const allActionTypes = await db.select({ action: activityLogs.action })
            .from(activityLogs)
            .groupBy(activityLogs.action);
            
        const actionTypes = allActionTypes.map(a => a.action);
        
        return {
            success: true,
            logs: logsList,
            total,
            actionTypes
        };
    } catch (error) {
        console.error("getActivityLogs action failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function exportActivityLogs(options: {
    action?: string;
    startDate?: string;
    endDate?: string;
}) {
    try {
        await ensureAuditOrAdminAccess();
        
        const conditions = [];
        if (options.action) {
            conditions.push(eq(activityLogs.action, options.action));
        }
        if (options.startDate) {
            conditions.push(gte(activityLogs.createdAt, new Date(options.startDate)));
        }
        if (options.endDate) {
            const end = new Date(options.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(activityLogs.createdAt, end));
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        const logsList = await db.select({
            id: activityLogs.id,
            action: activityLogs.action,
            resource: activityLogs.resource,
            resourceId: activityLogs.resourceId,
            details: activityLogs.details,
            ipAddress: activityLogs.ipAddress,
            userAgent: activityLogs.userAgent,
            createdAt: activityLogs.createdAt,
            userName: users.name,
            userEmail: users.email,
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.userId, users.id))
        .where(whereClause)
        .orderBy(desc(activityLogs.createdAt));
        
        const headersLine = ["ID", "Time", "User Name", "User Email", "Action", "Resource", "Resource ID", "IP Address", "Details"].join(",");
        const rows = logsList.map(log => {
            const id = log.id;
            const time = log.createdAt ? new Date(log.createdAt).toISOString() : "";
            const userName = `"${(log.userName || "System").replace(/"/g, '""')}"`;
            const userEmail = `"${(log.userEmail || "").replace(/"/g, '""')}"`;
            const action = `"${log.action.replace(/"/g, '""')}"`;
            const resource = `"${(log.resource || "").replace(/"/g, '""')}"`;
            const resourceId = log.resourceId || "";
            const ipAddress = `"${(log.ipAddress || "").replace(/"/g, '""')}"`;
            const details = `"${(log.details || "").replace(/"/g, '""')}"`;
            
            return [id, time, userName, userEmail, action, resource, resourceId, ipAddress, details].join(",");
        });
        
        const csv = [headersLine, ...rows].join("\n");
        
        return { success: true, csv };
    } catch (error) {
        console.error("exportActivityLogs action failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

