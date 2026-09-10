import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import crypto from "crypto";

// Allowed file extensions and MIME types for document uploads
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];
const ALLOWED_MIMES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/octet-stream", // Some mobile browsers send this for any file type
];

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        // Determine extension from filename
        const rawExt = (file.name?.split(".").pop() || "").toLowerCase().trim();
        const ext = rawExt || "pdf";

        // Validate extension
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json(
                { success: false, error: `File type ".${ext}" is not allowed. Please upload a PDF, JPG, or PNG file.` },
                { status: 400 }
            );
        }

        // Validate MIME type (permissive for octet-stream since mobile browsers use this)
        if (!ALLOWED_MIMES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: `Invalid file format (${file.type}). Please upload a PDF or image file.` },
                { status: 400 }
            );
        }

        // Resolve correct MIME when browser sends octet-stream
        let resolvedMime = file.type;
        if (file.type === "application/octet-stream") {
            if (ext === "pdf") resolvedMime = "application/pdf";
            else if (ext === "jpg" || ext === "jpeg") resolvedMime = "image/jpeg";
            else if (ext === "png") resolvedMime = "image/png";
        }

        const uniqueFilename = `doc_${crypto.randomBytes(6).toString("hex")}.${ext}`;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await storage.upload(buffer, uniqueFilename, "admission-documents", resolvedMime);

        if (!uploadResult.success || !uploadResult.url) {
            return NextResponse.json({ success: false, error: uploadResult.error || "Failed to upload file" }, { status: 500 });
        }

        return NextResponse.json({ success: true, url: uploadResult.url });
    } catch (error: any) {
        console.error("Generic upload API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
