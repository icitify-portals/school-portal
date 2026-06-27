import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { StudentAffairsService } from "@/services/StudentAffairsService";
import { db } from "@/db/db";
import { 
  studentAffairsClubs, 
  studentAffairsClubMembers, 
  studentAffairsEvents,
  studentAffairsEventRegistrations
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import AdminStudentAffairsClient from "./AdminStudentAffairsClient";

export const dynamic = "force-dynamic";

export default async function AdminStudentAffairsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Guard: User must have student affairs permission or be system admin
  const isAuthorized = await hasPermission("student_affairs.event.manage");
  if (!isAuthorized) {
    redirect("/");
  }

  // Fetch KPI statistics
  const [orgCountObj] = await db.select({ count: sql<number>`count(*)` }).from(studentAffairsClubs);
  const [memberCountObj] = await db.select({ count: sql<number>`count(*)` })
    .from(studentAffairsClubMembers)
    .where(sql`role != 'pending'`);
  const [eventCountObj] = await db.select({ count: sql<number>`count(*)` })
    .from(studentAffairsEvents)
    .where(eq(studentAffairsEvents.status, 'scheduled'));

  const revenueResult = await db.select({
    revenue: sql<string>`sum(cast(${studentAffairsEvents.fee} as decimal(12,2)))`
  })
  .from(studentAffairsEventRegistrations)
  .innerJoin(studentAffairsEvents, eq(studentAffairsEventRegistrations.eventId, studentAffairsEvents.id))
  .where(
    and(
      eq(studentAffairsEventRegistrations.paymentStatus, 'paid'),
      eq(studentAffairsEventRegistrations.status, 'registered')
    )
  );

  const stats = {
    totalOrganizations: orgCountObj?.count || 0,
    activeMembers: memberCountObj?.count || 0,
    scheduledEvents: eventCountObj?.count || 0,
    totalRevenue: Number(revenueResult[0]?.revenue || 0)
  };

  // Fetch data logs
  const rawEvents = await StudentAffairsService.getEvents();
  const events = rawEvents.map(e => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    createdAt: e.createdAt ? e.createdAt.toISOString() : null
  }));

  const rawClubs = await StudentAffairsService.getClubs();
  const clubs = rawClubs.map(c => ({
    ...c,
    createdAt: c.createdAt ? c.createdAt.toISOString() : null
  }));

  const rawBulletins = await StudentAffairsService.getBulletins(false); // get both drafts & published
  const bulletins = rawBulletins.map(b => ({
    ...b,
    publishedAt: b.publishedAt ? b.publishedAt.toISOString() : null,
    createdAt: b.createdAt ? b.createdAt.toISOString() : null
  }));

  return (
    <AdminStudentAffairsClient
      stats={stats}
      events={events}
      clubs={clubs}
      bulletins={bulletins}
    />
  );
}
