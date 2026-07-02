import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import util from "util";
import { StorageService } from "./storage.service";
import { db } from "../db/db";
import { system_backups } from "../db/schema";
import { eq } from "drizzle-orm";

const execPromise = util.promisify(exec);

export class BackupService {
  private static get backupDir() {
    return path.join(process.cwd(), "backups");
  }

  private static async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  /**
   * Generates a MySQL dump of the application database and zips it.
   */
  static async runDatabaseBackup(): Promise<{ filepath: string; sizeBytes: number; filename: string }> {
    await this.ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `db_backup_${timestamp}.sql.gz`;
    const filepath = path.join(this.backupDir, filename);

    // Assuming local XAMPP environment or production DB credentials
    const dbUser = process.env.DB_USER || "root";
    const dbPass = process.env.DB_PASS || "";
    const dbHost = process.env.DB_HOST || "127.0.0.1";
    const dbName = process.env.DB_NAME || "school_portal";

    const passArg = dbPass ? `-p"${dbPass}"` : "";

    // IMPORTANT: Make sure mysqldump and gzip are available in the system PATH.
    // For Hostinger VPS, they are typically pre-installed.
    // For local XAMPP windows dev, you might need exact path to mysqldump.exe if not in PATH.
    // Since this is destined for Hostinger VPS, standard mysqldump should work.
    let cmd = `mysqldump -h ${dbHost} -u ${dbUser} ${passArg} ${dbName} | gzip > "${filepath}"`;
    if (process.platform === 'win32') {
        cmd = `c:\\xampp\\mysql\\bin\\mysqldump.exe -h ${dbHost} -u ${dbUser} ${passArg} ${dbName} > "${filepath.replace('.gz', '')}"`;
    }

    await execPromise(cmd);

    let stat;
    if (process.platform === 'win32') {
        stat = await fs.stat(filepath.replace('.gz', ''));
        return { filepath: filepath.replace('.gz', ''), sizeBytes: stat.size, filename: filename.replace('.gz', '') };
    } else {
        stat = await fs.stat(filepath);
        return { filepath, sizeBytes: stat.size, filename };
    }
  }

  /**
   * Uploads the backup file to Wasabi S3 and logs it to the database.
   */
  static async uploadBackupToWasabi(filepath: string, filename: string, sizeBytes: number, type: 'database' | 'files'): Promise<string> {
    const fileBuffer = await fs.readFile(filepath);
    const key = `backups/${type}/${filename}`;

    await StorageService.uploadFile(key, fileBuffer, "application/gzip");

    // Optionally get a pre-signed URL or just store the bucket key
    const wasabiUrl = await StorageService.getFileUrl(key, 86400 * 7); // Valid for 7 days

    await db.insert(system_backups).values({
      filename,
      sizeBytes,
      type,
      status: 'completed',
      wasabiUrl,
    });

    return wasabiUrl;
  }

  /**
   * Deletes local backup files older than a specified number of days.
   * @param daysRetention Default is 5 days
   */
  static async cleanLocalBackups(daysRetention = 5): Promise<void> {
    await this.ensureBackupDir();
    const files = await fs.readdir(this.backupDir);
    const now = Date.now();
    const msRetention = daysRetention * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stat = await fs.stat(filePath);

      if (now - stat.mtimeMs > msRetention) {
        await fs.unlink(filePath);
        console.log(`Deleted old backup file: ${file}`);
      }
    }
  }
}
