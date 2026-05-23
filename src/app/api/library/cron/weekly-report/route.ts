import { NextResponse } from "next/server";
import { db } from "@/db";
import { libraryResources, libraryCirculation, libraryFines } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Resend } from "resend";
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // 1. Gather Analytics
        const totalResources = await db.select({ count: sql<number>`count(*)` }).from(libraryResources);
        const activeLoans = await db.select({ count: sql<number>`count(*)` }).from(libraryCirculation).where(eq(libraryCirculation.status, "active"));
        const unpaidFines = await db.select({ total: sql<number>`sum(amount)` }).from(libraryFines).where(eq(libraryFines.status, "unpaid"));
        
        const topBooks = await db.query.libraryResources.findMany({
            orderBy: [desc(libraryResources.totalCopies)],
            limit: 5
        });

        // 2. Generate PDF
        const doc = new jsPDF() as any;
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 44, 52);
        doc.text("University Library Usage Report", 14, 22);
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        
        // Stats Summary
        doc.setFontSize(14);
        doc.text("Executive Summary", 14, 45);
        
        const summaryData = [
            ["Total Resources in Catalog", totalResources[0].count.toString()],
            ["Total Active Loans", activeLoans[0].count.toString()],
            ["Total Outstanding Fines", `N${unpaidFines[0]?.total || 0}`]
        ];

        doc.autoTable({
            startY: 50,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'striped'
        });

        // Top Resources Table
        doc.text("Most Popular Resources", 14, doc.lastAutoTable.finalY + 15);
        
        const bookData = topBooks.map(b => [b.title, b.authors, b.totalCopies?.toString()]);
        
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Title', 'Author', 'Copies']],
            body: bookData
        });

        // 3. Convert to buffer
        const pdfOutput = doc.output('arraybuffer');
        const pdfBase64 = Buffer.from(pdfOutput).toString('base64');

        // 4. Send Email via Resend
        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: 'library-reports@schoolportal.com',
                to: ['director@school.edu.ng'],
                subject: 'Weekly Library Usage Report - ' + new Date().toLocaleDateString(),
                text: 'Please find the attached weekly library usage report.',
                attachments: [
                    {
                        filename: 'LibraryReport.pdf',
                        content: pdfBase64,
                    },
                ],
            });
        }

        console.log("[CRON] Weekly Director's Report Sent.");

        return NextResponse.json({ success: true, message: "Report generated and sent." });

    } catch (error) {
        console.error("Weekly Report Cron Failed:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
