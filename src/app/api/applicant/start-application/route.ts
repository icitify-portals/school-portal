import { auth } from "@/auth";
import { db } from "@/db/db";
import { admissionApplicationsV2 } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const templateId = formData.get("templateId");

        if (!templateId) {
            return new NextResponse("Template ID is required", { status: 400 });
        }

        const applicantId = parseInt(session.user.id);
        const tId = parseInt(templateId as string);

        // Check if the user already has a pending application for this template
        const existingApp = await db.query.admissionApplicationsV2.findFirst({
            where: and(
                eq(admissionApplicationsV2.applicantId, applicantId),
                eq(admissionApplicationsV2.templateId, tId)
            )
        });

        if (existingApp) {
            return redirect(`/applicant/application/${existingApp.id}`);
        }

        // Create new application
        const [result] = await db.insert(admissionApplicationsV2).values({
            templateId: tId,
            applicantId: applicantId,
            status: 'draft',
            paymentStatus: 'pending'
        });

        return redirect(`/applicant/application/${result.insertId}`);
    } catch (error) {
        console.error("Failed to start application:", error);
        return redirect("/applicant/new-application?error=failed_to_start");
    }
}
