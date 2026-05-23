"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { visitors, visitor_access_log, visitor_destinations, users, faculties, departments, institutionalUnits } from "@/db/schema";
import { eq, and, desc, sql, gte, lte, like, count, sum } from "drizzle-orm";
import { z } from "zod";

// Report schema validation
const VisitorReportSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  destinationType: z.string().optional(),
  status: z.string().optional(),
  hostDepartment: z.string().optional(),
});

/**
 * Get comprehensive visitor report for a specific day
 */
export async function getDailyVisitorReport(date: string = new Date().toISOString().split('T')[0]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const startDate = new Date(date + 'T00:00:00');
    const endDate = new Date(date + 'T23:59:59');

    // 1. Total visitors for the day
    const [totalStats] = await db
      .select({
        totalVisitors: sql<number>`count(*)`.mapWith(Number),
        scheduled: sql<number>`sum(case when status = 'scheduled' then 1 else 0 end)`.mapWith(Number),
        checkedIn: sql<number>`sum(case when status = 'checked_in' then 1 else 0 end)`.mapWith(Number),
        checkedOut: sql<number>`sum(case when status = 'checked_out' then 1 else 0 end)`.mapWith(Number),
        cancelled: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate)
      ));

    // 2. Current visitors still inside (checked_in)
    const [insideStats] = await db
      .select({
        totalInside: sql<number>`count(*)`.mapWith(Number),
        avgDuration: sql<number>`avg(TIMESTAMPDIFF(MINUTE, actualCheckIn, NOW()))`.mapWith(Number),
        longestStay: sql<number>`max(TIMESTAMPDIFF(MINUTE, actualCheckIn, NOW()))`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        eq(visitors.status, 'checked_in'),
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate)
      ));

    // 3. Visitors by destination (where they are)
    const destinationStats = await db
      .select({
        destinationType: visitors.destinationType,
        destinationName: visitors.destinationName,
        totalVisitors: sql<number>`count(*)`.mapWith(Number),
        checkedIn: sql<number>`sum(case when status = 'checked_in' then 1 else 0 end)`.mapWith(Number),
        checkedOut: sql<number>`sum(case when status = 'checked_out' then 1 else 0 end)`.mapWith(Number),
        scheduled: sql<number>`sum(case when status = 'scheduled' then 1 else 0 end)`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate)
      ))
      .groupBy(visitors.destinationType, visitors.destinationName)
      .orderBy(sql`count(*) desc`);

    // 4. Visitors by time of day (hourly breakdown)
    const hourlyStats = await db
      .select({
        hour: sql<number>`HOUR(actualCheckIn)`.mapWith(Number),
        checkIns: sql<number>`count(*)`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        eq(visitors.status, 'checked_in'),
        gte(visitors.actualCheckIn, startDate),
        lte(visitors.actualCheckIn, endDate)
      ))
      .groupBy(sql`HOUR(actualCheckIn)`)
      .orderBy(sql`HOUR(actualCheckIn)`);

    // 5. Host department statistics
    const hostStats = await db
      .select({
        hostDepartment: visitors.hostDepartment,
        totalVisitors: sql<number>`count(*)`.mapWith(Number),
        checkedIn: sql<number>`sum(case when status = 'checked_in' then 1 else 0 end)`.mapWith(Number),
        checkedOut: sql<number>`sum(case when status = 'checked_out' then 1 else 0 end)`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate),
        sql`${visitors.hostDepartment} IS NOT NULL`
      ))
      .groupBy(visitors.hostDepartment)
      .orderBy(sql`count(*) desc`);

    // 6. Current visitors with details (who is still inside)
    const currentVisitors = await db
      .select({
        id: visitors.id,
        firstName: visitors.firstName,
        lastName: visitors.lastName,
        email: visitors.email,
        phone: visitors.phone,
        company: visitors.company,
        purpose: visitors.purpose,
        destinationType: visitors.destinationType,
        destinationName: visitors.destinationName,
        hostName: visitors.hostName,
        hostDepartment: visitors.hostDepartment,
        hostPhone: visitors.hostPhone,
        actualCheckIn: visitors.actualCheckIn,
        expectedCheckOut: visitors.expectedCheckOut,
        duration: sql<number>`TIMESTAMPDIFF(MINUTE, actualCheckIn, NOW())`.mapWith(Number),
        photoUrl: visitors.photoUrl,
      })
      .from(visitors)
      .where(and(
        eq(visitors.status, 'checked_in'),
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate)
      ))
      .orderBy(visitors.actualCheckIn);

    // 7. Recent check-outs (who left)
    const recentCheckOuts = await db
      .select({
        id: visitors.id,
        firstName: visitors.firstName,
        lastName: visitors.lastName,
        destinationName: visitors.destinationName,
        hostName: visitors.hostName,
        actualCheckIn: visitors.actualCheckIn,
        actualCheckOut: visitors.actualCheckOut,
        duration: sql<number>`TIMESTAMPDIFF(MINUTE, actualCheckIn, actualCheckOut)`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        eq(visitors.status, 'checked_out'),
        gte(visitors.actualCheckOut, startDate),
        lte(visitors.actualCheckOut, endDate)
      ))
      .orderBy(desc(visitors.actualCheckOut))
      .limit(20);

    // 8. Overstayed visitors alert
    const overstayedVisitors = await db
      .select({
        id: visitors.id,
        firstName: visitors.firstName,
        lastName: visitors.lastName,
        destinationName: visitors.destinationName,
        hostName: visitors.hostName,
        expectedCheckOut: visitors.expectedCheckOut,
        actualCheckIn: visitors.actualCheckIn,
        overstayMinutes: sql<number>`TIMESTAMPDIFF(MINUTE, expectedCheckOut, NOW())`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        eq(visitors.status, 'checked_in'),
        sql`${visitors.expectedCheckOut} < NOW()`,
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate)
      ))
      .orderBy(sql`TIMESTAMPDIFF(MINUTE, expectedCheckOut, NOW()) desc`);

    return {
      success: true,
      reportDate: date,
      summary: {
        total: totalStats[0],
        currentlyInside: insideStats[0],
      },
      destinationBreakdown: destinationStats,
      hourlyBreakdown: hourlyStats,
      hostDepartmentBreakdown: hostStats,
      currentVisitors,
      recentCheckOuts,
      overstayedVisitors,
    };

  } catch (error) {
    console.error("Daily visitor report error:", error);
    return { error: "Failed to generate visitor report" };
  }
}

