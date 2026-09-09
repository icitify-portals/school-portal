"use server";

// Shared broadcast audience resolution.
// Centralizes recipient targeting so the UI preview count, the BullMQ worker,
// and the inline fallback all produce identical results using the correct
// schema columns (students.currentLevel / students.deptId, etc.).

import { db } from "@/db/db";
import {
  users,
  students,
  admissionApplicationsV2,
  departments,
  programmes,
} from "@/db/schema";
import {
  eq,
  and,
  inArray,
  sql,
  isNotNull,
  isNull,
  gte,
  lte,
} from "drizzle-orm";

export interface ApplicantCriteria {
  admissionStatus?: string[];
  examAttendance?: string; // all | present | absent | pending
  applicationMode?: string; // all | full_time | part_time | elearning
  programmeIds?: number[];
  departmentIds?: number[];
  facultyIds?: number[];
  levels?: string[]; // ND1, ND2, HND1, HND2
  gender?: string; // all | male | female
  hasNin?: string; // all | yes | no
  hasJamb?: string; // all | yes | no
  hasMatric?: string; // all | yes | no
  acceptanceFeeStatus?: string; // all | paid | not_paid
  applicationFeeStatus?: string; // all | paid | not_paid
  ageMin?: number;
  ageMax?: number;
  sessionId?: number;
  appliedFrom?: string;
  appliedTo?: string;
}

export interface RecipientResult {
  userIds: number[];
  emails: string[];
  count: number;
}

