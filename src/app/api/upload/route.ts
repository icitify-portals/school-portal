import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        // Generate a unique filename
        let ext = "pdf";
        if (file.name) {
            ext = file.name.split(".").pop() || "pdf";
        } else if (file.type === "image/jpeg") {
            ext = "jpg";
        } else if (file.type === "image/png") {
            ext = "png";
        }

        const uniqueFilename = `doc_${crypto.randomBytes(6).toString("hex")}.${ext}`;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const uploadResult = await storage.upload(buffer, uniqueFilename, "admission-documents", file.type);

        if (!uploadResult.success || !uploadResult.url) {
            return NextResponse.json({ success: false, error: uploadResult.error || "Failed to upload file" }, { status: 500 });
        }

        return NextResponse.json({ success: true, url: uploadResult.url });
    } catch (error: any) {
        console.error("Generic upload API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
