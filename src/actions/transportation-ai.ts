"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { 
  gps_tracking_realtime,
  mobile_app_sessions,
  route_optimization,
  demand_forecasting,
  predictive_maintenance_ai,
  passenger_behavior_analytics,
  smart_notifications,
  payment_transactions,
  mobile_app_analytics,
  vehicles,
  routes,
  trips,
  students,
  users
} from "@/db/schema";
import { eq, and, desc, sql, like, count, sum, gte, lte, avg, max, min } from "drizzle-orm";
import { z } from "zod";

// Input validation schemas
const GPSDataSchema = z.object({
  vehicleId: z.number().min(1, "Vehicle ID is required"),
  tripId: z.number().optional(),
  latitude: z.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.number().min(-180).max(180, "Invalid longitude"),
  speed: z.number().min(0).max(200, "Invalid speed"),
  heading: z.number().min(0).max(360, "Invalid heading"),
  altitude: z.number().optional(),
  accuracy: z.number().min(0).optional(),
  ignitionStatus: z.boolean().optional(),
  gpsStatus: z.enum(['active', 'inactive', 'error']).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  odometerReading: z.number().min(0).optional(),
  engineStatus: z.enum(['running', 'stopped', 'error']).optional(),
  doorStatus: z.enum(['open', 'closed', 'unknown']).optional(),
});

const MobileSessionSchema = z.object({
  deviceType: z.enum(['android', 'ios', 'web']),
  deviceId: z.string().min(1, "Device ID is required"),
  appVersion: z.string().optional(),
  pushToken: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

const PaymentTransactionSchema = z.object({
  transactionReference: z.string().min(1, "Transaction reference is required"),
  transactionType: z.enum(['transport_fare', 'monthly_pass', 'semester_pass', 'trip_pass', 'penalty', 'refund']),
  amount: z.number().min(0, "Amount must be non-negative"),
  currency: z.string().default('NGN'),
  paymentMethod: z.enum(['mobile_money', 'card', 'bank_transfer', 'wallet', 'cash']),
  paymentGateway: z.string().optional(),
  gatewayTransactionId: z.string().optional(),
  metadata: z.any().optional(),
});

const NotificationSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  notificationType: z.enum(['trip_reminder', 'delay_alert', 'route_change', 'maintenance_alert', 'safety_alert', 'promotional', 'feedback_request', 'payment_reminder']),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  channels: z.any(), // JSON array
  scheduledAt: z.date().optional(),
  responseRequired: z.boolean().default(false),
  metadata: z.any().optional(),
});

/**
 * Update real-time GPS tracking data
 */
export async function updateGPSTracking(data: z.infer<typeof GPSDataSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = GPSDataSchema.parse(data);

    // Verify vehicle exists and is active
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, validatedData.vehicleId))
      .limit(1);

    if (!vehicle) {
      return { success: false, error: "Vehicle not found" };
    }

    // Insert GPS tracking data
    const [result] = await db.insert(gps_tracking_realtime).values({
      vehicleId: validatedData.vehicleId,
      tripId: validatedData.tripId,
      latitude: validatedData.latitude.toString(),
      longitude: validatedData.longitude.toString(),
      speed: validatedData.speed.toString(),
      heading: validatedData.heading,
      altitude: validatedData.altitude?.toString(),
      accuracy: validatedData.accuracy?.toString(),
      ignitionStatus: validatedData.ignitionStatus,
      gpsStatus: validatedData.gpsStatus,
      batteryLevel: validatedData.batteryLevel,
      fuelLevel: validatedData.fuelLevel,
      odometerReading: validatedData.odometerReading,
      engineStatus: validatedData.engineStatus,
      doorStatus: validatedData.doorStatus,
      timestamp: new Date(),
    } as any);

    // Update vehicle's current mileage if provided
    if (validatedData.odometerReading) {
      await db
        .update(vehicles)
        .set({ currentMileage: validatedData.odometerReading })
        .where(eq(vehicles.id, validatedData.vehicleId));
    }

    return {
      success: true,
      trackingId: result.insertId,
      message: "GPS tracking data updated successfully",
    };

  } catch (error) {
    console.error("Update GPS tracking error:", error);
    return { success: false, error: "Failed to update GPS tracking data" };
  }
}

/**
 * Get real-time vehicle locations
 */