// ── Applicant condition builder ────────────────────────────────────────────
export async function buildApplicantConditions(criteria: ApplicantCriteria): Promise<any[]> {
  const conditions: any[] = [];

  if (criteria.admissionStatus && criteria.admissionStatus.length > 0 && !criteria.admissionStatus.includes("all")) {
    conditions.push(inArray(admissionApplicationsV2.status, criteria.admissionStatus as any));
  }
  if (criteria.examAttendance && criteria.examAttendance !== "all") {
    conditions.push(eq(admissionApplicationsV2.examAttendanceStatus, criteria.examAttendance as any));
  }
  if (criteria.applicationMode && criteria.applicationMode !== "all") {
    conditions.push(eq(admissionApplicationsV2.applicationMode, criteria.applicationMode as any));
  }
  if (criteria.programmeIds && criteria.programmeIds.length > 0) {
    conditions.push(inArray(admissionApplicationsV2.programmeId, criteria.programmeIds));
  }
  if (criteria.departmentIds && criteria.departmentIds.length > 0) {
    const deptProgs = await db.select({ id: programmes.id }).from(programmes).where(inArray(programmes.deptId, criteria.departmentIds));
    const progIds = deptProgs.map(p => p.id);
    conditions.push(progIds.length > 0 ? inArray(admissionApplicationsV2.programmeId, progIds) : sql`1=0`);
  }
  if (criteria.facultyIds && criteria.facultyIds.length > 0) {
    const facDepts = await db.select({ id: departments.id }).from(departments).where(inArray(departments.facultyId, criteria.facultyIds));
    const facDeptIds = facDepts.map(d => d.id);
    let progIds: number[] = [];
    if (facDeptIds.length > 0) {
      const facProgs = await db.select({ id: programmes.id }).from(programmes).where(inArray(programmes.deptId, facDeptIds));
      progIds = facProgs.map(p => p.id);
    }
    conditions.push(progIds.length > 0 ? inArray(admissionApplicationsV2.programmeId, progIds) : sql`1=0`);
  }
  if (criteria.levels && criteria.levels.length > 0) {
    const types = new Set<string>();
    criteria.levels.forEach((lv: string) => {
      const t = String(lv).toUpperCase();
      if (t.includes("HND")) types.add("HND");
      else if (t.includes("ND")) types.add("ND");
    });
    if (types.size > 0) {
      const typeProgs = await db.select({ id: programmes.id }).from(programmes).where(inArray(programmes.programmeType, Array.from(types) as any));
      const progIds = typeProgs.map(p => p.id);
      conditions.push(progIds.length > 0 ? inArray(admissionApplicationsV2.programmeId, progIds) : sql`1=0`);
    }
  }
  if (criteria.gender && criteria.gender !== "all") {
    conditions.push(sql`LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${admissionApplicationsV2.data}, '$.gender')), JSON_UNQUOTE(JSON_EXTRACT(${admissionApplicationsV2.data}, '$.Gender')))) = ${criteria.gender.toLowerCase()}`);
  }
  if (criteria.hasNin === "yes") {
    conditions.push(sql`(${admissionApplicationsV2.nin} IS NOT NULL AND ${admissionApplicationsV2.nin} != '')`);
  } else if (criteria.hasNin === "no") {
    conditions.push(sql`(${admissionApplicationsV2.nin} IS NULL OR ${admissionApplicationsV2.nin} = '')`);
  }
  if (criteria.hasJamb === "yes") {
    conditions.push(sql`(${admissionApplicationsV2.jambRegNumber} IS NOT NULL AND ${admissionApplicationsV2.jambRegNumber} != '')`);
  } else if (criteria.hasJamb === "no") {
    conditions.push(sql`(${admissionApplicationsV2.jambRegNumber} IS NULL OR ${admissionApplicationsV2.jambRegNumber} = '')`);
  }
  if (criteria.hasMatric === "yes") {
    conditions.push(isNotNull(admissionApplicationsV2.studentId));
  } else if (criteria.hasMatric === "no") {
    conditions.push(isNull(admissionApplicationsV2.studentId));
  }
  if (criteria.acceptanceFeeStatus === "paid") {
    conditions.push(eq(admissionApplicationsV2.acceptancePaymentStatus, "paid"));
  } else if (criteria.acceptanceFeeStatus === "not_paid") {
    conditions.push(sql`(${admissionApplicationsV2.acceptancePaymentStatus} IS NULL OR ${admissionApplicationsV2.acceptancePaymentStatus} != 'paid')`);
  }
  if (criteria.applicationFeeStatus === "paid") {
    conditions.push(eq(admissionApplicationsV2.paymentStatus, "paid"));
  } else if (criteria.applicationFeeStatus === "not_paid") {
    conditions.push(sql`(${admissionApplicationsV2.paymentStatus} IS NULL OR ${admissionApplicationsV2.paymentStatus} != 'paid')`);
  }
  if (criteria.ageMin !== undefined && criteria.ageMin !== null) {
    conditions.push(gte(admissionApplicationsV2.ageAtAdmission, criteria.ageMin));
  }
  if (criteria.ageMax !== undefined && criteria.ageMax !== null) {
    conditions.push(lte(admissionApplicationsV2.ageAtAdmission, criteria.ageMax));
  }
  if (criteria.sessionId) {
    const sessionStudents = await db.select({ id: students.id }).from(students).where(eq(students.currentSessionId, criteria.sessionId));
    const sIds = sessionStudents.map(s => s.id);
    conditions.push(sIds.length > 0 ? inArray(admissionApplicationsV2.studentId, sIds) : sql`1=0`);
  }
  if (criteria.appliedFrom) {
    conditions.push(gte(admissionApplicationsV2.appliedAt, new Date(criteria.appliedFrom)));
  }
  if (criteria.appliedTo) {
    conditions.push(lte(admissionApplicationsV2.appliedAt, new Date(criteria.appliedTo)));
  }

  return conditions;
}

// ── Resolve applicant recipients (userIds + emails) ────────────────────────
export async function resolveApplicantRecipients(criteria: ApplicantCriteria): Promise<RecipientResult> {
  const conditions = await buildApplicantConditions(criteria);
  const apps = await db
    .select({ applicantId: admissionApplicationsV2.applicantId, data: admissionApplicationsV2.data })
    .from(admissionApplicationsV2)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const userIds = new Set<number>();
  const emails = new Set<string>();
  for (const app of apps) {
    if (app.applicantId) userIds.add(app.applicantId);
    if (app.data) {
      try {
        const parsed = typeof app.data === "string" ? JSON.parse(app.data) : app.data;
        if (parsed.email) emails.add(parsed.email);
      } catch {}
    }
  }
  return { userIds: Array.from(userIds), emails: Array.from(emails), count: userIds.size + emails.size };
}

