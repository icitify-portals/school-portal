"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { 
  securityAudit, 
  movementLogs, 
  users, 
  students, 
  staffProfiles,
  libraryCirculation, 
  libraryFines,
  libraryPhysicalCopies,
  libraryResources
} from "@/db/schema";
import { eq, and, desc, sql, sum } from "drizzle-orm";
import { verifyQRPass, QRPassData } from "@/lib/qr-security";
import { headers } from "next/headers";
import { z } from "zod";

// Input validation schemas
const MovementLogSchema = z.object({
  qrData: z.string().min(1, "QR data is required"),
  scanType: z.enum(['library_book', 'visitor_pass', 'student_gate', 'staff_gate']),
  location: z.string().optional(),
});

/**
 * Log movement and verify QR pass with blocker logic
 */
export async function logMovement(data: z.infer<typeof MovementLogSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const securityOfficerId = parseInt(session.user.id);
    
    // Validate input
    const validatedData = MovementLogSchema.parse(data);
    
    // Get IP address and user agent
    let ipAddress = '';
    let userAgent = '';
    try {
      const headerList = await headers();
      ipAddress = headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || '';
      userAgent = headerList.get('user-agent') || '';
    } catch { /* headers may not be available */ }

    // Verify QR pass
    const qrVerification = await verifyQRPass(validatedData.qrData);
    if (!qrVerification.success) {
      // Log failed verification
      await logSecurityEvent({
        scanType: validatedData.scanType,
        entityId: null,
        entityType: 'user',
        scanResult: 'error',
        qrData: validatedData.qrData,
        scannedBy: securityOfficerId,
        ipAddress,
        userAgent,
        location: validatedData.location,
        blockReason: qrVerification.error,
      });
      
      return { 
        success: false, 
        error: qrVerification.error,
        scanResult: 'error'
      };
    }

    const qrData = qrVerification.data!;

    // Check for blocker conditions (overdue library books for student exits)
    const blockerCheck = await checkBlockerConditions(qrData, validatedData.scanType);
    
    if (blockerCheck.isBlocked) {
      // Log blocked attempt
      await logSecurityEvent({
        scanType: validatedData.scanType,
        entityId: qrData.entityId,
        entityType: qrData.entityType,
        scanResult: 'blocked',
        qrData: validatedData.qrData,
        scannedBy: securityOfficerId,
        ipAddress,
        userAgent,
        location: validatedData.location,
        finesOwed: blockerCheck.finesOwed,
        blockReason: blockerCheck.reason,
        photoUrl: blockerCheck.photoUrl,
      });

      return {
        success: false,
        error: blockerCheck.reason,
        scanResult: 'blocked',
        finesOwed: blockerCheck.finesOwed,
        photoUrl: blockerCheck.photoUrl,
      };
    }

    // Process successful scan
    const result = await processSuccessfulScan(qrData, validatedData.scanType, securityOfficerId);
    
    // Log successful scan
    await logSecurityEvent({
      scanType: validatedData.scanType,
      entityId: qrData.entityId,
      entityType: qrData.entityType,
      scanResult: 'allowed',
      qrData: validatedData.qrData,
      scannedBy: securityOfficerId,
      ipAddress,
      userAgent,
      location: validatedData.location,
      finesOwed: result.finesOwed,
      photoUrl: result.photoUrl,
    });

    return {
      success: true,
      scanResult: 'allowed',
      entity: result.entity,
      finesOwed: result.finesOwed,
      photoUrl: result.photoUrl,
      message: result.message,
    };

  } catch (error) {
    console.error("Movement log error:", error);
    return { success: false, error: "Failed to process movement" };
  }
}

/**
 * Check blocker conditions (overdue books, fines, etc.) - Optimized for performance
 */
async function checkBlockerConditions(qrData: QRPassData, scanType: string) {
  // Blocker logic: Students with overdue books cannot exit
  if (qrData.type === 'student_gate' && scanType === 'student_gate') {
    
    // Optimized single query with proper indexing
    const overdueData = await db
      .select({
        overdueCount: sql<number>`count(*)`.mapWith(Number),
        totalFines: sum(libraryFines.amount).mapWith(Number),
        userPhoto: users.imageUrl,
      })
      .from(libraryCirculation)
      .leftJoin(libraryFines, eq(libraryCirculation.id, libraryFines.circulationId))
      .leftJoin(users, eq(libraryCirculation.patronId, users.id))
      .where(
        and(
          eq(libraryCirculation.patronId, qrData.entityId),
          eq(libraryCirculation.status, 'active'),
          sql`${libraryCirculation.dueDate} < NOW()`
        )
      )
      .limit(1);

    const overdueInfo = overdueData[0];
    const overdueCount = overdueInfo?.overdueCount || 0;
    const totalFines = overdueInfo?.totalFines || 0;

    if (overdueCount > 0) {
      return {
        isBlocked: true,
        reason: `Student has ${overdueCount} overdue book(s) and ₦${totalFines.toFixed(2)} in fines. Please clear library obligations before leaving.`,
        finesOwed: totalFines.toString(),
        photoUrl: overdueInfo?.userPhoto || null,
      };
    }
  }

  return { isBlocked: false };
}

/**
 * Process successful scan based on type - Optimized for performance
 */