export async function getRealTimeVehicleLocations(vehicleIds?: number[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const conditions = [
      eq(gps_tracking_realtime.gpsStatus, 'active'),
    ];

    if (vehicleIds && vehicleIds.length > 0) {
      conditions.push(sql`vehicleId IN (${vehicleIds.join(',')})`);
    }

    // Get latest GPS data for each vehicle
    const latestGPS = await db
      .select({
        vehicle: {
          id: vehicles.id,
          registrationNumber: vehicles.registrationNumber,
          make: vehicles.make,
          model: vehicles.model,
          vehicleType: vehicles.vehicleType,
          capacity: vehicles.capacity,
        },
        gps: {
          id: gps_tracking_realtime.id,
          latitude: gps_tracking_realtime.latitude,
          longitude: gps_tracking_realtime.longitude,
          speed: gps_tracking_realtime.speed,
          heading: gps_tracking_realtime.heading,
          timestamp: gps_tracking_realtime.timestamp,
          ignitionStatus: gps_tracking_realtime.ignitionStatus,
          batteryLevel: gps_tracking_realtime.batteryLevel,
          fuelLevel: gps_tracking_realtime.fuelLevel,
          engineStatus: gps_tracking_realtime.engineStatus,
        },
        trip: {
          id: trips.id,
          routeId: trips.routeId,
          status: trips.status,
          departureTime: trips.departureTime,
        },
      })
      .from(gps_tracking_realtime)
      .innerJoin(vehicles, eq(gps_tracking_realtime.vehicleId, vehicles.id))
      .leftJoin(trips, eq(gps_tracking_realtime.tripId, trips.id))
      .where(and(...conditions))
      .orderBy(sql`FIELD(vehicleId, ${vehicleIds?.join(',') || vehicles.id})`, desc(gps_tracking_realtime.timestamp));

    // Group by vehicle and get only the latest record for each
    const vehicleLocations = latestGPS.reduce((acc: Record<number, any>, row) => {
      const timestamp = row.gps.timestamp ? new Date(row.gps.timestamp).getTime() : 0;
      const existingTimestamp = acc[row.vehicle.id]?.gps?.timestamp ? new Date(acc[row.vehicle.id].gps.timestamp).getTime() : 0;
      if (!acc[row.vehicle.id] || timestamp > existingTimestamp) {
        acc[row.vehicle.id] = row;
      }
      return acc;
    }, {});

    return {
      success: true,
      locations: Object.values(vehicleLocations),
    };

  } catch (error) {
    console.error("Get real-time vehicle locations error:", error);
    return { error: "Failed to get real-time vehicle locations" };
  }
}

/**
 * Create mobile app session
 */
export async function createMobileSession(data: z.infer<typeof MobileSessionSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = MobileSessionSchema.parse(data);

    // Deactivate existing sessions for this device
    await db
      .update(mobile_app_sessions)
      .set({ isActive: false })
      .where(and(
        eq(mobile_app_sessions.userId, session.user.id),
        eq(mobile_app_sessions.deviceId, validatedData.deviceId)
      ));

    // Create new session
    const [result] = await db.insert(mobile_app_sessions).values({
      userId: session.user.id,
      deviceType: validatedData.deviceType,
      deviceId: validatedData.deviceId,
      appVersion: validatedData.appVersion,
      pushToken: validatedData.pushToken,
      ipAddress: validatedData.ipAddress,
      userAgent: validatedData.userAgent,
      isActive: true,
      lastActive: new Date(),
    } as any);

    return {
      success: true,
      sessionId: result.insertId,
      message: "Mobile session created successfully",
    };

  } catch (error) {
    console.error("Create mobile session error:", error);
    return { success: false, error: "Failed to create mobile session" };
  }
}

/**
 * Process payment transaction
 */
export async function processPaymentTransaction(data: z.infer<typeof PaymentTransactionSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = PaymentTransactionSchema.parse(data);

    // Check if transaction reference already exists
    const [existing] = await db
      .select()
      .from(payment_transactions)
      .where(eq(payment_transactions.transactionReference, validatedData.transactionReference))
      .limit(1);

    if (existing) {
      return { success: false, error: "Transaction reference already exists" };
    }

    // Insert payment transaction
    const [result] = await db.insert(payment_transactions).values({
      transactionReference: validatedData.transactionReference,
      userId: session.user.id,
      transactionType: validatedData.transactionType,
      amount: validatedData.amount.toString(),
      currency: validatedData.currency,
      paymentMethod: validatedData.paymentMethod,
      paymentGateway: validatedData.paymentGateway,
      gatewayTransactionId: validatedData.gatewayTransactionId,
      status: 'pending',
      metadata: validatedData.metadata,
    } as any);

    return {
      success: true,
      transactionId: result.insertId,
      message: "Payment transaction created successfully",
    };

  } catch (error) {
    console.error("Process payment transaction error:", error);
    return { success: false, error: "Failed to process payment transaction" };
  }
}