// ── Resolve recipients for any target type ─────────────────────────────────
export async function resolveBroadcastRecipients(criteria: any): Promise<{ userIds: number[]; emails: string[] }> {
  const type = criteria?.type || "all";
  let userIds: number[] = [];
  let emails: string[] = criteria?.externalEmails ? Array.from(criteria.externalEmails) : [];

  // Helper to build level conditions handling both 1/2 and legacy 100/200
  const buildLevelConditions = (levelStr: string): any[] => {
    const norm = String(levelStr).trim().replace(/\s+/g, "").toUpperCase();
    if (norm === "APPLICANT") return []; // handled separately
    const levelMap: Record<string, any[]> = {
      "ND1": [eq(students.status, "active"), sql`(${students.currentLevel} IN (1,100) AND ${students.programmeType}='ND')`],
      "ND2": [eq(students.status, "active"), sql`(${students.currentLevel} IN (2,200) AND ${students.programmeType}='ND')`],
      "HND1": [eq(students.status, "active"), sql`(${students.currentLevel} IN (1,100) AND ${students.programmeType}='HND')`],
      "HND2": [eq(students.status, "active"), sql`(${students.currentLevel} IN (2,200) AND ${students.programmeType}='HND')`],
      "ND_GRADUATED": [eq(students.status, "nd_graduated" as any)],
      "HND_GRADUATED": [eq(students.status, "hnd_graduated" as any)],
    };
    if (levelMap[norm]) return levelMap[norm];
    // Spaced variants
    if (levelStr === "ND 1") return levelMap["ND1"];
    if (levelStr === "ND 2") return levelMap["ND2"];
    if (levelStr === "HND 1") return levelMap["HND1"];
    if (levelStr === "HND 2") return levelMap["HND2"];
    if (levelStr === "ND_graduated") return [eq(students.status, "nd_graduated" as any)];
    if (levelStr === "HND_graduated") return [eq(students.status, "hnd_graduated" as any)];
    return [];
  };

  if (type === "users") {
    userIds = criteria?.userIds || [];
  } else if (type === "staff") {
    const q = await db.select({ id: users.id }).from(users).where(inArray(users.role, ["staff", "admin", "bursar", "registrar", "librarian", "hod", "dean", "admission_officer", "dvc", "superadmin"] as any));
    userIds = q.map(r => r.id);
  } else if (type === "applicants") {
    const res = await resolveApplicantRecipients(criteria);
    userIds = res.userIds;
    emails = Array.from(new Set([...emails, ...res.emails]));
  } else if (type === "levels" && criteria?.levels?.length) {
    const allIds = new Set<number>();
    // Handle Entire School as alias for all active students
    const levels = criteria.levels.includes("Entire School") || criteria.levels.includes("ALL") ? ["ND1","ND2","HND1","HND2","APPLICANT"] : criteria.levels;
    for (const raw of levels) {
      const levelStr = String(raw).trim();
      const norm = levelStr.replace(/\s+/g, "").toUpperCase();
      if (norm === "APPLICANT") {
        const q = await db.select({ id: users.id }).from(users).where(eq(users.role, "applicant"));
        q.forEach(r => allIds.add(r.id));
      } else if (norm === "ENTIRESCHOOL" || norm === "ALL") {
        const q = await db.select({ userId: students.userId }).from(students).where(eq(students.status, "active"));
        q.forEach(r => { if (r.userId) allIds.add(r.userId as number); });
        const q2 = await db.select({ id: users.id }).from(users).where(eq(users.role, "applicant"));
        q2.forEach(r => allIds.add(r.id));
      } else {
        const conditions = buildLevelConditions(levelStr);
        if (conditions.length > 0) {
          const q = await db.select({ userId: students.userId }).from(students).where(and(...conditions));
          q.forEach(r => { if (r.userId) allIds.add(r.userId as number); });
        }
      }
    }
    userIds = Array.from(allIds);
  } else {
    // all, departments, programmes, debtors (defaults to active students)
    // Entire School = all active students + applicants
    if (type === "all" || criteria?.levels?.includes("Entire School")) {
      const q = await db.select({ userId: students.userId }).from(students).where(eq(students.status, "active"));
      userIds = q.filter(r => r.userId).map(r => r.userId as number);
      const q2 = await db.select({ id: users.id }).from(users).where(eq(users.role, "applicant"));
      q2.forEach(r => userIds.push(r.id));
      // Dedupe
      userIds = Array.from(new Set(userIds));
    } else {
      let conditions = [eq(students.status, "active")];
      if (type === "departments" && criteria?.departments?.length) {
        conditions.push(inArray(students.deptId, criteria.departments));
      } else if (type === "programmes" && criteria?.programmes?.length) {
        conditions.push(inArray(students.programmeId, criteria.programmes));
      }
      const q = await db.select({ userId: students.userId }).from(students).where(and(...conditions));
      userIds = q.filter(r => r.userId).map(r => r.userId as number);
    }
  }

  return { userIds, emails };
}

