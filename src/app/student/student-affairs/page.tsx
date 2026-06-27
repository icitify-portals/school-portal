import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentAffairsService } from "@/services/StudentAffairsService";
import { db } from "@/db/db";
import { students, studentAffairsClubs, studentAffairsClubMembers, users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import StudentAffairsClient from "./StudentAffairsClient";

export const dynamic = "force-dynamic";

export default async function StudentAffairsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (userRole !== 'student') {
    redirect("/");
  }

  const userId = Number(session.user.id);

  // 1. Fetch registrations
  const registeredEvents = await StudentAffairsService.getUserRegistrations(userId);

  // 2. Fetch bulletins
  const bulletins = await StudentAffairsService.getBulletins(true);

  // 3. Fetch clubs
  const allClubs = await StudentAffairsService.getClubs();
  const userClubs = await StudentAffairsService.getUserClubs(userId);

  // 4. Fetch president approval requests
  // Find clubs where current user is president
  const presidentClubs = await db.select({ id: studentAffairsClubs.id })
    .from(studentAffairsClubs)
    .where(eq(studentAffairsClubs.presidentId, userId));

  let pendingMembersToApprove: any[] = [];
  
  if (presidentClubs.length > 0) {
    const clubIds = presidentClubs.map(c => c.id);
    pendingMembersToApprove = await db.select({
      id: studentAffairsClubMembers.id,
      studentId: students.id,
      name: users.name,
      email: users.email,
      matricNumber: students.matricNumber,
      role: studentAffairsClubMembers.role,
      joinedAt: studentAffairsClubMembers.joinedAt
    })
    .from(studentAffairsClubMembers)
    .innerJoin(students, eq(studentAffairsClubMembers.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .where(
      and(
        inArray(studentAffairsClubMembers.clubId, clubIds),
        eq(studentAffairsClubMembers.role, 'pending')
      )
    );
  }

  return (
    <StudentAffairsClient
      session={session}
      registeredEvents={registeredEvents}
      bulletins={bulletins}
      allClubs={allClubs}
      userClubs={userClubs}
      pendingMembersToApprove={pendingMembersToApprove}
    />
  );
}
