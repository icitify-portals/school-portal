import { NextResponse } from "next/server";
import { db } from "@/db";
import { libraryCirculation, libraryPatronMetadata, libraryFines } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";

export async function GET(req: Request) {
    // Basic security: check for a cron secret header
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const today = new Date();
        
        // 1. Find all active loans that are past due
        const overdueLoans = await db.query.libraryCirculation.findMany({
            where: and(
                eq(libraryCirculation.status, "active"),
                lt(libraryCirculation.dueDate, today)
            )
        });

        const fineResults = [];

        for (const loan of overdueLoans) {
            // Calculate days overdue
            const diffTime = Math.abs(today.getTime() - loan.dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const finePerDay = 100; // e.g. 100 Naira per day
            const currentFineAmount = diffDays * finePerDay;

            // Update the circulation record with the current fine
            await db.transaction(async (tx) => {
                await tx.update(libraryCirculation)
                    .set({ 
                        status: "overdue",
                        fineAmount: currentFineAmount.toString() 
                    })
                    .where(eq(libraryCirculation.id, loan.id));

                // Add to library_fines table if not exists or update
                // Simplified: we create a new fine entry if it's the first time it's overdue
                // In a real system, you'd check for an existing 'unpaid' fine for this circulationId
                
                await tx.insert(libraryFines).values({
                    patronId: loan.patronId,
                    circulationId: loan.id,
                    amount: currentFineAmount.toString(),
                    reason: `Overdue fine for ${diffDays} days`,
                    status: "unpaid"
                }).onDuplicateKeyUpdate({
                    set: { amount: currentFineAmount.toString() }
                });

                // Update patron metadata total
                await tx.update(libraryPatronMetadata)
                    .set({ 
                        totalFinesOwed: sql`${libraryPatronMetadata.totalFinesOwed} + ${finePerDay}` 
                    })
                    .where(eq(libraryPatronMetadata.userId, loan.patronId));
            });

            // Trigger Webhook to School Portal Finance API (Simulation)
            console.log(`[WEBHOOK] Flagging Student ID ${loan.patronId} for fine: ${currentFineAmount}`);
            // await fetch(`${process.env.PORTAL_API_URL}/webhooks/restrict-patron`, { ... });

            fineResults.push({ loanId: loan.id, patronId: loan.patronId, fine: currentFineAmount });
        }

        return NextResponse.json({ success: true, processed: fineResults.length, details: fineResults });

    } catch (error) {
        console.error("Daily Fines Cron Failed:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
