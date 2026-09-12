import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { storage } from "@/lib/storage";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = (formData.get("type") as string) || "documents";

        if (!file || !file.size) {
            return new NextResponse("Missing file", { status: 400 });
        }
        if (file.size > 10 * 1024 * 1024) {
            return new NextResponse("File exceeds the 10MB limit.", { status: 400 });
        }

        const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
        const uniqueFilename = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
        const folder = `siwes/${type.replace(/[^a-z0-9_-]/gi, '_')}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const uploadResult = await storage.upload(buffer, uniqueFilename, folder, file.type);
        if (!uploadResult.success || !uploadResult.url) {
            return new NextResponse(uploadResult.error || "Failed to upload file", { status: 500 });
        }

        return NextResponse.json({ success: true, url: uploadResult.url });
    } catch (error: any) {
        console.error("SIWES upload error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}