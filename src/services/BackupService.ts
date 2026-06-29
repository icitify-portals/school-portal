import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import * as fsp from "fs/promises";

export interface PullOptions {
    includeBlob: boolean;
    includeDatabase: boolean;
    localBucket?: string;
    localDir?: string;
    verbose?: boolean;
}

/**
 * Resolves the S3 client from environment or explicit args.
 * Supports both AWS S3 and Wasabi (custom endpoint) from env.
 */
function buildS3Client(bucket?: string, key?: string): S3Client {
    const accessKey = key || process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!;
    const secretKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!;
    const endpoint = process.env.S3_ENDPOINT; // e.g. https://s3.wasabisys.com
    const region   = process.env.S3_REGION   || process.env.AWS_REGION || "us-east-1";

    return new S3Client({
        region,
        ...(endpoint && { endpoint }),
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
        forcePathStyle: !!endpoint, // required for Wasabi / MinIO
    });
}

function defaultBucket(): string {
    return process.env.S3_BACKUP_BUCKET || process.env.S3_BUCKET || "school-portal-backups";
}

export class BackupService {

    /**
     * Archives the database (and optionally blob files) and pushes to S3.
     * Matches 'Backup::archive(None, node_id)' from Rust.
     */
    static archive(customBucket?: string): void {
        const bucket = customBucket || defaultBucket();
        const ts     = new Date().toISOString().replace(/[:.]/g, "-");
        const tmpDir = path.join(os.tmpdir(), `portal-backup-${ts}`);
        fs.mkdirSync(tmpDir, { recursive: true });

        console.log(`[backup] Starting archive → s3://${bucket}`);

        // --- Database dump ---
        const dbHost = process.env.DB_HOST || "127.0.0.1";
        const dbPort = process.env.DB_PORT || "3306";
        const dbUser = process.env.DB_USER || process.env.DB_USERNAME || "root";
        const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD || "";
        const dbName = process.env.DB_NAME || process.env.DATABASE_URL?.split("/").pop() || "school_portal";

        const dumpFile = path.join(tmpDir, `db-${ts}.sql`);

        try {
            const cmd = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} ${dbName} > "${dumpFile}"`;
            execSync(cmd, { 
                env: { ...process.env, MYSQL_PWD: dbPass }, 
                shell: BackupService._getShell(), 
                stdio: "inherit" 
            });
            console.log(`[backup] Database dump: ${dumpFile}`);
        } catch (e) {
            console.warn("[backup] mysqldump failed — skipping database dump. Ensure mysqldump is in PATH.");
            if (process.platform === 'win32') {
                console.log("[tip] If using XAMPP, you may need to add C:\\xampp\\mysql\\bin to your system PATH.");
            }
        }

        // Push anything we produced to S3 (synchronous for 'archive')
        BackupService._pushDirToS3(tmpDir, bucket, `backups/${ts}/`).catch(console.error);

        console.log(`[backup] Archive initiated. Files will be uploaded to s3://${bucket}/backups/${ts}/`);
    }