/**
 * Get visitor statistics for date range
 */
export async function getVisitorStatsRange(dateFrom: string, dateTo: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const startDate = new Date(dateFrom + 'T00:00:00');
    const endDate = new Date(dateTo + 'T23:59:59');

    // Daily statistics for the range
    const dailyStats = await db
      .select({
        date: sql<string>`DATE(expectedCheckIn)`.mapWith(String),
        totalVisitors: sql<number>`count(*)`.mapWith(Number),
        checkedIn: sql<number>`sum(case when status = 'checked_in' then 1 else 0 end)`.mapWith(Number),
        checkedOut: sql<number>`sum(case when status = 'checked_out' then 1 else 0 end)`.mapWith(Number),
        scheduled: sql<number>`sum(case when status = 'scheduled' then 1 else 0 end)`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate)
      ))
      .groupBy(sql`DATE(expectedCheckIn)`)
      .orderBy(sql`DATE(expectedCheckIn)`);

    // Peak days analysis
    const peakDays = await db
      .select({
        date: sql<string>`DATE(expectedCheckIn)`.mapWith(String),
        visitorCount: sql<number>`count(*)`.mapWith(Number),
        peakHour: sql<number>`HOUR(actualCheckIn)`.mapWith(Number),
        peakHourCount: sql<number>`count(*)`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate),
        eq(visitors.status, 'checked_in')
      ))
      .groupBy(sql`DATE(expectedCheckIn)`, sql`HOUR(actualCheckIn)`)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    return {
      success: true,
      dateRange: { dateFrom, dateTo },
      dailyStatistics: dailyStats,
      peakDays,
    };

  } catch (error) {
    console.error("Visitor stats range error:", error);
    return { error: "Failed to get visitor statistics" };
  }
}

/**
 * Get real-time visitor dashboard data
 */
