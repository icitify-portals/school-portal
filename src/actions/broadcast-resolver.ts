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
    const levelStr = criteria.levels[0];
    if (levelStr === "Applicant") {
      const q = await db.select({ id: users.id }).from(users).where(eq(users.role, "applicant"));
      userIds = q.map(r => r.id);
    } else {
      let conditions: any[] = [];
      if (levelStr === "ND_graduated") conditions.push(eq(students.status, "nd_graduant"));
      else if (levelStr === "HND_graduated") conditions.push(eq(students.status, "hnd_graduant"));
      else if (levelStr === "ND 1") conditions.push(eq(students.status, "active"), eq(students.currentLevel, 100), eq(students.programmeType, "ND"));
      else if (levelStr === "ND 2") conditions.push(eq(students.status, "active"), eq(students.currentLevel, 200), eq(students.programmeType, "ND"));
      else if (levelStr === "HND 1") conditions.push(eq(students.status, "active"), eq(students.currentLevel, 100), eq(students.programmeType, "HND"));
      else if (levelStr === "HND 2") conditions.push(eq(students.status, "active"), eq(students.currentLevel, 200), eq(students.programmeType, "HND"));
      if (conditions.length > 0) {
        const q = await db.select({ userId: students.userId }).from(students).where(and(...conditions));
        userIds = q.filter(r => r.userId).map(r => r.userId as number);
      }
    }
  } else {
    // all, departments, programmes, debtors (defaults to active students)
    let conditions = [eq(students.status, "active")];
    if (type === "departments" && criteria?.departments?.length) {
      conditions.push(inArray(students.deptId, criteria.departments));
    } else if (type === "programmes" && criteria?.programmes?.length) {
      conditions.push(inArray(students.programmeId, criteria.programmes));
    }
    const q = await db.select({ userId: students.userId }).from(students).where(and(...conditions));
    userIds = q.filter(r => r.userId).map(r => r.userId as number);
  }

  return { userIds, emails };
}

// ── Count recipients for the preview ───────────────────────────────────────
export async function countBroadcastRecipients(criteria: any): Promise<number> {
  const res = await resolveBroadcastRecipients(criteria);
  return res.userIds.length + res.emails.length;
}