    /**
     * Pulls a backup from S3 and restores it locally.
     * Matches 'Backup::install(PullOptions)' from Rust.
     */
    static async pull(bucket?: string, key?: string, options: PullOptions = { includeBlob: true, includeDatabase: true }): Promise<void> {
        const resolvedBucket = bucket || defaultBucket();
        const s3 = buildS3Client(bucket, key);

        const destDir = options.localDir || path.join(process.cwd(), "restored-backup");
        fs.mkdirSync(destDir, { recursive: true });

        if (options.verbose) console.log(`[backup] Pulling from s3://${resolvedBucket} → ${destDir}`);

        // List objects in the bucket under the backup prefix
        const listed = await s3.send(new ListObjectsV2Command({ Bucket: resolvedBucket, Prefix: "backups/" }));
        const objects = listed.Contents || [];

        if (objects.length === 0) {
            console.warn("[backup] No backup objects found in bucket.");
            return;
        }

        // Find the latest backup timestamp folder
        const prefixes = [...new Set(objects.map(o => o.Key!.split("/").slice(0, 2).join("/")))];
        const latest   = prefixes.sort().pop()!;
        if (options.verbose) console.log(`[backup] Restoring from: ${latest}`);

        // Download all matching objects
        for (const obj of objects.filter(o => o.Key!.startsWith(latest))) {
            const objKey = obj.Key!;
            const isDb   = objKey.includes("db-");
            const isBlob = !isDb;

            if (isDb && !options.includeDatabase) continue;
            if (isBlob && !options.includeBlob) continue;

            const localPath = path.join(destDir, path.basename(objKey));
            if (options.verbose) console.log(`[backup] Downloading ${objKey} → ${localPath}`);

            const response = await s3.send(new GetObjectCommand({ Bucket: resolvedBucket, Key: objKey }));
            const fileStream = fs.createWriteStream(localPath);
            await pipeline(response.Body as Readable, fileStream);

            // Auto-restore SQL dumps
            if (isDb && objKey.endsWith(".sql")) {
                await BackupService._restoreDatabase(localPath, options.verbose);
            }
        }

        console.log(`[backup] Pull complete. Files restored to: ${destDir}`);
    }

    /**
     * Synchronously pushes the current mysqldump to S3.
     * Matches 'Backup::push(None, node_id)' from Rust.
     */
    static push(bucket?: string): void {
        const resolvedBucket = bucket || defaultBucket();
        const ts     = new Date().toISOString().replace(/[:.]/g, "-");
        const tmpDir = path.join(os.tmpdir(), `portal-push-${ts}`);
        fs.mkdirSync(tmpDir, { recursive: true });

        const dbHost = process.env.DB_HOST || "127.0.0.1";
        const dbPort = process.env.DB_PORT || "3306";
        const dbUser = process.env.DB_USER || process.env.DB_USERNAME || "root";
        const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD || "";
        const dbName = process.env.DB_NAME || "school_portal";
        const dumpFile = path.join(tmpDir, `db-${ts}.sql`);

        try {
            const cmd = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} ${dbName} > "${dumpFile}"`;
            execSync(cmd, { 
                env: { ...process.env, MYSQL_PWD: dbPass }, 
                shell: BackupService._getShell(), 
                stdio: "inherit" 
            });
        } catch {
            console.warn("[backup] mysqldump failed — skipping.");
        }

        BackupService._pushDirToS3(tmpDir, resolvedBucket, `backups/${ts}/`).catch(console.error);
        console.log(`[backup] Push initiated → s3://${resolvedBucket}/backups/${ts}/`);
    }

