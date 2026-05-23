"use server";

import { v4 as uuidv4 } from "uuid";
import { storage } from "@/lib/storage";

export async function uploadFile(formData: FormData, subDir: string = "lms") {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name.replace(/\s+/g, "-").toLowerCase();
        const uniqueFilename = `${uuidv4()}-${filename}`;

        // Use abstraction instead of direct fs
        const result = await storage.upload(buffer, uniqueFilename, subDir);

        return result;
    } catch (error) {
        console.error("Upload failed:", error);
        return { success: false, error: "Failed to upload file" };
    }
}
