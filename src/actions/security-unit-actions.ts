"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { 
  securityVehicles, 
  securityVehicleLogs, 
  securityStrategicPositions, 
  securityPatrolLogs, 
  securityIncidents, 
  users 
} from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac";
import { generateVehiclePassQR, verifyQRPass } from "@/lib/qr-security";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const VehicleRegistrationSchema = z.object({
  licensePlate: z.string().min(1, "License plate is required"),
  vehicleMake: z.string().min(1, "Vehicle make is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehicleColor: z.string().min(1, "Vehicle color is required"),
  ownerType: z.enum(['student', 'staff', 'visitor', 'other']),
  ownerName: z.string().min(1, "Owner name is required"),
});

const IncidentReportSchema = z.object({
  title: z.string().min(1, "Incident title is required"),
  description: z.string().min(1, "Description details are required"),
  incidentType: z.enum(['theft', 'trespass', 'property_damage', 'assault', 'accident', 'fire_hazard', 'medical_emergency', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.string().min(1, "Incident location is required"),
});

/**
 * Register a vehicle for gate pass permit. Available to all authenticated users.
 */
export async function registerVehicleAction(data: z.infer<typeof VehicleRegistrationSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = VehicleRegistrationSchema.parse(data);
    const userId = parseInt(session.user.id);
    const passNumber = `VP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await db.insert(securityVehicles).values({
      ownerId: userId,
      ownerName: validated.ownerName,
      ownerType: validated.ownerType,
      licensePlate: validated.licensePlate.toUpperCase(),
      vehicleMake: validated.vehicleMake,
      vehicleModel: validated.vehicleModel,
      vehicleColor: validated.vehicleColor,
      passNumber,
      status: 'pending',
    });

    revalidatePath("/student/security-vehicle");
    revalidatePath("/admin/security-director");

    return { 
      success: true, 
      message: "Vehicle registered successfully. Your gate pass is pending CSO approval." 
    };
  } catch (error: any) {
    console.error("Register vehicle action error:", error);
    return { success: false, error: error.message || "Failed to register vehicle" };
  }
}

/**
 * Approve or revoke a vehicle pass. Restricted to Chief Security Officer.
 */
export async function approveVehiclePassAction(vehicleId: number, approve: boolean) {
  try {
    const isAuth = await hasPermission("security.vehicle.approve");
    if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

    if (approve) {
      // Fetch vehicle details
      const [vehicle] = await db.select().from(securityVehicles).where(eq(securityVehicles.id, vehicleId)).limit(1);
      if (!vehicle) return { success: false, error: "Vehicle not found" };

      // Generate signed QR pass
      const qrResult = await generateVehiclePassQR(vehicleId, vehicle.licensePlate, vehicle.passNumber);

      await db.update(securityVehicles)
        .set({
          status: 'approved',
          qrCode: qrResult.qrData,
          expiresAt: qrResult.expiresAt,
        })
        .where(eq(securityVehicles.id, vehicleId));
        
      revalidatePath("/admin/security-director");
      revalidatePath("/student/security-vehicle");
      return { success: true, message: "Vehicle gate pass approved and QR code generated." };
    } else {
      await db.update(securityVehicles)
        .set({
          status: 'revoked',
        })
        .where(eq(securityVehicles.id, vehicleId));

      revalidatePath("/admin/security-director");
      revalidatePath("/student/security-vehicle");
      return { success: true, message: "Vehicle gate pass revoked." };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to review vehicle pass" };
  }
}

/**
 * Log entry/exit of a vehicle at checkpoints. Restricted to Security Officers.
 */
export async function logVehicleMovementAction(qrData: string, gateName: string, direction: 'entry' | 'exit') {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const isAuth = await hasPermission("security.vehicle.scan");
    if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

    const officerId = parseInt(session.user.id);

    // Verify QR code payload
    const verification = await verifyQRPass(qrData);
    if (!verification.success) {
      return { success: false, error: verification.error || "Invalid QR pass" };
    }

    const payload = verification.data!;
    if (payload.type !== 'vehicle_pass') {
      return { success: false, error: "QR code is not a valid vehicle pass" };
    }

    // Verify vehicle status in DB
    const [vehicle] = await db.select()
      .from(securityVehicles)
      .where(eq(securityVehicles.id, payload.entityId))
      .limit(1);

    if (!vehicle) return { success: false, error: "Vehicle registration not found" };
    if (vehicle.status !== 'approved') return { success: false, error: `Vehicle pass status is '${vehicle.status}'` };

    // Record movement log
    await db.insert(securityVehicleLogs).values({
      vehicleId: vehicle.id,
      gateName,
      direction,
      securityOfficerId: officerId,
    });

    revalidatePath("/staff/security-officer");
    revalidatePath("/admin/security-director");

    return { 
      success: true, 
      message: `Logged ${direction.toUpperCase()} for vehicle: ${vehicle.licensePlate} (${vehicle.vehicleMake} ${vehicle.vehicleModel})`
    };
  } catch (error: any) {
    console.error("Log vehicle movement error:", error);
    return { success: false, error: error.message || "Failed to log movement" };
  }
}

/**
 * Create a new strategic patrol checkpoint. Restricted to Chief Security Officer.
 */
export async function createStrategicPositionAction(name: string, description?: string) {
  try {
    const isAuth = await hasPermission("security.position.manage");
    if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

    if (!name.trim()) return { success: false, error: "Checkpoint name is required" };

    const qrToken = `POS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    await db.insert(securityStrategicPositions).values({
      name,
      description,
      qrCode: qrToken,
      isActive: true,
    });

    revalidatePath("/admin/security-director");
    return { success: true, message: `Patrol checkpoint "${name}" registered successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create checkpoint" };
  }
}

/**
 * Log a patrol round scan. Restricted to Security Officers.
 */
export async function logPatrolAction(checkpointQrCode: string, notes?: string, gpsCoordinates?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const isAuth = await hasPermission("security.patrol.log");
    if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

    const officerId = parseInt(session.user.id);

    // Find strategic position
    const [checkpoint] = await db.select()
      .from(securityStrategicPositions)
      .where(eq(securityStrategicPositions.qrCode, checkpointQrCode))
      .limit(1);

    if (!checkpoint) return { success: false, error: "Invalid checkpoint QR code" };
    if (!checkpoint.isActive) return { success: false, error: "Checkpoint is marked inactive" };

    // Record patrol round
    await db.insert(securityPatrolLogs).values({
      checkpointId: checkpoint.id,
      patrolOfficerId: officerId,
      notes,
      gpsCoordinates,
    });

    revalidatePath("/staff/security-officer");
    revalidatePath("/admin/security-director");

    return { 
      success: true, 
      message: `Patrol logged successfully for checkpoint: ${checkpoint.name}` 
    };
  } catch (error: any) {
    console.error("Log patrol error:", error);
    return { success: false, error: error.message || "Failed to record patrol round" };
  }
}

/**
 * Report a security incident. Restricted to Security Officers.
 */
export async function reportIncidentAction(data: z.infer<typeof IncidentReportSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const isAuth = await hasPermission("security.incident.report");
    if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

    const validated = IncidentReportSchema.parse(data);
    const officerId = parseInt(session.user.id);

    await db.insert(securityIncidents).values({
      title: validated.title,
      description: validated.description,
      incidentType: validated.incidentType,
      severity: validated.severity,
      location: validated.location,
      reportedBy: officerId,
      status: 'reported',
    });

    revalidatePath("/staff/security-officer");
    revalidatePath("/admin/security-director");

    return { 
      success: true, 
      message: "Security incident reported. Chief Security Officer has been alerted." 
    };
  } catch (error: any) {
    console.error("Report incident error:", error);
    return { success: false, error: error.message || "Failed to file incident report" };
  }
}

/**
 * Resolve/Update incident status. Restricted to Chief Security Officer.
 */
export async function resolveIncidentAction(incidentId: number, status: 'under_investigation' | 'resolved' | 'closed', notes: string) {
  try {
    const isAuth = await hasPermission("security.incident.manage");
    if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

    if (!notes.trim()) return { success: false, error: "Resolution notes/updates are required" };

    await db.update(securityIncidents)
      .set({
        status,
        resolutionNotes: notes,
        resolvedAt: status === 'resolved' || status === 'closed' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(securityIncidents.id, incidentId));

    revalidatePath("/admin/security-director");
    return { success: true, message: `Incident status updated to: ${status}` };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update incident" };
  }
}

/**
 * Fetch stats and raw records for the CSO dashboard.
 */
export async function getSecurityDashboardStatsAction() {
  try {
    const isAuth = await hasPermission("security.dashboard.view");
    if (!isAuth) return { success: false, error: "Unauthorized: Access Denied" };

    // Count today's patrols
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [patrolCountResult] = await db.select({ count: sql<number>`count(*)` })
      .from(securityPatrolLogs)
      .where(sql`${securityPatrolLogs.scannedAt} >= ${todayStart}`);

    // Count active open incidents
    const [openIncidentsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(securityIncidents)
      .where(inArray(securityIncidents.status, ['reported', 'under_investigation']));

    // Count today's vehicle gate traffic
    const [gateTrafficResult] = await db.select({ count: sql<number>`count(*)` })
      .from(securityVehicleLogs)
      .where(sql`${securityVehicleLogs.timestamp} >= ${todayStart}`);

    // Count pending vehicle passes
    const [pendingPassesResult] = await db.select({ count: sql<number>`count(*)` })
      .from(securityVehicles)
      .where(eq(securityVehicles.status, 'pending'));

    // Fetch lists
    const incidentsList = await db.select({
      id: securityIncidents.id,
      title: securityIncidents.title,
      description: securityIncidents.description,
      incidentType: securityIncidents.incidentType,
      severity: securityIncidents.severity,
      location: securityIncidents.location,
      status: securityIncidents.status,
      resolutionNotes: securityIncidents.resolutionNotes,
      createdAt: securityIncidents.createdAt,
      reporterName: users.name
    })
    .from(securityIncidents)
    .innerJoin(users, eq(securityIncidents.reportedBy, users.id))
    .orderBy(desc(securityIncidents.createdAt));

    const vehiclesList = await db.select({
      id: securityVehicles.id,
      ownerName: securityVehicles.ownerName,
      ownerType: securityVehicles.ownerType,
      licensePlate: securityVehicles.licensePlate,
      vehicleMake: securityVehicles.vehicleMake,
      vehicleModel: securityVehicles.vehicleModel,
      vehicleColor: securityVehicles.vehicleColor,
      passNumber: securityVehicles.passNumber,
      status: securityVehicles.status,
      createdAt: securityVehicles.createdAt,
    })
    .from(securityVehicles)
    .orderBy(desc(securityVehicles.createdAt));

    const checkpointsList = await db.select().from(securityStrategicPositions);

    const patrolLogsList = await db.select({
      id: securityPatrolLogs.id,
      checkpointName: securityStrategicPositions.name,
      officerName: users.name,
      notes: securityPatrolLogs.notes,
      scannedAt: securityPatrolLogs.scannedAt,
    })
    .from(securityPatrolLogs)
    .innerJoin(securityStrategicPositions, eq(securityPatrolLogs.checkpointId, securityStrategicPositions.id))
    .innerJoin(users, eq(securityPatrolLogs.patrolOfficerId, users.id))
    .orderBy(desc(securityPatrolLogs.scannedAt))
    .limit(30);

    const vehicleLogsList = await db.select({
      id: securityVehicleLogs.id,
      licensePlate: securityVehicles.licensePlate,
      ownerName: securityVehicles.ownerName,
      gateName: securityVehicleLogs.gateName,
      direction: securityVehicleLogs.direction,
      officerName: users.name,
      timestamp: securityVehicleLogs.timestamp,
    })
    .from(securityVehicleLogs)
    .innerJoin(securityVehicles, eq(securityVehicleLogs.vehicleId, securityVehicles.id))
    .innerJoin(users, eq(securityVehicleLogs.securityOfficerId, users.id))
    .orderBy(desc(securityVehicleLogs.timestamp))
    .limit(30);

    return {
      success: true,
      stats: {
        activePatrolsCount: Number(patrolCountResult?.count || 0),
        openIncidentsCount: Number(openIncidentsResult?.count || 0),
        gateTrafficCount: Number(gateTrafficResult?.count || 0),
        pendingPassesCount: Number(pendingPassesResult?.count || 0),
      },
      incidents: incidentsList,
      vehicles: vehiclesList,
      checkpoints: checkpointsList,
      patrolLogs: patrolLogsList,
      vehicleLogs: vehicleLogsList,
    };
  } catch (error: any) {
    console.error("Fetch security stats error:", error);
    return { success: false, error: error.message || "Failed to load dashboard statistics" };
  }
}

/**
 * Get all vehicles owned by the logged-in user.
 */
export async function getMyVehiclesAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const userId = parseInt(session.user.id);
    const list = await db.select().from(securityVehicles).where(eq(securityVehicles.ownerId, userId)).orderBy(desc(securityVehicles.createdAt));

    return { success: true, vehicles: list };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load registered vehicles" };
  }
}
