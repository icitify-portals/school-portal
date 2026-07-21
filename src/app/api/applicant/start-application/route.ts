import { auth } from "@/auth";
import { db } from "@/db/db";
import { admissionApplicationsV2, admissionFormTemplates } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { generateFormNumber } from "@/lib/form-number";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const applicantId = parseInt(session.user.id);

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

        // Check for any existing application for THIS specific template
        const existingApp = await db.query.admissionApplicationsV2.findFirst({
            where: and(
                eq(admissionApplicationsV2.applicantId, applicantId),
                eq(admissionApplicationsV2.templateId, tId)
            ),
            orderBy: desc(admissionApplicationsV2.id)
        });
        if (existingApp) {
            return NextResponse.json({ redirectUrl: `/applicant/application/${existingApp.id}` });
        }

        // Look up template to get level for form number generation
        const [template] = await db.select({ level: admissionFormTemplates.level })
            .from(admissionFormTemplates)
            .where(eq(admissionFormTemplates.id, tId))
            .limit(1);

        // Generate form number at creation time
        const formNumber = await generateFormNumber(template?.level || 'tertiary');

        // Create new application with form number
        const [result] = await db.insert(admissionApplicationsV2).values({
            templateId: tId,
            applicantId: applicantId,
            status: 'draft',
            paymentStatus: 'pending',
            formNumber: formNumber
        });

        return NextResponse.json({ redirectUrl: `/applicant/application/${result.insertId}` });
    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error("Failed to start application:", error);
        return new NextResponse(`Failed to start application: ${error?.message || String(error)}`, { status: 500 });
    }
}