/**
 * Send smart notification
 */
export async function sendSmartNotification(data: z.infer<typeof NotificationSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = NotificationSchema.parse(data);

    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, validatedData.userId))
      .limit(1);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Insert notification
    const [result] = await db.insert(smart_notifications).values({
      userId: validatedData.userId,
      notificationType: validatedData.notificationType,
      title: validatedData.title,
      message: validatedData.message,
      priority: validatedData.priority as any,
      channels: validatedData.channels,
      scheduledAt: validatedData.scheduledAt,
      status: validatedData.scheduledAt ? 'pending' : 'sent',
      sentAt: validatedData.scheduledAt ? null : new Date(),
      responseRequired: validatedData.responseRequired,
      metadata: validatedData.metadata,
    } as any);

    return {
      success: true,
      notificationId: result.insertId,
      message: "Smart notification created successfully",
    };

  } catch (error) {
    console.error("Send smart notification error:", error);
    return { success: false, error: "Failed to send smart notification" };
  }
}

/**
 * Track mobile app analytics event
 */
export async function trackMobileAppEvent(data: {
  eventType: string;
  screenName?: string;
  eventData?: any;
  deviceInfo?: any;
  sessionId?: string;
  sessionDuration?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const { eventType, screenName, eventData, deviceInfo, sessionId, sessionDuration } = data;

    // Insert analytics event
    const [result] = await db.insert(mobile_app_analytics).values({
      userId: session.user.id,
      sessionId: sessionId,
      eventType: eventType as any,
      screenName: screenName,
      eventData: eventData,
      deviceInfo: deviceInfo,
      appVersion: deviceInfo?.appVersion,
      timestamp: new Date(),
      sessionDuration: sessionDuration,
    } as any);

    return {
      success: true,
      eventId: result.insertId,
      message: "Mobile app event tracked successfully",
    };

  } catch (error) {
    console.error("Track mobile app event error:", error);
    return { success: false, error: "Failed to track mobile app event" };
  }
}

/**
 * Get AI-powered route optimization suggestions
 */
export async function getRouteOptimizations(routeId?: number, date?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const conditions = [];
    
    if (routeId) {
      conditions.push(eq(route_optimization.routeId, routeId));
    }
    
    if (date) {
      conditions.push(eq(route_optimization.optimizationDate, new Date(date)));
    }

    const optimizations = await db
      .select({
        optimization: route_optimization,
        route: {
          name: routes.name,
          code: routes.code,
          startPoint: routes.startPoint,
          endPoint: routes.endPoint,
          distance: routes.distance,
        },
      })
      .from(route_optimization)
      .leftJoin(routes, eq(route_optimization.routeId, routes.id))
      .where(and(...conditions))
      .orderBy(desc(route_optimization.optimizationDate));

    return {
      success: true,
      optimizations,
    };

  } catch (error) {
    console.error("Get route optimizations error:", error);
    return { error: "Failed to get route optimizations" };
  }
}

/**
 * Get AI-powered demand forecasts
 */
export async function getDemandForecasts(routeId?: number, dateFrom?: string, dateTo?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const conditions = [];
    
    if (routeId) {
      conditions.push(eq(demand_forecasting.routeId, routeId));
    }
    
    if (dateFrom) {
      conditions.push(gte(demand_forecasting.forecastDate, new Date(dateFrom)));
    }
    
    if (dateTo) {
      conditions.push(lte(demand_forecasting.forecastDate, new Date(dateTo)));
    }

    const forecasts = await db
      .select({
        forecast: demand_forecasting,
        route: {
          name: routes.name,
          code: routes.code,
        },
      })
      .from(demand_forecasting)
      .leftJoin(routes, eq(demand_forecasting.routeId, routes.id))
      .where(and(...conditions))
      .orderBy(desc(demand_forecasting.forecastDate));

    return {
      success: true,
      forecasts,
    };

  } catch (error) {
    console.error("Get demand forecasts error:", error);
    return { error: "Failed to get demand forecasts" };
  }
}

/**
 * Get AI-powered predictive maintenance alerts
 */
