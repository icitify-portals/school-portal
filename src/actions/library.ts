"use server";

import { db } from "@/db";
import { libraryResources, libraryPhysicalCopies, libraryCirculation, libraryPatronMetadata, users, libraryDigitalAssets, libraryFines } from "@/db/schema";
import { eq, and, or, not, like, sql, desc } from "drizzle-orm";
import { auth } from "@/auth";

// --- CATALOGING ACTIONS ---

export async function addLibraryResource(data: any) {
    try {
        const [result] = await db.insert(libraryResources).values({
            ...data,
            aiTags: data.aiTags ? JSON.stringify(data.aiTags) : null,
            curriculumMapping: data.curriculumMapping ? JSON.stringify(data.curriculumMapping) : null,
        });
        return { success: true, id: result.insertId };
    } catch (error) {
        console.error("Failed to add library resource:", error);
        return { success: false, error: "Failed to add resource." };
    }
}

export async function addPhysicalCopy(resourceId: number, barcode: string, shelfLocation?: string) {
    try {
        await db.insert(libraryPhysicalCopies).values({
            resourceId,
            barcode,
            shelfLocation,
            status: "available",
        });
        
        // Update resource count
        await db.update(libraryResources)
            .set({ 
                totalCopies: sql`${libraryResources.totalCopies} + 1`,
                availableCopies: sql`${libraryResources.availableCopies} + 1`
            })
            .where(eq(libraryResources.id, resourceId));

        return { success: true };
    } catch (error) {
        console.error("Failed to add copy:", error);
        return { success: false, error: "Failed to add copy." };
    }
}

// --- CIRCULATION ACTIONS ---

export async function checkoutBook(barcode: string, studentId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // 1. Find the copy
        const [copy] = await db.select().from(libraryPhysicalCopies)
            .where(eq(libraryPhysicalCopies.barcode, barcode))
            .limit(1);

        if (!copy) return { success: false, error: "Book not available" };

        const [resource] = await db.select().from(libraryResources)
            .where(eq(libraryResources.id, copy.resourceId))
            .limit(1);

        const copyWithResource = { ...copy, resource };

        if (!copyWithResource || copyWithResource.status !== "available") return { success: false, error: "Book not available" };

        // 2. Check patron eligibility
        const patron = await db.query.libraryPatronMetadata.findFirst({
            where: eq(libraryPatronMetadata.userId, studentId)
        });

        if (!patron || patron.status !== "active") return { success: false, error: "Patron account restricted" };
        
        // 2b. Check fines (Enterprise Integration)
        const totalFines = parseFloat(patron.totalFinesOwed?.toString() || "0");
        if (totalFines > 0) {
            return { 
                success: false, 
                error: `Blocked: Outstanding fines of ${totalFines}. Please clear at Bursary.` 
            };
        }

        const currentCount = patron.currentBorrowCount ?? 0;
        const maxLimit = patron.maxBorrowLimit ?? 5;
        
        if (currentCount >= maxLimit) return { success: false, error: "Borrow limit reached" };

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // 2-week loan period

        const librarianId = parseInt(session.user.id as string);

        // 3. Perform Checkout (Atomic-like)
        await db.transaction(async (tx) => {
            await tx.insert(libraryCirculation).values({
                copyId: copyWithResource.id,
                patronId: studentId,
                librarianId: librarianId,
                dueDate,
                status: "active"
            });

            await tx.update(libraryPhysicalCopies).set({ status: "borrowed" }).where(eq(libraryPhysicalCopies.id, copyWithResource.id));
            
            await tx.update(libraryPatronMetadata)
                .set({ currentBorrowCount: currentCount + 1 })
                .where(eq(libraryPatronMetadata.id, patron.id));

            await tx.update(libraryResources)
                .set({ availableCopies: sql`${libraryResources.availableCopies} - 1` })
                .where(eq(libraryResources.id, copyWithResource.resourceId));
        });

        return { success: true };
    } catch (error) {
        console.error("Checkout failed:", error);
        return { success: false, error: "Transaction failed" };
    }
}

