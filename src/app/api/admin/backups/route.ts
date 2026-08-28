import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { system_backups } from "@/db/schema";
import { desc } from "drizzle-orm";
import { BackupService } from "@/services/backup.service";
import { auth } from "@/auth";

const ADMIN_ROLES = ['admin', 'superadmin', 'icitify_dev'];

// GET /api/admin/backups - Fetch history
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await db.query.system_backups.findMany({
      orderBy: [desc(system_backups.createdAt)],
      limit: 50
    });
    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    console.error("Failed to fetch backups:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/backups - Trigger manual backup
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { filepath, filename, sizeBytes } = await BackupService.runDatabaseBackup();
    const wasabiUrl = await BackupService.uploadBackupToWasabi(filepath, filename, sizeBytes, "database");
    await BackupService.cleanLocalBackups(5);

    return NextResponse.json({ 
      success: true, 
      message: "Database backup completed successfully.",
      data: { filename, sizeBytes, wasabiUrl }
    });
  } catch (error: any) {
    console.error("Backup failed:", error);
    
    await db.insert(system_backups).values({
        filename: `manual-fail-${Date.now()}`,
        status: 'failed',
        errorMessage: error.message,
    });
    
    return NextResponse.json({ success: false, error: "Backup failed: " + error.message }, { status: 500 });
  }
}