async function processSuccessfulScan(qrData: QRPassData, scanType: string, scannedBy: number) {
  let entity = null;
  let finesOwed = '0.00';
  let photoUrl = null;
  let message = '';

  switch (qrData.type) {
    case 'library_book':
      // Optimized single query for book data
      const [bookData] = await db
        .select({
          title: libraryResources.title,
          barcode: libraryPhysicalCopies.barcode,
          location: libraryPhysicalCopies.shelfLocation,
        })
        .from(libraryPhysicalCopies)
        .innerJoin(libraryResources, eq(libraryPhysicalCopies.resourceId, libraryResources.id))
        .where(eq(libraryPhysicalCopies.id, qrData.entityId))
        .limit(1);

      if (bookData) {
        entity = {
          type: 'library_book',
          title: bookData.title,
          barcode: bookData.barcode,
          location: bookData.location,
        };
        message = `Library book: ${bookData.title}`;
      }
      break;

    case 'visitor_pass':
      // Optimized for visitor pass (no DB lookup needed)
      entity = {
        type: 'visitor',
        name: qrData.visitorName || 'Visitor',
        purpose: qrData.purpose || 'Visit',
      };
      message = `Visitor: ${qrData.visitorName}`;
      break;

    case 'student_gate':
    case 'staff_gate':
      // Optimized single query with parallel fine calculation
      const [userData] = await db
        .select({
          userName: users.name,
          userPhoto: users.imageUrl,
          matricNumber: students.matricNumber,
          userRole: users.role,
        })
        .from(users)
        .leftJoin(students, eq(users.id, students.userId))
        .where(eq(users.id, qrData.entityId))
        .limit(1);

      if (userData) {
        photoUrl = userData.userPhoto;
        
        // Parallel fine calculation (only for users who might have fines)
        const finePromise = userData.userRole === 'student' ? 
          db
            .select({
              totalFines: sum(libraryFines.amount).mapWith(Number),
            })
            .from(libraryFines)
            .where(
              and(
                eq(libraryFines.patronId, qrData.entityId),
                eq(libraryFines.status, 'unpaid')
              )
            )
            .limit(1) : Promise.resolve([{ totalFines: 0 }]);

        const [fineData] = await finePromise;
        finesOwed = (fineData?.totalFines || 0).toString();

        if (userData.matricNumber) {
          entity = {
            type: 'student',
            name: userData.userName,
            matricNumber: userData.matricNumber,
            programme: 'Student',
          };
          message = `Student: ${userData.userName} (${userData.matricNumber})`;
        } else {
          entity = {
            type: 'staff',
            name: userData.userName,
            department: 'Staff',
          };
          message = `Staff: ${userData.userName}`;
        }
      }
      break;
  }

  return { entity, finesOwed, photoUrl, message };
}

/**
 * Log security event to audit table
 */
async function logSecurityEvent(data: {
  scanType: string;
  entityId: number | null;
  entityType: string;
  scanResult: string;
  qrData: string;
  scannedBy: number;
  ipAddress: string;
  userAgent: string;
  location?: string;
  finesOwed?: string;
  blockReason?: string;
  photoUrl?: string | null;
}) {
  try {
    await db.insert(securityAudit).values({
      scanType: data.scanType as any,
      entityId: data.entityId,
      entityType: data.entityType as any,
      scanResult: data.scanResult as any,
      qrData: data.qrData,
      scannedBy: data.scannedBy,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      location: data.location || null,
      finesOwed: data.finesOwed || '0.00',
      blockReason: data.blockReason || null,
      photoUrl: data.photoUrl || null,
    });
  } catch (error) {
    console.error("Security audit log error:", error);
    // Don't throw - logging should never break the main action
  }
}

/**
 * Get recent security audit logs - Optimized for performance
 */
export async function getSecurityAuditLogs(limit: number = 50) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Optimized query with proper indexing and minimal joins
    const logs = await db
      .select({
        id: securityAudit.id,
        scanType: securityAudit.scanType,
        scanResult: securityAudit.scanResult,
        createdAt: securityAudit.createdAt,
        scannerName: users.name,
        finesOwed: securityAudit.finesOwed,
        blockReason: securityAudit.blockReason,
      })
      .from(securityAudit)
      .leftJoin(users, eq(securityAudit.scannedBy, users.id))
      .orderBy(desc(securityAudit.createdAt))
      .limit(limit);

    return { success: true, logs };
  } catch (error) {
    console.error("Failed to fetch security audit logs:", error);
    return { error: "Failed to fetch logs" };
  }
}

/**
 * Get movement statistics for dashboard
 */
export async function getMovementStats() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const [todayStats] = await db
      .select({
        totalScans: sql<number>`count(*)`.mapWith(Number),
        allowedScans: sql<number>`sum(case when scan_result = 'allowed' then 1 else 0 end)`.mapWith(Number),
        blockedScans: sql<number>`sum(case when scan_result = 'blocked' then 1 else 0 end)`.mapWith(Number),
        errorScans: sql<number>`sum(case when scan_result = 'error' then 1 else 0 end)`.mapWith(Number),
      })
      .from(securityAudit)
      .where(sql`DATE(created_at) = CURDATE()`);

    return {
      success: true,
      stats: {
        today: todayStats,
      },
    };
  } catch (error) {
    console.error("Failed to fetch movement stats:", error);
    return { error: "Failed to fetch stats" };
  }
}