export async function returnBook(barcode: string) {
    try {
        const [copy] = await db.select().from(libraryPhysicalCopies)
            .where(eq(libraryPhysicalCopies.barcode, barcode))
            .limit(1);

        if (!copy || copy.status !== "borrowed") return { success: false, error: "Active loan not found" };

        const [activeLoan] = await db.select().from(libraryCirculation)
            .where(and(eq(libraryCirculation.copyId, copy.id), eq(libraryCirculation.status, "active")))
            .limit(1);

        if (!activeLoan) return { success: false, error: "Active loan not found" };

        await db.transaction(async (tx) => {
            await tx.update(libraryCirculation).set({ 
                status: "returned", 
                returnDate: new Date() 
            }).where(eq(libraryCirculation.id, activeLoan.id));

            await tx.update(libraryPhysicalCopies).set({ status: "available" }).where(eq(libraryPhysicalCopies.id, copy.id));

            await tx.update(libraryPatronMetadata)
                .set({ currentBorrowCount: sql`${libraryPatronMetadata.currentBorrowCount} - 1` })
                .where(eq(libraryPatronMetadata.userId, activeLoan.patronId));

            await tx.update(libraryResources)
                .set({ availableCopies: sql`${libraryResources.availableCopies} + 1` })
                .where(eq(libraryResources.id, copy.resourceId));
        });

        return { success: true };
    } catch (error) {
        console.error("Return failed:", error);
        return { success: false, error: "Transaction failed" };
    }
}

// --- DISCOVERY ACTIONS ---

export async function searchLibrary(query: string) {
    try {
        return await db.query.libraryResources.findMany({
            where: or(
                like(libraryResources.title, `%${query}%`),
                like(libraryResources.authors, `%${query}%`),
                like(libraryResources.isbn, `%${query}%`),
                like(libraryResources.aiTags, `%${query}%`)
            ),
            limit: 20
        });
    } catch (error) {
        console.error("Search failed:", error);
        return [];
    }
}

// --- BENTO BOX MULTI-INDEX SEARCH ---

export async function searchLibraryBento(query: string, filters?: { category?: string, author?: string, format?: string }) {
    try {
        const q = `%${query}%`;
        
        let conditions = sql`1=1`;
        if (query) {
            conditions = and(
                conditions,
                or(
                    // MySQL Full-Text Match fallback structure
                    like(libraryResources.title, q),
                    like(libraryResources.authors, q),
                    like(libraryResources.isbn, q),
                    sql`MATCH(${libraryResources.title}, ${libraryResources.abstract}) AGAINST (${query} IN BOOLEAN MODE)`
                )
            )!;
        }

        if (filters?.category) {
            conditions = and(conditions, eq(libraryResources.category, filters.category))!;
        }

        // Concurrent dual-querying
        const [physicalHits, digitalHits] = await Promise.all([
            // 1. Physical hits + Real-time Availability
            db.select({
                resource: libraryResources,
                copiesAvailable: sql<number>`SUM(CASE WHEN ${libraryPhysicalCopies.status} = 'available' THEN 1 ELSE 0 END)`
            })
            .from(libraryResources)
            .leftJoin(libraryPhysicalCopies, eq(libraryResources.id, libraryPhysicalCopies.resourceId))
            .where(conditions)
            .groupBy(libraryResources.id)
            .having(sql`COUNT(${libraryPhysicalCopies.id}) > 0`)
            .limit(20),

            // 2. Digital hits + Format Icons
            db.select({
                resource: libraryResources,
                asset: libraryDigitalAssets
            })
            .from(libraryResources)
            .innerJoin(libraryDigitalAssets, eq(libraryResources.id, libraryDigitalAssets.resourceId))
            .where(conditions)
            .limit(20)
        ]);

        return { physicalHits, digitalHits };
    } catch (error) {
        console.error("Bento Search failed:", error);
        return { physicalHits: [], digitalHits: [] };
    }
}

export async function getLibraryRecommendations(resourceId: number) {
    try {
        const resource = await db.query.libraryResources.findFirst({
            where: eq(libraryResources.id, resourceId)
        });
        if (!resource) return [];

        const tags = resource.aiTags ? JSON.parse(resource.aiTags) : [];
        
        const category = resource.category;
        
        // Find books in same category OR with matching tags
        return await db.query.libraryResources.findMany({
            where: and(
                not(eq(libraryResources.id, resourceId)),
                or(
                    category ? eq(libraryResources.category, category) : sql`FALSE`,
                    // MySQL specific JSON check (simplified for now to just category or title overlap)
                    category ? like(libraryResources.aiTags, `%${category}%`) : sql`FALSE`
                )
            ),
            limit: 5
        });
    } catch (error) {
        console.error("Recommendations failed:", error);
        return [];
    }
}

