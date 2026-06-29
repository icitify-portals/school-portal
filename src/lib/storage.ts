import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { config } from "./config";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Storage Interface to decouple file operations from the filesystem.
 */
export interface StorageProvider {
    upload(file: Buffer, filename: string, subDir?: string, mimeType?: string): Promise<{ success: boolean; url?: string; error?: string }>;
    uploadFileAt(file: Buffer, path: string, mimeType?: string): Promise<{ success: boolean; url?: string; error?: string }>;
    delete(url: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Validates the file buffer against allowed magic bytes to prevent malicious uploads.
 */
function validateFile(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) return false;
    const hex = buffer.toString('hex', 0, 4).toUpperCase();
    const allowed = [
        '89504E47', // PNG
        'FFD8FFDB', 'FFD8FFE0', 'FFD8FFEE', 'FFD8FFE1', // JPEG
        '25504446', // PDF
        '504B0304', // ZIP / DOCX / XLSX
        'D0CF11E0', // Legacy DOC / XLS
        '52494646', // WEBP / AVI / WAV (RIFF)
    ];
    return allowed.some(sig => hex.startsWith(sig));
}

/**
 * Local Filesystem Implementation
 * Used for local XAMPP development.
 */
class LocalStorageProvider implements StorageProvider {
    async upload(file: Buffer, filename: string, subDir: string = "general") {
        if (!validateFile(file)) return { success: false, error: "Security Error: Invalid or malicious file type format." };
        try {
            const uploadDir = join(process.cwd(), config.storage.local.uploadDir, subDir);
            await mkdir(uploadDir, { recursive: true });

            const filePath = join(uploadDir, filename);
            await writeFile(filePath, file);

            return {
                success: true,
                url: `${config.storage.local.baseUrl}/${subDir}/${filename}`
            };
        } catch (error) {
            console.error("Local upload failed:", error);
            return { success: false, error: "Upload failed" };
        }
    }

    async uploadFileAt(file: Buffer, relativePath: string) {
        if (!validateFile(file)) return { success: false, error: "Security Error: Invalid or malicious file type format." };
        try {
            const fullPath = join(process.cwd(), config.storage.local.uploadDir, relativePath);
            const dir = join(fullPath, "..");
            await mkdir(dir, { recursive: true });
            await writeFile(fullPath, file);

            return {
                success: true,
                url: `${config.storage.local.baseUrl}/${relativePath.replace(/\\/g, '/')}`
            };
        } catch (error) {
            console.error("Local uploadFileAt failed:", error);
            return { success: false, error: "Upload failed" };
        }
    }

    async delete(url: string) {
        // Implementation for local deletion can be added here
        return { success: true };
    }
}

/**
 * Cloud Storage Implementation
 * Supports AWS S3 and S3-compatible services like Wasabi.
 */
class S3StorageProvider implements StorageProvider {
    private client: S3Client;

    constructor() {
        this.client = new S3Client({
            region: config.storage.s3.region,
            credentials: {
                accessKeyId: config.storage.s3.accessKey || "",
                secretAccessKey: config.storage.s3.secretKey || "",
            },
            // Only provide endpoint if explicitly configured (e.g. for Wasabi)
            endpoint: config.storage.s3.endpoint || undefined,
            forcePathStyle: !!config.storage.s3.endpoint, // Often required for non-AWS S3
        });
    }

    async upload(file: Buffer, filename: string, subDir: string = "general", mimeType?: string) {
        if (!validateFile(file)) return { success: false, error: "Security Error: Invalid or malicious file type format." };
        try {
            const key = `${subDir}/${Date.now()}-${filename}`;
            const command = new PutObjectCommand({
                Bucket: config.storage.s3.bucket,
                Key: key,
                Body: file,
                ContentType: mimeType,
                // Optional: set public read if the bucket isn't already configured for it
                // ACL: "public-read", 
            });

            await this.client.send(command);

            // Construct the public URL based on provider (AWS vs Wasabi/Other)
            let url = "";
            if (config.storage.s3.endpoint) {
                // Wasabi-style URL: https://bucket.endpoint/key or https://endpoint/bucket/key
                const endpointUrl = config.storage.s3.endpoint.replace(/\/$/, "");
                url = `${endpointUrl}/${config.storage.s3.bucket}/${key}`;
            } else {
                // Standard AWS URL
                url = `https://${config.storage.s3.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${key}`;
            }

            return {
                success: true,
                url
            };
        } catch (error) {
            console.error("S3 upload failed:", error);
            return { success: false, error: `S3 Upload failed: ${(error as Error).message}` };
        }
    }

    async uploadFileAt(file: Buffer, relativePath: string, mimeType?: string) {
        if (!validateFile(file)) return { success: false, error: "Security Error: Invalid or malicious file type format." };
        try {
            const key = relativePath.replace(/\\/g, '/');
            const command = new PutObjectCommand({
                Bucket: config.storage.s3.bucket,
                Key: key,
                Body: file,
                ContentType: mimeType,
            });

            await this.client.send(command);

            let url = "";
            if (config.storage.s3.endpoint) {
                const endpointUrl = config.storage.s3.endpoint.replace(/\/$/, "");
                url = `${endpointUrl}/${config.storage.s3.bucket}/${key}`;
            } else {
                url = `https://${config.storage.s3.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${key}`;
            }

            return { success: true, url };
        } catch (error) {
            console.error("S3 uploadFileAt failed:", error);
            return { success: false, error: `S3 Upload failed: ${(error as Error).message}` };
        }
    }

    async delete(url: string) {
        try {
            // Extract key from URL
            // Very simple extraction logic, might need refinement
            const urlParts = url.split("/");
            const key = urlParts.slice(urlParts.indexOf(config.storage.s3.bucket!) + 1).join("/");

            const command = new DeleteObjectCommand({
                Bucket: config.storage.s3.bucket,
                Key: key,
            });

            await this.client.send(command);
            return { success: true };
        } catch (error) {
            console.error("S3 delete failed:", error);
            return { success: false, error: "Delete failed" };
        }
    }
}

/**
 * Helper to validate file uploads (size and mime type).
 */
export const validateFile = (file: File, options: { maxSizeMB?: number, allowedTypes?: string[] } = {}) => {
    const { maxSizeMB = 5, allowedTypes = [] } = options;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
        return { valid: false, error: `File size exceeds the limit of ${maxSizeMB}MB.` };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        return { valid: false, error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}` };
    }

    return { valid: true };
};

// Export the singleton instance based on configuration
export const storage = config.storage.provider === 's3'
    ? new S3StorageProvider()
    : new LocalStorageProvider();
