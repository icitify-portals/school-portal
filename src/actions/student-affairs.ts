"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/rbac";
import { StudentAffairsService } from "@/services/StudentAffairsService";
import { db } from "@/db/db";
import { studentAffairsClubMembers, studentAffairsClubs } from "@/db/schema";
import { eq } from "drizzle-orm";

// Helper to check user session
async function getUserIdFromSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return Number(session.user.id);
}

// ==========================================
// EVENTS MANAGEMENT ACTIONS
// ==========================================

export async function createEventAction(data: {
  title: string;
  description: string;
  location: string;
  startDate: string; // Parse as Date
  endDate: string; // Parse as Date
  capacity?: number;
  isPaid: boolean;
  fee?: number;
}) {
  try {
    const isAuthorized = await hasPermission("student_affairs.event.manage");
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: You do not have permission to manage events." };
    }

    const userId = await getUserIdFromSession();
    const result = await StudentAffairsService.createEvent({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdBy: userId
    });

    revalidatePath("/events");
    revalidatePath("/admin/student-affairs");
    revalidatePath("/student/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create event" };
  }
}

export async function registerForEventAction(eventId: number) {
  try {
    const userId = await getUserIdFromSession();
    const result = await StudentAffairsService.registerForEvent(eventId, userId);
    
    revalidatePath("/events");
    revalidatePath("/student/student-affairs");
    revalidatePath("/admin/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register for event" };
  }
}

export async function cancelRegistrationAction(registrationId: number) {
  try {
    const userId = await getUserIdFromSession();
    const result = await StudentAffairsService.cancelRegistration(registrationId, userId);

    revalidatePath("/events");
    revalidatePath("/student/student-affairs");
    revalidatePath("/admin/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to cancel registration" };
  }
}

export async function confirmEventPaymentAction(transactionId: number) {
  try {
    // Basic verification: user must be logged in
    await getUserIdFromSession();
    const result = await StudentAffairsService.confirmEventPayment(transactionId);

    revalidatePath("/events");
    revalidatePath("/student/student-affairs");
    revalidatePath("/admin/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to confirm payment" };
  }
}

export async function getAttendeeRosterAction(eventId: number) {
  try {
    const isAuthorized = await hasPermission("student_affairs.event.manage");
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: You do not have permission to view rosters." };
    }

    const roster = await StudentAffairsService.getAttendeeRoster(eventId);
    return { success: true, roster };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to retrieve attendee roster" };
  }
}

// ==========================================
// CLUBS ACTIONS
// ==========================================

export async function createClubAction(data: {
  name: string;
  description: string;
  category: string;
  logoUrl?: string;
}) {
  try {
    const userId = await getUserIdFromSession();
    const result = await StudentAffairsService.createClub({
      ...data,
      presidentId: userId
    });

    revalidatePath("/student/student-affairs");
    revalidatePath("/admin/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to request club registration" };
  }
}

export async function approveClubAction(clubId: number, approve: boolean) {
  try {
    const isAuthorized = await hasPermission("student_affairs.club.approve");
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: You do not have permission to approve organizations." };
    }

    const result = await StudentAffairsService.approveClub(clubId, approve);
    
    revalidatePath("/student/student-affairs");
    revalidatePath("/admin/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to approve/reject club" };
  }
}

export async function joinClubRequestAction(clubId: number) {
  try {
    const userId = await getUserIdFromSession();
    const result = await StudentAffairsService.joinClubRequest(clubId, userId);
    
    revalidatePath("/student/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to request membership" };
  }
}

export async function approveClubMemberAction(memberId: number, approve: boolean) {
  try {
    const userId = await getUserIdFromSession();
    
    // Authorization check: Is the user a Student Affairs Officer, or the president of the club?
    const isOfficer = await hasPermission("student_affairs.club.approve");
    let isPresident = false;

    if (!isOfficer) {
      // Find the club ID for this member record
      const [memberRecord] = await db.select()
        .from(studentAffairsClubMembers)
        .where(eq(studentAffairsClubMembers.id, memberId))
        .limit(1);

      if (memberRecord) {
        const [clubRecord] = await db.select()
          .from(studentAffairsClubs)
          .where(eq(studentAffairsClubs.id, memberRecord.clubId))
          .limit(1);

        if (clubRecord && clubRecord.presidentId === userId) {
          isPresident = true;
        }
      }
    }

    if (!isOfficer && !isPresident) {
      return { success: false, error: "Unauthorized: Only Club Presidents or Student Affairs Officers can manage members." };
    }

    const result = await StudentAffairsService.approveClubMember(memberId, approve);
    
    revalidatePath("/student/student-affairs");
    revalidatePath("/admin/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update member status" };
  }
}

// ==========================================
// BULLETINS ACTIONS
// ==========================================

export async function createBulletinAction(data: {
  title: string;
  content: string;
  category: 'academic' | 'social' | 'sports' | 'announcement';
  status: 'draft' | 'published';
}) {
  try {
    const isAuthorized = await hasPermission("student_affairs.bulletin.manage");
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: You do not have permission to manage bulletins." };
    }

    const userId = await getUserIdFromSession();
    const result = await StudentAffairsService.createBulletin({
      ...data,
      authorId: userId
    });

    revalidatePath("/student/student-affairs");
    revalidatePath("/admin/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create bulletin" };
  }
}

export async function publishBulletinAction(bulletinId: number) {
  try {
    const isAuthorized = await hasPermission("student_affairs.bulletin.manage");
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: You do not have permission to publish bulletins." };
    }

    const result = await StudentAffairsService.publishBulletin(bulletinId);
    
    revalidatePath("/student/student-affairs");
    revalidatePath("/admin/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to publish bulletin" };
  }
}

// ==========================================
// TICKET QR CODE ACTIONS
// ==========================================

export async function generateEventTicketQRAction(registrationId: number) {
  try {
    const userId = await getUserIdFromSession();
    return await StudentAffairsService.generateEventTicketQR(registrationId, userId);
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate ticket QR" };
  }
}

export async function verifyTicketAndCheckInAction(qrContent: string) {
  try {
    const isAuthorized = await hasPermission("student_affairs.event.manage");
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: You do not have permission to scan tickets." };
    }

    const result = await StudentAffairsService.verifyTicketAndCheckIn(qrContent);

    revalidatePath("/admin/student-affairs");
    revalidatePath("/student/student-affairs");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to process scan check-in" };
  }
}
