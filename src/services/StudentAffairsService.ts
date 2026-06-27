import { db } from "@/db/db";
import { 
  studentAffairsEvents, 
  studentAffairsEventRegistrations, 
  studentAffairsClubs, 
  studentAffairsClubMembers, 
  studentAffairsBulletins,
  users,
  students,
  programmes,
  transactions
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { InstitutionalUtilsService } from "@/services/InstitutionalUtilsService";

export class StudentAffairsService {
  // ==========================================
  // EVENTS MANAGEMENT
  // ==========================================

  static async createEvent(data: {
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
    createdBy: number;
    capacity?: number;
    isPaid: boolean;
    fee?: number;
  }) {
    try {
      const [result] = await db.insert(studentAffairsEvents).values({
        title: data.title,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        createdBy: data.createdBy,
        capacity: data.capacity || null,
        isPaid: data.isPaid,
        fee: data.isPaid && data.fee ? String(data.fee) : null,
        status: 'scheduled'
      });
      return { success: true, eventId: result.insertId };
    } catch (error: any) {
      console.error("Failed to create event:", error);
      throw new Error(error.message || "Failed to create event");
    }
  }

  static async getEvents(onlyScheduled = false) {
    try {
      const query = db.select({
        id: studentAffairsEvents.id,
        title: studentAffairsEvents.title,
        description: studentAffairsEvents.description,
        location: studentAffairsEvents.location,
        startDate: studentAffairsEvents.startDate,
        endDate: studentAffairsEvents.endDate,
        capacity: studentAffairsEvents.capacity,
        isPaid: studentAffairsEvents.isPaid,
        fee: studentAffairsEvents.fee,
        status: studentAffairsEvents.status,
        createdAt: studentAffairsEvents.createdAt,
        creatorName: users.name,
        registeredCount: sql<number>`(SELECT COALESCE(COUNT(*), 0) FROM student_affairs_event_registrations WHERE event_id = ${studentAffairsEvents.id} AND status = 'registered')`
      })
      .from(studentAffairsEvents)
      .innerJoin(users, eq(studentAffairsEvents.createdBy, users.id));

      if (onlyScheduled) {
        return await query.where(eq(studentAffairsEvents.status, 'scheduled')).orderBy(desc(studentAffairsEvents.startDate));
      }

      return await query.orderBy(desc(studentAffairsEvents.startDate));
    } catch (error: any) {
      console.error("Failed to get events:", error);
      throw new Error(error.message || "Failed to retrieve events");
    }
  }

  static async getEventById(eventId: number) {
    try {
      const [event] = await db.select({
        id: studentAffairsEvents.id,
        title: studentAffairsEvents.title,
        description: studentAffairsEvents.description,
        location: studentAffairsEvents.location,
        startDate: studentAffairsEvents.startDate,
        endDate: studentAffairsEvents.endDate,
        capacity: studentAffairsEvents.capacity,
        isPaid: studentAffairsEvents.isPaid,
        fee: studentAffairsEvents.fee,
        status: studentAffairsEvents.status,
        createdAt: studentAffairsEvents.createdAt,
        createdBy: studentAffairsEvents.createdBy,
        creatorName: users.name
      })
      .from(studentAffairsEvents)
      .innerJoin(users, eq(studentAffairsEvents.createdBy, users.id))
      .where(eq(studentAffairsEvents.id, eventId))
      .limit(1);

      return event || null;
    } catch (error: any) {
      console.error("Failed to get event by ID:", error);
      throw new Error(error.message || "Failed to retrieve event");
    }
  }

  static async registerForEvent(eventId: number, userId: number) {
    try {
      // 1. Check if event exists
      const event = await this.getEventById(eventId);
      if (!event) {
        return { success: false, error: "Event not found" };
      }

      if (event.status !== 'scheduled') {
        return { success: false, error: "Registration is not open for this event" };
      }

      // 2. Check if already registered
      const [existingReg] = await db.select()
        .from(studentAffairsEventRegistrations)
        .where(
          and(
            eq(studentAffairsEventRegistrations.eventId, eventId),
            eq(studentAffairsEventRegistrations.userId, userId),
            eq(studentAffairsEventRegistrations.status, 'registered')
          )
        )
        .limit(1);

      if (existingReg) {
        return { success: false, error: "You are already registered for this event" };
      }

      // 3. Check capacity
      if (event.capacity) {
        const [regCountObj] = await db.select({
          count: sql<number>`count(*)`
        })
        .from(studentAffairsEventRegistrations)
        .where(
          and(
            eq(studentAffairsEventRegistrations.eventId, eventId),
            eq(studentAffairsEventRegistrations.status, 'registered')
          )
        );

        const regCount = regCountObj?.count || 0;
        if (regCount >= event.capacity) {
          return { success: false, error: "Event has reached maximum capacity" };
        }
      }

      // 4. Get studentId if the registering user is a student
      const [student] = await db.select({ id: students.id })
        .from(students)
        .where(eq(students.userId, userId))
        .limit(1);

      const studentId = student?.id || null;

      // 5. Handle Payment vs Free registration
      if (event.isPaid && event.fee) {
        const feeAmount = event.fee;
        
        // Start a Transaction for creating both transaction & registration
        return await db.transaction(async (tx) => {
          // A. Insert pending transaction
          const [txResult] = await tx.insert(transactions).values({
            studentId: studentId, // Can be null if staff
            amount: feeAmount,
            type: 'debit',
            purpose: `Event Registration: ${event.title}`,
            status: 'pending',
            gateway: 'remita', // default gateway
          });
          const transactionId = txResult.insertId;

          // B. Insert pending registration
          const [regResult] = await tx.insert(studentAffairsEventRegistrations).values({
            eventId,
            userId,
            status: 'registered',
            paymentStatus: 'pending',
            transactionId
          });

          return { 
            success: true, 
            registrationId: regResult.insertId, 
            isPaid: true, 
            fee: feeAmount,
            transactionId 
          };
        });
      } else {
        // Free event registration
        const [regResult] = await db.insert(studentAffairsEventRegistrations).values({
          eventId,
          userId,
          status: 'registered',
          paymentStatus: 'no_payment_required',
          transactionId: null
        });

        return { 
          success: true, 
          registrationId: regResult.insertId, 
          isPaid: false 
        };
      }
    } catch (error: any) {
      console.error("Failed to register for event:", error);
      return { success: false, error: error.message || "Failed to process registration" };
    }
  }

  static async cancelRegistration(registrationId: number, userId: number) {
    try {
      const [reg] = await db.select()
        .from(studentAffairsEventRegistrations)
        .where(eq(studentAffairsEventRegistrations.id, registrationId))
        .limit(1);

      if (!reg) {
        return { success: false, error: "Registration record not found" };
      }

      if (reg.userId !== userId) {
        return { success: false, error: "Unauthorized to cancel this registration" };
      }

      await db.update(studentAffairsEventRegistrations)
        .set({ status: 'cancelled' })
        .where(eq(studentAffairsEventRegistrations.id, registrationId));

      return { success: true };
    } catch (error: any) {
      console.error("Failed to cancel registration:", error);
      return { success: false, error: error.message || "Failed to cancel registration" };
    }
  }

  static async confirmEventPayment(transactionId: number) {
    try {
      await db.transaction(async (tx) => {
        // Update transaction status
        await tx.update(transactions)
          .set({ status: 'completed' })
          .where(eq(transactions.id, transactionId));

        // Update event registration payment status
        await tx.update(studentAffairsEventRegistrations)
          .set({ paymentStatus: 'paid' })
          .where(eq(studentAffairsEventRegistrations.transactionId, transactionId));
      });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to confirm event payment:", error);
      return { success: false, error: error.message || "Failed to confirm payment" };
    }
  }

  static async getAttendeeRoster(eventId: number) {
    try {
      const roster = await db.select({
        registrationId: studentAffairsEventRegistrations.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        matricNumber: students.matricNumber,
        admissionNumber: students.admissionNumber,
        programmeName: programmes.name,
        programmeId: programmes.id,
        registeredAt: studentAffairsEventRegistrations.registeredAt,
        status: studentAffairsEventRegistrations.status,
        paymentStatus: studentAffairsEventRegistrations.paymentStatus,
        fee: studentAffairsEvents.fee,
        transactionId: studentAffairsEventRegistrations.transactionId
      })
      .from(studentAffairsEventRegistrations)
      .innerJoin(users, eq(studentAffairsEventRegistrations.userId, users.id))
      .innerJoin(studentAffairsEvents, eq(studentAffairsEventRegistrations.eventId, studentAffairsEvents.id))
      .leftJoin(students, eq(students.userId, users.id))
      .leftJoin(programmes, eq(students.programmeId, programmes.id))
      .where(
        and(
          eq(studentAffairsEventRegistrations.eventId, eventId),
          eq(studentAffairsEventRegistrations.status, 'registered')
        )
      )
      .orderBy(users.name);

      return roster;
    } catch (error: any) {
      console.error("Failed to get attendee roster:", error);
      throw new Error(error.message || "Failed to retrieve attendee roster");
    }
  }

  static async getUserRegistrations(userId: number) {
    try {
      return await db.select({
        id: studentAffairsEventRegistrations.id,
        eventId: studentAffairsEvents.id,
        title: studentAffairsEvents.title,
        startDate: studentAffairsEvents.startDate,
        endDate: studentAffairsEvents.endDate,
        location: studentAffairsEvents.location,
        isPaid: studentAffairsEvents.isPaid,
        fee: studentAffairsEvents.fee,
        status: studentAffairsEventRegistrations.status,
        paymentStatus: studentAffairsEventRegistrations.paymentStatus,
        registeredAt: studentAffairsEventRegistrations.registeredAt,
        transactionId: studentAffairsEventRegistrations.transactionId
      })
      .from(studentAffairsEventRegistrations)
      .innerJoin(studentAffairsEvents, eq(studentAffairsEventRegistrations.eventId, studentAffairsEvents.id))
      .where(eq(studentAffairsEventRegistrations.userId, userId))
      .orderBy(desc(studentAffairsEvents.startDate));
    } catch (error: any) {
      console.error("Failed to get user registrations:", error);
      throw new Error(error.message || "Failed to retrieve your registrations");
    }
  }

  // ==========================================
  // CLUBS / ORGANIZATIONS
  // ==========================================

  static async createClub(data: {
    name: string;
    description: string;
    category: string;
    presidentId: number;
    advisorId?: number;
    logoUrl?: string;
  }) {
    try {
      return await db.transaction(async (tx) => {
        // A. Insert club record
        const [clubResult] = await tx.insert(studentAffairsClubs).values({
          name: data.name,
          description: data.description,
          category: data.category,
          presidentId: data.presidentId,
          advisorId: data.advisorId || null,
          logoUrl: data.logoUrl || null,
          status: 'pending'
        });
        const clubId = clubResult.insertId;

        // B. Get president student ID to add them to member list
        const [student] = await tx.select({ id: students.id })
          .from(students)
          .where(eq(students.userId, data.presidentId))
          .limit(1);

        if (student) {
          await tx.insert(studentAffairsClubMembers).values({
            clubId,
            studentId: student.id,
            role: 'president'
          });
        }

        return { success: true, clubId };
      });
    } catch (error: any) {
      console.error("Failed to create club:", error);
      throw new Error(error.message || "Failed to submit club registration request");
    }
  }

  static async getClubs(status?: 'pending' | 'approved' | 'rejected' | 'suspended') {
    try {
      const query = db.select({
        id: studentAffairsClubs.id,
        name: studentAffairsClubs.name,
        description: studentAffairsClubs.description,
        category: studentAffairsClubs.category,
        logoUrl: studentAffairsClubs.logoUrl,
        status: studentAffairsClubs.status,
        createdAt: studentAffairsClubs.createdAt,
        presidentId: studentAffairsClubs.presidentId,
        presidentName: users.name,
        advisorId: studentAffairsClubs.advisorId,
        advisorName: sql<string>`(SELECT name FROM users WHERE id = ${studentAffairsClubs.advisorId})`
      })
      .from(studentAffairsClubs)
      .innerJoin(users, eq(studentAffairsClubs.presidentId, users.id));

      if (status) {
        return await query.where(eq(studentAffairsClubs.status, status)).orderBy(studentAffairsClubs.name);
      }

      return await query.orderBy(studentAffairsClubs.name);
    } catch (error: any) {
      console.error("Failed to get clubs:", error);
      throw new Error(error.message || "Failed to retrieve clubs list");
    }
  }

  static async getClubById(clubId: number) {
    try {
      const [club] = await db.select({
        id: studentAffairsClubs.id,
        name: studentAffairsClubs.name,
        description: studentAffairsClubs.description,
        category: studentAffairsClubs.category,
        logoUrl: studentAffairsClubs.logoUrl,
        status: studentAffairsClubs.status,
        createdAt: studentAffairsClubs.createdAt,
        presidentId: studentAffairsClubs.presidentId,
        presidentName: users.name,
        advisorId: studentAffairsClubs.advisorId,
        advisorName: sql<string>`(SELECT name FROM users WHERE id = ${studentAffairsClubs.advisorId})`
      })
      .from(studentAffairsClubs)
      .innerJoin(users, eq(studentAffairsClubs.presidentId, users.id))
      .where(eq(studentAffairsClubs.id, clubId))
      .limit(1);

      return club || null;
    } catch (error: any) {
      console.error("Failed to get club details:", error);
      throw new Error(error.message || "Failed to retrieve club details");
    }
  }

  static async approveClub(clubId: number, approve: boolean) {
    try {
      const newStatus = approve ? 'approved' : 'rejected';
      await db.update(studentAffairsClubs)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(studentAffairsClubs.id, clubId));
      return { success: true };
    } catch (error: any) {
      console.error("Failed to update club status:", error);
      throw new Error(error.message || "Failed to approve or reject organization");
    }
  }

  static async joinClubRequest(clubId: number, studentUserId: number) {
    try {
      // 1. Verify student profile exists
      const [student] = await db.select({ id: students.id })
        .from(students)
        .where(eq(students.userId, studentUserId))
        .limit(1);

      if (!student) {
        return { success: false, error: "Only students are eligible to join organizations." };
      }

      // 2. Check if already a member or pending request exists
      const [existingMember] = await db.select()
        .from(studentAffairsClubMembers)
        .where(
          and(
            eq(studentAffairsClubMembers.clubId, clubId),
            eq(studentAffairsClubMembers.studentId, student.id)
          )
        )
        .limit(1);

      if (existingMember) {
        if (existingMember.role === 'pending') {
          return { success: false, error: "You already have a pending membership request for this club." };
        }
        return { success: false, error: "You are already a member of this club." };
      }

      // 3. Add registration request
      await db.insert(studentAffairsClubMembers).values({
        clubId,
        studentId: student.id,
        role: 'pending'
      });

      return { success: true };
    } catch (error: any) {
      console.error("Failed to request joining club:", error);
      return { success: false, error: error.message || "Failed to request membership" };
    }
  }

  static async approveClubMember(memberId: number, approve: boolean) {
    try {
      if (approve) {
        await db.update(studentAffairsClubMembers)
          .set({ role: 'member' })
          .where(eq(studentAffairsClubMembers.id, memberId));
      } else {
        await db.delete(studentAffairsClubMembers)
          .where(eq(studentAffairsClubMembers.id, memberId));
      }
      return { success: true };
    } catch (error: any) {
      console.error("Failed to approve club member:", error);
      throw new Error(error.message || "Failed to manage membership request");
    }
  }

  static async getClubMembers(clubId: number) {
    try {
      return await db.select({
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
      .where(eq(studentAffairsClubMembers.clubId, clubId))
      .orderBy(users.name);
    } catch (error: any) {
      console.error("Failed to get club members:", error);
      throw new Error(error.message || "Failed to retrieve club membership list");
    }
  }

  static async getUserClubs(userId: number) {
    try {
      const [student] = await db.select({ id: students.id })
        .from(students)
        .where(eq(students.userId, userId))
        .limit(1);

      if (!student) return [];

      return await db.select({
        membershipId: studentAffairsClubMembers.id,
        clubId: studentAffairsClubs.id,
        name: studentAffairsClubs.name,
        category: studentAffairsClubs.category,
        logoUrl: studentAffairsClubs.logoUrl,
        role: studentAffairsClubMembers.role,
        status: studentAffairsClubs.status
      })
      .from(studentAffairsClubMembers)
      .innerJoin(studentAffairsClubs, eq(studentAffairsClubMembers.clubId, studentAffairsClubs.id))
      .where(eq(studentAffairsClubMembers.studentId, student.id))
      .orderBy(studentAffairsClubs.name);
    } catch (error: any) {
      console.error("Failed to get user clubs:", error);
      throw new Error(error.message || "Failed to retrieve your organization list");
    }
  }

  // ==========================================
  // BULLETINS / ANNOUNCEMENTS
  // ==========================================

  static async createBulletin(data: {
    title: string;
    content: string;
    category: 'academic' | 'social' | 'sports' | 'announcement';
    authorId: number;
    status: 'draft' | 'published';
  }) {
    try {
      const publishedAt = data.status === 'published' ? new Date() : null;
      const [result] = await db.insert(studentAffairsBulletins).values({
        title: data.title,
        content: data.content,
        category: data.category,
        status: data.status,
        authorId: data.authorId,
        publishedAt
      });
      return { success: true, bulletinId: result.insertId };
    } catch (error: any) {
      console.error("Failed to create bulletin:", error);
      throw new Error(error.message || "Failed to save announcement");
    }
  }

  static async getBulletins(onlyPublished = true) {
    try {
      const query = db.select({
        id: studentAffairsBulletins.id,
        title: studentAffairsBulletins.title,
        content: studentAffairsBulletins.content,
        category: studentAffairsBulletins.category,
        status: studentAffairsBulletins.status,
        publishedAt: studentAffairsBulletins.publishedAt,
        createdAt: studentAffairsBulletins.createdAt,
        authorName: users.name
      })
      .from(studentAffairsBulletins)
      .innerJoin(users, eq(studentAffairsBulletins.authorId, users.id));

      if (onlyPublished) {
        return await query.where(eq(studentAffairsBulletins.status, 'published')).orderBy(desc(studentAffairsBulletins.publishedAt));
      }

      return await query.orderBy(desc(studentAffairsBulletins.createdAt));
    } catch (error: any) {
      console.error("Failed to get bulletins:", error);
      throw new Error(error.message || "Failed to retrieve bulletins");
    }
  }

  static async publishBulletin(bulletinId: number) {
    try {
      await db.update(studentAffairsBulletins)
        .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
        .where(eq(studentAffairsBulletins.id, bulletinId));
      return { success: true };
    } catch (error: any) {
      console.error("Failed to publish bulletin:", error);
      throw new Error(error.message || "Failed to publish announcement");
    }
  }

  static async generateEventTicketQR(registrationId: number, userId: number) {
    try {
      const [reg] = await db.select({
        id: studentAffairsEventRegistrations.id,
        userId: studentAffairsEventRegistrations.userId,
        status: studentAffairsEventRegistrations.status
      })
      .from(studentAffairsEventRegistrations)
      .where(eq(studentAffairsEventRegistrations.id, registrationId))
      .limit(1);

      if (!reg) {
        return { success: false, error: "Registration not found." };
      }

      if (reg.userId !== userId) {
        return { success: false, error: "Unauthorized access to ticket." };
      }

      if (reg.status !== 'registered') {
        return { success: false, error: "Registration is not active." };
      }

      const qrContent = `ev_tkt:${registrationId}:${userId}`;
      const qrDataUrl = await InstitutionalUtilsService.generateQRCode(qrContent);
      return { success: true, qrDataUrl };
    } catch (error: any) {
      console.error("Failed to generate ticket QR:", error);
      return { success: false, error: error.message || "Failed to generate QR Code" };
    }
  }

  static async verifyTicketAndCheckIn(qrContent: string) {
    try {
      if (!qrContent.startsWith("ev_tkt:")) {
        return { success: false, error: "Invalid ticket format." };
      }

      const parts = qrContent.split(":");
      if (parts.length < 3) {
        return { success: false, error: "Invalid ticket payload." };
      }

      const registrationId = parseInt(parts[1]);
      const userId = parseInt(parts[2]);

      const [reg] = await db.select({
        id: studentAffairsEventRegistrations.id,
        userId: studentAffairsEventRegistrations.userId,
        status: studentAffairsEventRegistrations.status,
        paymentStatus: studentAffairsEventRegistrations.paymentStatus,
        checkedIn: studentAffairsEventRegistrations.checkedIn,
        title: studentAffairsEvents.title,
        isPaid: studentAffairsEvents.isPaid,
        fee: studentAffairsEvents.fee,
        userName: users.name,
        userEmail: users.email
      })
      .from(studentAffairsEventRegistrations)
      .innerJoin(studentAffairsEvents, eq(studentAffairsEventRegistrations.eventId, studentAffairsEvents.id))
      .innerJoin(users, eq(studentAffairsEventRegistrations.userId, users.id))
      .where(eq(studentAffairsEventRegistrations.id, registrationId))
      .limit(1);

      if (!reg) {
        return { success: false, error: "Ticket registration record not found." };
      }

      if (reg.userId !== userId) {
        return { success: false, error: "Ticket verification failed: owner identity mismatch." };
      }

      if (reg.status !== 'registered') {
        return { success: false, error: "This ticket registration has been cancelled." };
      }

      if (reg.isPaid && reg.paymentStatus !== 'paid') {
        return { success: false, error: `Unpaid ticket: ₦${Number(reg.fee).toLocaleString()} registration fee required.` };
      }

      if (reg.checkedIn) {
        return { 
          success: false, 
          alreadyCheckedIn: true, 
          attendee: { name: reg.userName, email: reg.userEmail, title: reg.title }, 
          error: "This ticket has already been checked in." 
        };
      }

      // Record check in
      await db.update(studentAffairsEventRegistrations)
        .set({ checkedIn: true, checkedInAt: new Date() })
        .where(eq(studentAffairsEventRegistrations.id, registrationId));

      return { 
        success: true, 
        attendee: { name: reg.userName, email: reg.userEmail, title: reg.title } 
      };
    } catch (error: any) {
      console.error("Failed to verify ticket:", error);
      return { success: false, error: error.message || "Failed to process check-in" };
    }
  }
}