export async function getPredictiveMaintenanceAlerts(vehicleId?: number, urgencyLevel?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const conditions = [
      sql`status IN ('predicted', 'acknowledged', 'scheduled')`,
    ];
    
    if (vehicleId) {
      conditions.push(eq(predictive_maintenance_ai.vehicleId, vehicleId));
    }
    
    if (urgencyLevel) {
      conditions.push(eq(predictive_maintenance_ai.urgencyLevel, urgencyLevel as any));
    }

    const alerts = await db
      .select({
        alert: predictive_maintenance_ai,
        vehicle: {
          registrationNumber: vehicles.registrationNumber,
          make: vehicles.make,
          model: vehicles.model,
          vehicleType: vehicles.vehicleType,
        },
      })
      .from(predictive_maintenance_ai)
      .leftJoin(vehicles, eq(predictive_maintenance_ai.vehicleId, vehicles.id))
      .where(and(...conditions))
      .orderBy(sql`FIELD(urgencyLevel, 'critical', 'high', 'medium', 'low')`, desc(predictive_maintenance_ai.predictionDate));

    return {
      success: true,
      alerts,
    };

  } catch (error) {
    console.error("Get predictive maintenance alerts error:", error);
    return { error: "Failed to get predictive maintenance alerts" };
  }
}

/**
 * Get passenger behavior analytics
 */
export async function getPassengerBehaviorAnalytics(studentId?: number, routeId?: number, dateFrom?: string, dateTo?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const conditions = [];
    
    if (studentId) {
      conditions.push(eq(passenger_behavior_analytics.studentId, studentId));
    }
    
    if (routeId) {
      conditions.push(eq(passenger_behavior_analytics.routeId, routeId));
    }
    
    if (dateFrom) {
      conditions.push(gte(passenger_behavior_analytics.boardingTime, new Date(dateFrom)));
    }
    
    if (dateTo) {
      conditions.push(lte(passenger_behavior_analytics.boardingTime, new Date(dateTo)));
    }

    const analytics = await db
      .select({
        behavior: passenger_behavior_analytics,
        student: {
          firstName: students.firstName,
          lastName: students.lastName,
          matricNumber: students.matricNumber,
        },
        route: {
          name: routes.name,
          code: routes.code,
        },
      })
      .from(passenger_behavior_analytics)
      .leftJoin(students, eq(passenger_behavior_analytics.studentId, students.id))
      .leftJoin(routes, eq(passenger_behavior_analytics.routeId, routes.id))
      .where(and(...conditions))
      .orderBy(desc(passenger_behavior_analytics.boardingTime));

    return {
      success: true,
      analytics,
    };

  } catch (error) {
    console.error("Get passenger behavior analytics error:", error);
    return { error: "Failed to get passenger behavior analytics" };
  }
}

/**
 * Get mobile app usage analytics
 */
