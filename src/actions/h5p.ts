"use server";

import AdmZip from "adm-zip";
import { v4 as uuidv4 } from "uuid";
import { storage } from "@/lib/storage";

export async function uploadH5P(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        const h5pId = uuidv4();
        const subDir = `h5p/${h5pId}`;
        
        let baseUrl = "";

        // Iterate through zip entries and upload each file
        for (const entry of zipEntries) {
            if (entry.isDirectory) continue;
            
            const content = entry.getData();
            const relPath = `${subDir}/${entry.entryName}`;
            
            // Simple mime-type mapping for common H5P files
            let mimeType = "application/octet-stream";
            if (entry.entryName.endsWith(".json")) mimeType = "application/json";
            else if (entry.entryName.endsWith(".js")) mimeType = "application/javascript";
            else if (entry.entryName.endsWith(".css")) mimeType = "text/css";
            else if (entry.entryName.endsWith(".png")) mimeType = "image/png";
            else if (entry.entryName.endsWith(".jpg") || entry.entryName.endsWith(".jpeg")) mimeType = "image/jpeg";
            else if (entry.entryName.endsWith(".svg")) mimeType = "image/svg+xml";

            const res = await storage.uploadFileAt(content, relPath, mimeType);
            
            if (res.success && entry.entryName === "h5p.json") {
                // The URL of h5p.json is used to find the base directory for h5p-standalone
                baseUrl = res.url?.replace("/h5p.json", "") || "";
            }
        }

        if (!baseUrl) {
            return { success: false, error: "Invalid H5P package: h5p.json not found" };
        }

        return { success: true, url: baseUrl, id: h5pId };
    } catch (error) {
        console.error("H5P Upload Error:", error);
        return { success: false, error: "Failed to process H5P package" };
    }
}