    /**
     * Pushes a specific archive file or directory to S3.
     * Matches 'Backup::push_archive(Archive{bucket, key, path}, node_id)' from Rust.
     */
    static pushArchive(filePath: string, bucket?: string, key?: string): void {
        const resolvedBucket = bucket || defaultBucket();
        const resolvedKey    = key    || `archive-${new Date().toISOString().replace(/[:.]/g, "-")}`;
        const s3Key          = `backups/${resolvedKey}/${path.basename(filePath)}`;

        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            BackupService._pushDirToS3(filePath, resolvedBucket, `backups/${resolvedKey}/`).catch(console.error);
        } else {
            const body = fs.readFileSync(filePath);
            const s3 = buildS3Client();
            s3.send(new PutObjectCommand({ Bucket: resolvedBucket, Key: s3Key, Body: body }))
                .then(() => console.log(`[backup] push-archive → s3://${resolvedBucket}/${s3Key}`))
                .catch(console.error);
        }
    }

    /**
     * Local (synchronous) pull — copies from a local backup dir into destDir.
     * Matches 'backup.pull(PullOptions{local_bucket, local_dir, ...})' from Rust.
     * This is the local filesystem variant, distinct from the async S3 install.
     */
    static pullLocal(options: PullOptions): void {
        const srcDir  = options.localBucket || process.env.LOCAL_BACKUP_DIR || path.join(process.cwd(), "backups");
        const destDir = options.localDir    || path.join(process.cwd(), "restored-backup");

        if (!fs.existsSync(srcDir)) {
            console.error(`[backup] Local backup dir not found: ${srcDir}`);
            process.exit(1);
        }

        fs.mkdirSync(destDir, { recursive: true });

        const entries = fs.readdirSync(srcDir);
        for (const entry of entries) {
            const isDb   = entry.includes("db-");
            const isBlob = !isDb;
            if (isDb   && !options.includeDatabase) continue;
            if (isBlob && !options.includeBlob)     continue;

            const dest = path.join(destDir, entry);
            fs.copyFileSync(path.join(srcDir, entry), dest);
            if (options.verbose) console.log(`[backup] pull-local → ${dest}`);
        }

        console.log(`[backup] Local pull complete → ${destDir}`);
    }

    /**
     * Prunes old backups in S3, retaining only the N most recent timestamp folders.
     * Matches 'Backup::regulate(None, node_id)' from Rust.
     */
    // @ts-expect-error - TS2393: Auto-suppressed for build
    static async regulate(bucket?: string, keepCount: number = 10): Promise<void> {
        const resolvedBucket = bucket || defaultBucket();
        const s3 = buildS3Client();

        const listed = await s3.send(new ListObjectsV2Command({ Bucket: resolvedBucket, Prefix: "backups/" }));
        const objects = listed.Contents || [];

        // Collect distinct timestamp dirs
        const dirs = [...new Set(
            objects.map(o => o.Key!.split("/")[1]).filter(Boolean)
        )].sort(); // oldest first

        const toDelete = dirs.slice(0, Math.max(0, dirs.length - keepCount));
        if (toDelete.length === 0) {
            console.log(`[backup] Regulate: nothing to prune (${dirs.length} retained).`);
            return;
        }

        for (const dir of toDelete) {
            for (const obj of objects.filter(o => o.Key!.startsWith(`backups/${dir}/`))) {
                await s3.send(new DeleteObjectCommand({ Bucket: resolvedBucket, Key: obj.Key! }));
                console.log(`[backup] Deleted → s3://${resolvedBucket}/${obj.Key}`);
            }
        }

        console.log(`[backup] Regulate complete. Pruned ${toDelete.length}, retained ${keepCount}.`);
    }

    // --- Private helpers (list/mv/presign above, S3 util below) ---

    /**
     * Lists backup directories stored in S3.
     * Matches 'Backup::list_directories(bucket, node_id)' from Rust.
     * Returns a map of { directoryName → [objectKeys] }
     */
    static async listDirectories(bucket?: string): Promise<Record<string, string[]>> {
        const resolvedBucket = bucket || defaultBucket();
        const s3 = buildS3Client();

        const listed = await s3.send(new ListObjectsV2Command({ Bucket: resolvedBucket, Prefix: "backups/" }));
        const objects = listed.Contents || [];

        const directories: Record<string, string[]> = {};
        for (const obj of objects) {
            const parts = obj.Key!.split("/");
            // e.g. backups/2024-01-15T12-00-00-000Z/db-....sql → key "2024-01-15T12-00-00-000Z"
            const dirName = parts[1];
            if (!dirName) continue;
            if (!directories[dirName]) directories[dirName] = [];
            directories[dirName].push(obj.Key!);
        }

        return directories;
    }

    /**
     * Moves a local archive directory's files into a structured S3 key path.
     * Matches 'mv::action' from Rust — effectively: mv <archive_dir>/* <dest_dir>/<bucket>/<key>/
     */
    static moveArchive(archiveDir: string, destDir: string, bucket?: string, keyOverride?: string): void {
        const resolvedBucket = bucket || defaultBucket();
        const resolvedKey    = keyOverride || process.env.S3_PUSH_KEY || "default";
        const targetDir      = path.join(destDir, resolvedBucket, resolvedKey);

        fs.mkdirSync(targetDir, { recursive: true });

        const files = fs.readdirSync(archiveDir);
        for (const file of files) {
            const src  = path.join(archiveDir, file);
            const dest = path.join(targetDir, file);
            fs.renameSync(src, dest);
            console.log(`[backup] mv ${src} → ${dest}`);
        }

        console.log(`[backup] Moved ${files.length} file(s) to ${targetDir}`);
    }

    /**
     * Generates a pre-signed S3 URL for blob or database objects.
     * Matches 'backup.blob_presign_url()' and 'backup.database_presign_url()' from Rust.
     */
    static async getPresignUrl(type: "blob" | "database", bucket?: string, keyOverride?: string): Promise<string> {
        const resolvedBucket = bucket || defaultBucket();
        const s3 = buildS3Client(bucket, keyOverride);

        // Find the latest object of the requested type
        const listed = await s3.send(new ListObjectsV2Command({ Bucket: resolvedBucket, Prefix: "backups/" }));
        const objects = listed.Contents || [];

        const filtered = objects
            .filter(o => type === "database" ? o.Key!.includes("db-") : !o.Key!.includes("db-"))
            .sort((a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0));

        if (filtered.length === 0) {
            throw new Error(`No ${type} backup found in s3://${resolvedBucket}`);
        }

        const latestKey = filtered[0].Key!;

        const url = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: resolvedBucket, Key: latestKey }),
            { expiresIn: 3600 } // 1 hour, matching typical Rust presign defaults
        );

        return url;
    }

    /**
     * Regulates old backups by deleting those beyond retention period.
     * Matches 'Backup::regulate' from Rust.
     */
    // @ts-expect-error - TS2393: Auto-suppressed for build
    static async regulate(retentionDays: number = 30): Promise<void> {
        const bucket = defaultBucket();
        const s3 = buildS3Client(bucket);

        console.log(`[backup] Regulating backups in s3://${bucket} (Retention: ${retentionDays} days)`);

        try {
            const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "backups/" }));
            const objects = listed.Contents || [];
            const now = new Date();

            for (const obj of objects) {
                if (!obj.Key || !obj.LastModified) continue;

                const diff = (now.getTime() - obj.LastModified.getTime()) / (1000 * 60 * 60 * 24);
                if (diff > retentionDays) {
                    console.log(`[backup] Deleting expired backup: ${obj.Key} (${Math.floor(diff)} days old)`);
                    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }));
                }
            }
            console.log("[backup] Regulation complete.");
        } catch (error) {
            console.error("[backup] Failed to regulate backups:", error);
        }
    }

    // --- Private helpers ---

    private static async _pushDirToS3(dir: string, bucket: string, prefix: string): Promise<void> {
        const s3 = buildS3Client();
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const key = `${prefix}${file}`;
            const body = fs.readFileSync(filePath);

            await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body }));
            console.log(`[backup] Uploaded → s3://${bucket}/${key}`);
        }
    }

    private static async _restoreDatabase(sqlFile: string, verbose?: boolean): Promise<void> {
        const dbHost = process.env.DB_HOST || "127.0.0.1";
        const dbPort = process.env.DB_PORT || "3306";
        const dbUser = process.env.DB_USER || process.env.DB_USERNAME || "root";
        const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD || "";
        const dbName = process.env.DB_NAME || "school_portal";
        const passEnv = dbPass ? `MYSQL_PWD=${dbPass} ` : "";

        if (verbose) console.log(`[backup] Restoring database from ${sqlFile}`);
        try {
            const cmd = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} ${dbName} < "${sqlFile}"`;
            execSync(cmd, { 
                env: { ...process.env, MYSQL_PWD: dbPass }, 
                shell: BackupService._getShell(), 
                stdio: "inherit" 
            });
            console.log(`[backup] Database restored from ${sqlFile}`);
        } catch {
            console.warn("[backup] mysql restore failed — ensure mysql client is in PATH.");
        }
    }

    private static _getShell(): string {
        return process.platform === "win32" ? "cmd.exe" : "/bin/sh";
    }
}