export async function getRealTimeVisitorDashboard() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const today = new Date().toISOString().split('T')[0];
    const startDate = new Date(today + 'T00:00:00');
    const endDate = new Date(today + 'T23:59:59');

    // Real-time counts
    const [realTimeStats] = await db
      .select({
        totalToday: sql<number>`count(*)`.mapWith(Number),
        currentlyInside: sql<number>`sum(case when status = 'checked_in' then 1 else 0 end)`.mapWith(Number),
        checkedOutToday: sql<number>`sum(case when status = 'checked_out' then 1 else 0 end)`.mapWith(Number),
        scheduledToday: sql<number>`sum(case when status = 'scheduled' then 1 else 0 end)`.mapWith(Number),
        averageDuration: sql<number>`avg(TIMESTAMPDIFF(MINUTE, actualCheckIn, actualCheckOut))`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate)
      ));

    // Current locations breakdown
    const locationBreakdown = await db
      .select({
        destinationName: visitors.destinationName,
        destinationType: visitors.destinationType,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(visitors)
      .where(and(
        eq(visitors.status, 'checked_in'),
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate)
      ))
      .groupBy(visitors.destinationName, visitors.destinationType)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    // Recent activity (last 10 check-ins)
    const recentActivity = await db
      .select({
        id: visitors.id,
        firstName: visitors.firstName,
        lastName: visitors.lastName,
        destinationName: visitors.destinationName,
        actualCheckIn: visitors.actualCheckIn,
        status: visitors.status,
      })
      .from(visitors)
      .where(and(
        gte(visitors.expectedCheckIn, startDate),
        lte(visitors.expectedCheckIn, endDate)
      ))
      .orderBy(desc(visitors.actualCheckIn))
      .limit(10);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      realTimeStats: realTimeStats[0],
      locationBreakdown,
      recentActivity,
    };

  } catch (error) {
    console.error("Real-time dashboard error:", error);
    return { error: "Failed to get real-time data" };
  }
}

/**
 * Export visitor data to CSV
 */
export async function exportVisitorData(filters: z.infer<typeof VisitorReportSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const validatedFilters = VisitorReportSchema.parse(filters);
    
    let conditions = [];
    
    if (validatedFilters.dateFrom) {
      conditions.push(gte(visitors.expectedCheckIn, new Date(validatedFilters.dateFrom + 'T00:00:00')));
    }
    
    if (validatedFilters.dateTo) {
      conditions.push(lte(visitors.expectedCheckIn, new Date(validatedFilters.dateTo + 'T23:59:59')));
    }
    
    if (validatedFilters.status) {
      conditions.push(eq(visitors.status, validatedFilters.status));
    }
    
    if (validatedFilters.destinationType) {
      conditions.push(eq(visitors.destinationType, validatedFilters.destinationType));
    }

    const visitorData = await db
      .select({
        id: visitors.id,
        firstName: visitors.firstName,
        lastName: visitors.lastName,
        email: visitors.email,
        phone: visitors.phone,
        company: visitors.company,
        purpose: visitors.purpose,
        destinationType: visitors.destinationType,
        destinationName: visitors.destinationName,
        hostName: visitors.hostName,
        hostTitle: visitors.hostTitle,
        hostDepartment: visitors.hostDepartment,
        hostPhone: visitors.hostPhone,
        hostEmail: visitors.hostEmail,
        expectedCheckIn: visitors.expectedCheckIn,
        expectedCheckOut: visitors.expectedCheckOut,
        actualCheckIn: visitors.actualCheckIn,
        actualCheckOut: visitors.actualCheckOut,
        status: visitors.status,
        createdAt: visitors.createdAt,
      })
      .from(visitors)
      .where(and(...conditions))
      .orderBy(desc(visitors.expectedCheckIn));

    // Convert to CSV
    const headers = [
      'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Company',
      'Purpose', 'Destination Type', 'Destination Name', 'Host Name',
      'Host Title', 'Host Department', 'Host Phone', 'Host Email',
      'Expected Check In', 'Expected Check Out', 'Actual Check In',
      'Actual Check Out', 'Status', 'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...visitorData.map(row => [
        row.id,
        row.firstName,
        row.lastName,
        row.email || '',
        row.phone || '',
        row.company || '',
        `"${row.purpose}"`,
        row.destinationType,
        row.destinationName,
        row.hostName,
        row.hostTitle || '',
        row.hostDepartment || '',
        row.hostPhone || '',
        row.hostEmail || '',
        row.expectedCheckIn ? new Date(row.expectedCheckIn).toISOString() : '',
        row.expectedCheckOut ? new Date(row.expectedCheckOut).toISOString() : '',
        row.actualCheckIn ? new Date(row.actualCheckIn).toISOString() : '',
        row.actualCheckOut ? new Date(row.actualCheckOut).toISOString() : '',
        row.status,
        new Date(row.createdAt).toISOString()
      ].join(','))
    ].join('\n');

    return {
      success: true,
      csvData: csvContent,
      filename: `visitor_report_${new Date().toISOString().split('T')[0]}.csv`,
    };

  } catch (error) {
    console.error("Export visitor data error:", error);
    return { error: "Failed to export visitor data" };
  }
}