// ── Count recipients for the preview ───────────────────────────────────────
export async function countBroadcastRecipients(criteria: any): Promise<number> {
  const res = await resolveBroadcastRecipients(criteria);
  return res.userIds.length + res.emails.length;
}

// ── Get emails for download (registrar) ─────────────────────────────────
export async function getEmailsForBroadcast(criteria: any): Promise<{ emails: string[]; count: number; breakdown: any[] }> {
  const { userIds } = await resolveBroadcastRecipients(criteria);
  if (userIds.length === 0) return { emails: [], count: 0, breakdown: [] };
  // Fetch users with emails, deduplicate, include matric/dept/level for CSV
  const chunkSize = 250;
  const emails: string[] = [];
  const breakdown: any[] = [];
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    const rows = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      matricNumber: students.matricNumber,
      deptCode: departments.code,
      programmeType: students.programmeType,
      currentLevel: students.currentLevel,
      deptName: departments.name,
    }).from(users)
      .leftJoin(students, eq(students.userId, users.id))
      .leftJoin(departments, eq(departments.id, students.deptId))
      .where(inArray(users.id, chunk));
    for (const r of rows) {
      if (r.email) {
        const lower = r.email.toLowerCase();
        if (!emails.includes(lower)) {
          emails.push(lower);
          breakdown.push({
            email: lower,
            name: r.name || "",
            matricNumber: r.matricNumber || "",
            deptCode: r.deptCode || "",
            deptName: r.deptName || "",
            level: r.programmeType && r.currentLevel ? `${r.programmeType}${r.currentLevel}` : "",
          });
        }
      }
    }
  }
  return { emails, count: emails.length, breakdown };
}

// ── Send direct message (registrar, no queue) ───────────────────────────
export async function sendDirectBroadcast(criteria: any, subject: string, body: string, channel: 'email' | 'sms' | 'inApp' = 'email'): Promise<{ success: boolean; sent: number; error?: string }> {
  if (!subject || !body) return { success: false, sent: 0, error: "Subject and body required" };
  const { userIds } = await resolveBroadcastRecipients(criteria);
  if (userIds.length === 0) return { success: false, sent: 0, error: "No recipients found for this filter" };
  // Direct send via existing mail/sms services, batch 50
  const { sendEmail } = await import("@/lib/mail");
  const { sendWhatsAppMessage } = await import("@/lib/twilio").catch(() => ({ sendWhatsAppMessage: null }));
  let sent = 0;
  const chunkSize = 50;
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    const usersChunk = await db.select({ id: users.id, email: users.email, name: users.name, phone: users.phone }).from(users).where(inArray(users.id, chunk));
    for (const u of usersChunk) {
      try {
        if (channel === 'email' && u.email) {
          await sendEmail(u.email, subject, body);
          sent++;
        } else if (channel === 'sms' && u.phone && sendWhatsAppMessage) {
          await (sendWhatsAppMessage as any)(u.phone, `${subject}\n\n${body}`);
          sent++;
        } else if (channel === 'inApp') {
          const { sendInAppNotification } = await import("@/actions/notifications");
          await sendInAppNotification({ userId: u.id, title: subject, message: body, type: "info" });
          sent++;
        }
      } catch (e) {
        console.error(`Direct send failed for user ${u.id}:`, e);
      }
    }
  }
  // Audit log
  try {
    const { logTranscriptActivity } = await import("@/actions/result-module");
    await logTranscriptActivity({ action: "direct_broadcast", targetType: "broadcast", targetLabel: `Direct ${channel} to ${userIds.length} (${JSON.stringify(criteria)})`, details: { subject, sent, criteria } });
  } catch {}
  return { success: true, sent };
}
