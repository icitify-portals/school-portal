import { db } from "@/db/db";
import { 
    users, 
    maintenanceStaffProfiles, 
    generalMaintenanceRequests,
    maintenanceRepairQuotes,
    expenditureRequests
} from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export class WorksMaintenanceService {

    /**
     * Get all technicians, joining user details and specialty profiles.
     */
    static async getTechnicians() {
        try {
            // Fetch users categorized under 'maintenance'
            const maintenanceUsers = await db.select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                status: users.status
            })
            .from(users)
            .where(eq(users.officeDescription, "Maintenance Staff")); // or fallback to staffCategory if supported

            // Fetch specialties
            const profiles = await db.select().from(maintenanceStaffProfiles);
            const profileMap = new Map(profiles.map(p => [p.userId, p]));

            // Combine them
            return maintenanceUsers.map(u => {
                const profile = profileMap.get(u.id);
                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    status: u.status,
                    specialty: profile?.specialty || "general",
                    profileStatus: profile?.status || "active",
                    profileId: profile?.id || null
                };
            });
        } catch (error) {
            console.error("Failed to get technicians:", error);
            throw new Error("Could not retrieve technicians");
        }
    }

    /**
     * Create or update a technician's specialty profile.
     */
    static async updateTechnicianProfile(userId: number, specialty: string, status: string) {
        try {
            const [existing] = await db.select()
                .from(maintenanceStaffProfiles)
                .where(eq(maintenanceStaffProfiles.userId, userId))
                .limit(1);

            if (existing) {
                await db.update(maintenanceStaffProfiles)
                    .set({ specialty: specialty as any, status: status as any, updatedAt: new Date() })
                    .where(eq(maintenanceStaffProfiles.userId, userId));
            } else {
                await db.insert(maintenanceStaffProfiles)
                    .values({
                        userId,
                        specialty: specialty as any,
                        status: status as any
                    });
            }
            return { success: true };
        } catch (error) {
            console.error("Failed to update technician profile:", error);
            throw new Error("Could not update technician specialty profile");
        }
    }

    /**
     * Create a general maintenance request.
     */
    static async createGeneralRequest(reporterUserId: number, data: {
        locationType: string;
        buildingName: string;
        roomOrAreaDescription: string;
        title: string;
        description: string;
        category: string;
        priority?: string;
    }) {
        try {
            const [result] = await db.insert(generalMaintenanceRequests)
                .values({
                    reporterUserId,
                    locationType: data.locationType as any,
                    buildingName: data.buildingName,
                    roomOrAreaDescription: data.roomOrAreaDescription,
                    title: data.title,
                    description: data.description,
                    category: data.category as any,
                    priority: (data.priority || 'medium') as any,
                    status: 'pending'
                });
            return { success: true, requestId: result.insertId };
        } catch (error) {
            console.error("Failed to create general maintenance request:", error);
            throw new Error("Could not submit maintenance request");
        }
    }

    /**
     * Get all general maintenance requests, joining reporter and assigned staff.
     */
    static async getAllGeneralRequests() {
        try {
            const requests = await db.select({
                id: generalMaintenanceRequests.id,
                title: generalMaintenanceRequests.title,
                description: generalMaintenanceRequests.description,
                locationType: generalMaintenanceRequests.locationType,
                buildingName: generalMaintenanceRequests.buildingName,
                roomOrAreaDescription: generalMaintenanceRequests.roomOrAreaDescription,
                category: generalMaintenanceRequests.category,
                priority: generalMaintenanceRequests.priority,
                status: generalMaintenanceRequests.status,
                createdAt: generalMaintenanceRequests.createdAt,
                resolvedAt: generalMaintenanceRequests.resolvedAt,
                resolutionNotes: generalMaintenanceRequests.resolutionNotes,
                reporterUserId: generalMaintenanceRequests.reporterUserId,
                assignedStaffId: generalMaintenanceRequests.assignedStaffId
            })
            .from(generalMaintenanceRequests)
            .orderBy(desc(generalMaintenanceRequests.createdAt));

            // Fetch reporter and technician user details
            const userIds = Array.from(new Set(
                requests.flatMap(r => [r.reporterUserId, r.assignedStaffId].filter(id => id !== null) as number[])
            ));

            let userMap = new Map<number, { name: string; email: string; phone: string | null }>();
            if (userIds.length > 0) {
                const fetchedUsers = await db.select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    phone: users.phone
                })
                .from(users)
                .where(inArray(users.id, userIds));

                fetchedUsers.forEach(u => userMap.set(u.id, u));
            }

            return requests.map(r => ({
                ...r,
                reporter: userMap.get(r.reporterUserId) || { name: "Unknown", email: "", phone: null },
                assignedStaff: r.assignedStaffId ? userMap.get(r.assignedStaffId) || null : null
            }));
        } catch (error) {
            console.error("Failed to get all general requests:", error);
            throw new Error("Could not retrieve all maintenance requests");
        }
    }

    /**
     * Get general requests reported by a specific user.
     */
    static async getRequestsByReporter(reporterUserId: number) {
        try {
            return await db.select()
                .from(generalMaintenanceRequests)
                .where(eq(generalMaintenanceRequests.reporterUserId, reporterUserId))
                .orderBy(desc(generalMaintenanceRequests.createdAt));
        } catch (error) {
            console.error("Failed to get reporter requests:", error);
            throw new Error("Could not retrieve your maintenance requests");
        }
    }

    /**
     * Get general requests assigned to a specific technician.
     */
    static async getRequestsByTechnician(assignedStaffId: number) {
        try {
            return await db.select()
                .from(generalMaintenanceRequests)
                .where(eq(generalMaintenanceRequests.assignedStaffId, assignedStaffId))
                .orderBy(desc(generalMaintenanceRequests.createdAt));
        } catch (error) {
            console.error("Failed to get technician requests:", error);
            throw new Error("Could not retrieve assigned maintenance tasks");
        }
    }

    /**
     * Assign a request to a technician.
     */
    static async assignRequest(requestId: number, assignedStaffId: number) {
        try {
            await db.update(generalMaintenanceRequests)
                .set({
                    assignedStaffId,
                    status: 'in-progress',
                    updatedAt: new Date()
                })
                .where(eq(generalMaintenanceRequests.id, requestId));
            return { success: true };
        } catch (error) {
            console.error("Failed to assign request:", error);
            throw new Error("Could not assign maintenance request");
        }
    }

    /**
     * Resolve/Close a request.
     */
    static async resolveRequest(requestId: number, resolutionNotes: string) {
        try {
            await db.update(generalMaintenanceRequests)
                .set({
                    status: 'resolved',
                    resolutionNotes,
                    resolvedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(generalMaintenanceRequests.id, requestId));
            return { success: true };
        } catch (error) {
            console.error("Failed to resolve request:", error);
            throw new Error("Could not resolve maintenance request");
        }
    }

    /**
     * Submit a repair quote for a maintenance request.
     */
    static async submitRepairQuote(technicianId: number, data: {
        requestId: number;
        itemDescription: string;
        estimatedCost: number;
        quoteNotes?: string;
    }) {
        try {
            const [result] = await db.insert(maintenanceRepairQuotes)
                .values({
                    requestId: data.requestId,
                    technicianId,
                    itemDescription: data.itemDescription,
                    estimatedCost: data.estimatedCost.toString(),
                    quoteNotes: data.quoteNotes,
                    status: 'pending'
                });
            return { success: true, quoteId: result.insertId };
        } catch (error) {
            console.error("Failed to submit repair quote:", error);
            throw new Error("Could not submit repair quote");
        }
    }

    /**
     * Get all pending repair quotes, joining technician and request details.
     */
    static async getPendingQuotes() {
        try {
            const quotes = await db.select({
                id: maintenanceRepairQuotes.id,
                requestId: maintenanceRepairQuotes.requestId,
                technicianId: maintenanceRepairQuotes.technicianId,
                itemDescription: maintenanceRepairQuotes.itemDescription,
                estimatedCost: maintenanceRepairQuotes.estimatedCost,
                quoteNotes: maintenanceRepairQuotes.quoteNotes,
                status: maintenanceRepairQuotes.status,
                createdAt: maintenanceRepairQuotes.createdAt,
                requestTitle: generalMaintenanceRequests.title,
                requestDescription: generalMaintenanceRequests.description,
                buildingName: generalMaintenanceRequests.buildingName,
                roomOrAreaDescription: generalMaintenanceRequests.roomOrAreaDescription,
                technicianName: users.name
            })
            .from(maintenanceRepairQuotes)
            .innerJoin(generalMaintenanceRequests, eq(maintenanceRepairQuotes.requestId, generalMaintenanceRequests.id))
            .innerJoin(users, eq(maintenanceRepairQuotes.technicianId, users.id))
            .where(eq(maintenanceRepairQuotes.status, 'pending'))
            .orderBy(desc(maintenanceRepairQuotes.createdAt));

            return quotes;
        } catch (error) {
            console.error("Failed to get pending quotes:", error);
            throw new Error("Could not retrieve pending quotes");
        }
    }

    /**
     * Get all quotes submitted for a specific request.
     */
    static async getQuotesByRequest(requestId: number) {
        try {
            return await db.select()
                .from(maintenanceRepairQuotes)
                .where(eq(maintenanceRepairQuotes.requestId, requestId))
                .orderBy(desc(maintenanceRepairQuotes.createdAt));
        } catch (error) {
            console.error("Failed to get quotes for request:", error);
            throw new Error("Could not retrieve quotes for this request");
        }
    }

    /**
     * Review (approve or reject) a repair quote.
     */
    static async reviewRepairQuote(quoteId: number, reviewerUserId: number, approve: boolean, rejectionNotes?: string) {
        return await db.transaction(async (tx) => {
            // 1. Fetch quote
            const [quote] = await tx.select()
                .from(maintenanceRepairQuotes)
                .where(eq(maintenanceRepairQuotes.id, quoteId))
                .limit(1);
            if (!quote) throw new Error("Repair quote not found");
            if (quote.status !== 'pending') throw new Error("Quote has already been reviewed");

            // 2. Fetch associated request details for the purpose/title
            const [request] = await tx.select()
                .from(generalMaintenanceRequests)
                .where(eq(generalMaintenanceRequests.id, quote.requestId))
                .limit(1);
            const requestTitle = request?.title || `Request #${quote.requestId}`;

            if (approve) {
                // 3a. Create corresponding expenditure request
                const [expResult] = await tx.insert(expenditureRequests)
                    .values({
                        requestedBy: reviewerUserId,
                        title: `[Maintenance Quote Approval] - Req #${quote.requestId}`,
                        purpose: `Fault: ${requestTitle}. Required: ${quote.itemDescription}. Notes: ${quote.quoteNotes || 'None'}`,
                        amount: quote.estimatedCost,
                        status: 'pending'
                    });

                const expenditureRequestId = expResult.insertId;

                // 3b. Update quote status to approved
                await tx.update(maintenanceRepairQuotes)
                    .set({
                        status: 'approved',
                        reviewedBy: reviewerUserId,
                        reviewedAt: new Date(),
                        expenditureRequestId
                    })
                    .where(eq(maintenanceRepairQuotes.id, quoteId));
            } else {
                // 4. Update quote status to rejected
                await tx.update(maintenanceRepairQuotes)
                    .set({
                        status: 'rejected',
                        reviewedBy: reviewerUserId,
                        reviewedAt: new Date(),
                        rejectionNotes: rejectionNotes || 'No reason specified'
                    })
                    .where(eq(maintenanceRepairQuotes.id, quoteId));
            }

            return { success: true };
        });
    }
}