export async function getCurriculumResources(examType: 'WAEC' | 'JAMB' | 'NECO', subject: string) {
    try {
        return await db.query.libraryResources.findMany({
            where: like(libraryResources.curriculumMapping, `%${examType}%${subject}%`),
            limit: 10
        });
    } catch (error) {
        console.error("Curriculum fetch failed:", error);
        return [];
    }
}

export async function sendLibraryNotification(userId: number, message: string, type: 'sms' | 'push' | 'email' = 'push') {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });
        if (!user) return { success: false, error: "User not found" };

        // For this demo, we simulate notification sending
        console.log(`[LIBRARY NOTIFICATION - ${type.toUpperCase()}] to ${user.name}: ${message}`);
        
        return { success: true };
    } catch (error) {
        console.error("Notification failed:", error);
        return { success: false, error: "Notification failed" };
    }
}

export async function getLibraryAnalytics() {
    try {
        const totalResources = await db.select({ count: sql<number>`count(*)` }).from(libraryResources);
        const totalCirculation = await db.select({ count: sql<number>`count(*)` }).from(libraryCirculation);
        const activeLoans = await db.select({ count: sql<number>`count(*)` }).from(libraryCirculation).where(eq(libraryCirculation.status, "active"));
        
        const topBooks = await db.query.libraryResources.findMany({
            orderBy: [desc(libraryResources.totalCopies)], // Placeholder for actual borrow count join
            limit: 5
        });

        return {
            stats: {
                totalResources: totalResources[0].count,
                totalLoans: totalCirculation[0].count,
                activeLoans: activeLoans[0].count,
            },
            topBooks
        };
    } catch (error) {
        console.error("Analytics fetch failed:", error);
        return null;
    }
}

/**
 * CRON-ready function to scan for overdue books and apply fines
 * e.g., 50 Naira per day
 */
export async function calculateAndApplyFines() {
    try {
        const now = new Date();
        const dailyRate = 50.00;

        // 1. Find all active loans that are overdue
        const overdueLoans = await db.select()
            .from(libraryCirculation)
            .where(and(
                eq(libraryCirculation.status, 'active'),
                sql`${libraryCirculation.dueDate} < ${now}`
            ));

        if (overdueLoans.length === 0) return { success: true, processed: 0, totalAmount: 0 };

        let totalAmount = 0;
        let processedCount = 0;

        await db.transaction(async (tx) => {
            for (const loan of overdueLoans) {
                const daysOverdue = Math.floor((now.getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                if (daysOverdue <= 0) continue;

                const newFine = daysOverdue * dailyRate;
                const incrementalFine = newFine - parseFloat(loan.fineAmount?.toString() || "0");

                if (incrementalFine > 0) {
                    // Update loan record
                    await tx.update(libraryCirculation)
                        .set({ fineAmount: newFine.toString(), status: 'overdue' })
                        .where(eq(libraryCirculation.id, loan.id));

                    // Update patron metadata (aggregate fine)
                    await tx.update(libraryPatronMetadata)
                        .set({ totalFinesOwed: sql`${libraryPatronMetadata.totalFinesOwed} + ${incrementalFine}` })
                        .where(eq(libraryPatronMetadata.userId, loan.patronId));

                    // Log in libraryFines table
                    await tx.insert(libraryFines).values({
                        patronId: loan.patronId,
                        circulationId: loan.id,
                        amount: incrementalFine.toString(),
                        reason: `Daily overdue fine: ${daysOverdue} days`,
                        status: 'unpaid'
                    });

                    totalAmount += incrementalFine;
                    processedCount++;
                }
            }
        });

        return { success: true, processed: processedCount, totalAmount };
    } catch (error) {
        console.error("Fine calculation failed:", error);
        return { success: false, error: "Failed to process fines" };
    }
}