export async function getMobileAppAnalytics(filters: {
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  deviceType?: string;
  page?: number;
  limit?: number;
} = {}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const {
      eventType,
      dateFrom,
      dateTo,
      deviceType,
      page = 1,
      limit = 50,
    } = filters;

    const conditions = [];
    
    if (eventType) {
      conditions.push(eq(mobile_app_analytics.eventType, eventType as any));
    }
    
    if (dateFrom) {
      conditions.push(gte(mobile_app_analytics.timestamp, new Date(dateFrom)));
    }
    
    if (dateTo) {
      conditions.push(lte(mobile_app_analytics.timestamp, new Date(dateTo)));
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(mobile_app_analytics)
      .where(and(...conditions));

    const total = countResult.count;

    // Get analytics with pagination
    const offset = (page - 1) * limit;
    const analyticsData = await db
      .select({
        analytics: mobile_app_analytics,
        user: {
          name: sql<string>`(SELECT name FROM users WHERE id = ${mobile_app_analytics.userId})`,
        },
      })
      .from(mobile_app_analytics)
      .leftJoin(users, eq(mobile_app_analytics.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(mobile_app_analytics.timestamp))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      analytics: analyticsData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

  } catch (error) {
    console.error("Get mobile app analytics error:", error);
    return { error: "Failed to get mobile app analytics" };
  }
}

/**
 * Generate AI-powered insights summary
 */
export async function generateAIInsights() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get route optimization insights
    const [routeOptimizationStats] = await db
      .select({
        totalOptimizations: sql<number>`count(*)`.mapWith(Number),
        appliedOptimizations: sql<number>`sum(case when applied = true then 1 else 0 end)`.mapWith(Number),
        avgFuelSavings: sql<number>`avg(fuel_savings)`.mapWith(Number),
        avgTimeSavings: sql<number>`avg(time_savings)`.mapWith(Number),
        totalFuelSavings: sql<number>`sum(fuel_savings)`.mapWith(Number),
      })
      .from(route_optimization)
      .where(and(
        gte(route_optimization.optimizationDate, lastWeek),
        lte(route_optimization.optimizationDate, today)
      ));

    // Get demand forecasting accuracy
    const [forecastAccuracyStats] = await db
      .select({
        totalForecasts: sql<number>`count(*)`.mapWith(Number),
        avgAccuracy: sql<number>`avg(accuracy)`.mapWith(Number),
        avgConfidence: sql<number>`avg(confidence_level)`.mapWith(Number),
      })
      .from(demand_forecasting)
      .where(and(
        gte(demand_forecasting.forecastDate, lastWeek),
        lte(demand_forecasting.forecastDate, today),
        sql`accuracy IS NOT NULL`
      ));

    // Get predictive maintenance insights
    const [maintenanceInsights] = await db
      .select({
        totalPredictions: sql<number>`count(*)`.mapWith(Number),
        criticalPredictions: sql<number>`sum(case when urgency_level = 'critical' then 1 else 0 end)`.mapWith(Number),
        resolvedPredictions: sql<number>`sum(case when status = 'resolved' then 1 else 0 end)`.mapWith(Number),
        avgConfidence: sql<number>`avg(confidence_score)`.mapWith(Number),
        estimatedCostSavings: sql<number>`sum(estimated_cost)`.mapWith(Number),
      })
      .from(predictive_maintenance_ai)
      .where(and(
        gte(predictive_maintenance_ai.predictionDate, lastWeek),
        lte(predictive_maintenance_ai.predictionDate, today)
      ));

    // Get passenger behavior insights
    const [behaviorInsights] = await db
      .select({
        totalJourneys: sql<number>`count(*)`.mapWith(Number),
        avgSatisfaction: sql<number>`avg(satisfaction_score)`.mapWith(Number),
        avgLoyalty: sql<number>`avg(loyalty_score)`.mapWith(Number),
        mobileAppUsage: sql<number>`sum(case when device_type = 'mobile_app' then 1 else 0 end)`.mapWith(Number),
        qrCardUsage: sql<number>`sum(case when device_type = 'qr_card' then 1 else 0 end)`.mapWith(Number),
      })
      .from(passenger_behavior_analytics)
      .where(and(
        gte(passenger_behavior_analytics.boardingTime, new Date(lastWeek)),
        lte(passenger_behavior_analytics.boardingTime, new Date(today))
      ));

    // Get mobile app usage insights
    const [appUsageInsights] = await db
      .select({
        totalEvents: sql<number>`count(*)`.mapWith(Number),
        uniqueUsers: sql<number>`count(DISTINCT userId)`.mapWith(Number),
        avgSessionDuration: sql<number>`avg(sessionDuration)`.mapWith(Number),
        appOpens: sql<number>`sum(case when eventType = 'app_open' then 1 else 0 end)`.mapWith(Number),
        qrScans: sql<number>`sum(case when eventType = 'qr_scan' then 1 else 0 end)`.mapWith(Number),
        payments: sql<number>`sum(case when eventType = 'payment_attempt' then 1 else 0 end)`.mapWith(Number),
      })
      .from(mobile_app_analytics)
      .where(and(
        gte(mobile_app_analytics.timestamp, new Date(lastWeek)),
        lte(mobile_app_analytics.timestamp, new Date(today))
      ));

    return {
      success: true,
      period: {
        from: lastWeek,
        to: today,
      },
      insights: {
        routeOptimization: routeOptimizationStats,
        demandForecasting: forecastAccuracyStats,
        predictiveMaintenance: maintenanceInsights,
        passengerBehavior: behaviorInsights,
        mobileAppUsage: appUsageInsights,
      },
      recommendations: [
        "Consider expanding mobile app features based on high usage rates",
        "Focus on critical maintenance predictions to prevent breakdowns",
        "Optimize routes during peak hours based on demand forecasts",
        "Improve passenger satisfaction through personalized notifications",
        "Increase QR card adoption for faster boarding",
      ],
    };

  } catch (error) {
    console.error("Generate AI insights error:", error);
    return { success: false, error: "Failed to generate AI insights" };
  }
}
