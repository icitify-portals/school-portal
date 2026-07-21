import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { admissionApplicationsV2 } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { storage } from "@/lib/storage";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const applicationId = parseInt(formData.get("applicationId") as string);
        const file = formData.get("file") as File;
        const type = formData.get("type") as string; // 'photo' or 'signature'

        if (!applicationId || !file || !type) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify the application belongs to this user
        const [app] = await db.select({
            id: admissionApplicationsV2.id,
            formNumber: admissionApplicationsV2.formNumber
        }).from(admissionApplicationsV2)
          .where(
              and(
                  eq(admissionApplicationsV2.id, applicationId),
                  eq(admissionApplicationsV2.applicantId, parseInt(session.user.id))
              )
          ).limit(1);

        if (!app) {
            return new NextResponse("Application not found", { status: 404 });
        }

        let formNumber = app.formNumber;

        if (!formNumber) {
            // JIT generation for older applications that were paid before the update
            const { checkAndGenerateFormNumber } = await import("@/lib/form-number");
            const result = await checkAndGenerateFormNumber(applicationId);
            if (result.success && result.formNumber) {
                formNumber = result.formNumber;
            } else {
                return new NextResponse("Form number not yet generated. Please complete fee payments first.", { status: 403 });
            }
        }

        // Generate a unique filename
        let ext = 'png';
        if (file.name) {
             ext = file.name.split('.').pop() || 'png';
        } else if (file.type === 'image/jpeg') {
             ext = 'jpg';
        }
        const uniqueFilename = `${type}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
        
        // Upload to storage using the formNumber as the subdirectory
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const safeFormNumber = String(formNumber);
        const folder = `admission-forms/${safeFormNumber.replace(/\//g, '_')}`;
        
        const uploadResult = await storage.upload(buffer, uniqueFilename, folder, file.type);

        if (!uploadResult.success || !uploadResult.url) {
            return new NextResponse(uploadResult.error || "Failed to upload file", { status: 500 });
        }

        return NextResponse.json({ success: true, url: uploadResult.url });

    } catch (error: any) {
        console.error("Upload asset error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
