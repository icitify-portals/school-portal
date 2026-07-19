import { auth } from "@/auth";
import { db } from "@/db/db";
import { admissionApplicationsV2, admissionFormTemplates } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const applicantId = parseInt(session.user.id);

        // Check for any existing draft
        const existingApp = await db.query.admissionApplicationsV2.findFirst({
            where: and(
                eq(admissionApplicationsV2.applicantId, applicantId),
                eq(admissionApplicationsV2.status, 'draft')
            ),
            orderBy: desc(admissionApplicationsV2.id)
        });
        if (existingApp) {
            return NextResponse.redirect(new URL(`/applicant/application/${existingApp.id}`, req.url), 303);
        }

        let tId: number = 0;
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const body = await req.json();
            tId = body.templateId || 0;
        } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await req.formData();
            const templateId = formData.get("templateId");
            tId = templateId ? parseInt(templateId as string) : 0;
        }

        if (!tId) {
            // No template specified — pick the first active one
            const [firstTemplate] = await db.select({ id: admissionFormTemplates.id })
                .from(admissionFormTemplates)
                .where(eq(admissionFormTemplates.isActive, true))
                .orderBy(desc(admissionFormTemplates.createdAt))
                .limit(1);
            if (!firstTemplate) {
                return new NextResponse("No active admission templates available", { status: 404 });
            }
            tId = firstTemplate.id;
        }

        // Create new application
        const [result] = await db.insert(admissionApplicationsV2).values({
            templateId: tId,
            applicantId: applicantId,
            status: 'draft',
            paymentStatus: 'pending'
        });

        return NextResponse.redirect(new URL(`/applicant/application/${result.insertId}`, req.url), 303);
    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error("Failed to start application:", error);
        return new NextResponse(`Failed to start application: ${error?.message || String(error)}`, { status: 500 });
    }
}
