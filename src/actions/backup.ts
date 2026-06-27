"use server";

import { exec, execFile } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { revalidatePath } from "next/cache";

import AdmZip from "adm-zip";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const execFilePromise = promisify(execFile);


const BACKUP_DIR = path.join(process.cwd(), "backups");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

import { getSettingByKey } from "./settings";

async function uploadToCloud(filePath: string, provider: 's3' | 'wasabi') {
    const fileName = path.basename(filePath);
    
    let region, accessKey, secretKey, bucket, endpoint;

    if (provider === 's3') {
        region = await getSettingByKey('aws_s3_region') || process.env.AWS_S3_REGION;
        accessKey = await getSettingByKey('aws_s3_access_key') || process.env.AWS_S3_ACCESS_KEY;
        secretKey = await getSettingByKey('aws_s3_secret_key') || process.env.AWS_S3_SECRET_KEY;
        bucket = await getSettingByKey('aws_s3_bucket') || process.env.AWS_S3_BUCKET;
    } else {
        region = await getSettingByKey('wasabi_region') || process.env.WASABI_REGION || 'us-east-1';
        accessKey = await getSettingByKey('wasabi_access_key') || process.env.WASABI_ACCESS_KEY;
        secretKey = await getSettingByKey('wasabi_secret_key') || process.env.WASABI_SECRET_KEY;
        bucket = await getSettingByKey('wasabi_bucket') || process.env.WASABI_BUCKET;
        endpoint = `https://s3.${region}.wasabisys.com`;
    }

    if (!accessKey || !secretKey || !bucket) {
        console.warn(`Cloud backup skipped for ${provider}: Missing credentials`);
        return false;
    }

    const config = {
        region,
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        },
        ...(endpoint ? { endpoint } : {})
    };

    const client = new S3Client(config);

    try {
        const fileBuffer = fs.readFileSync(filePath);
        await client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: `backups/${fileName}`,
            Body: fileBuffer,
        }));
        console.log(`Successfully uploaded ${fileName} to ${provider}`);
        return true;
    } catch (error) {
        console.error(`Failed to upload to ${provider}:`, error);
        return false;
    }
}

export async function runBackup() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const dbBackupFile = path.join(BACKUP_DIR, `db-backup-${timestamp}.sql`);
        const fileBackupFile = path.join(BACKUP_DIR, `files-backup-${timestamp}.zip`);
        
        // 1. Database Backup
        const dbUser = process.env.DB_USER || "root";
        const dbPass = process.env.DB_PASSWORD || "";
        const dbName = process.env.DB_NAME || "moodledb";
        const dbHost = process.env.DB_HOST || "localhost";

        // SECURITY FIX C-1: Use execFile with an argument array — no shell interpolation.
        // Environment variable values (dbHost, dbUser, dbPass, dbName) are passed as
        // discrete arguments and never concatenated into a shell string, preventing
        // shell injection if any variable were ever sourced from user input.
        const mysqldumpArgs = [
            `-h${dbHost}`,
            `-u${dbUser}`,
            ...(dbPass ? [`--password=${dbPass}`] : []),
            `--result-file=${dbBackupFile}`,
            dbName,
        ];
        await execFilePromise("mysqldump", mysqldumpArgs, { shell: false });


        // 2. File Backup
        const zip = new AdmZip();
        if (fs.existsSync(UPLOADS_DIR)) {
            zip.addLocalFolder(UPLOADS_DIR, "uploads");
            zip.writeZip(fileBackupFile);
        }

        // 3. Cloud Uploads
        const s3Status = await uploadToCloud(dbBackupFile, 's3') && await uploadToCloud(fileBackupFile, 's3');
        const wasabiStatus = await uploadToCloud(dbBackupFile, 'wasabi') && await uploadToCloud(fileBackupFile, 'wasabi');
        
        revalidatePath("/admin/system/backup");
        return { 
            success: true, 
            message: "Backup completed and uploaded to cloud", 
            s3: s3Status,
            wasabi: wasabiStatus,
            timestamp: new Date().toLocaleString()
        };
    } catch (error: any) {
        console.error("Backup failed:", error);
        return { success: false, error: error.message };
    }
}

export async function getBackupHistory() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) return [];
        
        const files = fs.readdirSync(BACKUP_DIR);
        return files
            .filter(f => f.endsWith(".sql") || f.endsWith(".zip"))
            .map(f => {
                const stats = fs.statSync(path.join(BACKUP_DIR, f));
                return {
                    name: f,
                    type: f.endsWith(".sql") ? "database" : "files",
                    size: (stats.size / (1024 * 1024)).toFixed(2) + " MB",
                    date: stats.mtime.toLocaleString(),
                    path: f
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error("Failed to fetch backup history:", error);
        return [];
    }
}
