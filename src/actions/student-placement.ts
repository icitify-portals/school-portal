"use server";

import { db } from "@/db/db";
import {
    students, users, programmes, departments, systemAuditLogs,
    studentBills, studentCourseRegistrations
} from "@/db/schema";
import { eq, and, or, like, isNull, notInArray, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { resolveLevel, toProgrammeType, levelLabel } from "@/lib/levels";

/**
 * Manual placement correction.
 *
 * The portal has exactly four levels: ND 1, ND 2, HND 1 and HND 2.
 * `students.current_level` therefore only ever holds 1 or 2, and the ND/HND
 * half of the label comes from the programme. That is why this action never
 * accepts a programme type or a department from the client: both are derived
 * from the chosen programme row so the two can never drift apart again.
 *
 * This is the missing counterpart to promotion, which can only move
 * currentLevel and can never move a student from ND to HND.
 */

const REVIEW_ROLES = ["admin", "superadmin", "registrar", "admission_officer"];

const STATUSES = [
    "active", "nd_graduant", "hnd_graduant", "nd_graduated", "hnd_graduated",
    "withdrawn", "suspended", "rusticated", "pending_review"
] as const;

export type PlacementIssueType =
    | "programme_type_mismatch"
    | "no_programme"
    | "legacy_level"
    | "graduant_status_on_hnd";

async function ensureReviewAdmin() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Not authenticated");

    const user = await db.query.users.findFirst({
        where: eq(users.id, Number(session.user.id)),
        columns: { id: true, role: true }
    });
    if (!user || !REVIEW_ROLES.includes(user.role || "")) {
        throw new Error("Access denied. Administrator, Registrar or Admissions Officer role required.");
    }
    return user.id;
}

async function audit(actorId: number, action: string, targetId: number, details: object) {
    try {
        await db.insert(systemAuditLogs).values({
            actorId,
            action,
            targetId: String(targetId),
            details: JSON.stringify(details),
            status: "success"
        });
    } catch (e) {
        console.error("[student-placement] audit write failed:", e);
    }
}

/** Programmes with their department, for the correction dropdown. */
export async function getPlacementProgrammes() {
    await ensureReviewAdmin();
    return db
        .select({
            id: programmes.id,
            name: programmes.name,
            programmeType: programmes.programmeType,
            code: programmes.code,
            deptId: programmes.deptId,
            deptName: departments.name,
            durationYears: programmes.durationYears
        })
        .from(programmes)
        .leftJoin(departments, eq(departments.id, programmes.deptId))
        .orderBy(programmes.programmeType, departments.name, programmes.name);
}

export type PlacementIssue = {
    id: number;
    matricNumber: string | null;
    name: string;
    email: string | null;
    deptId: number | null;
    deptName: string | null;
    programmeId: number | null;
    programmeName: string | null;
    storedProgrammeType: string | null;
    actualProgrammeType: string | null;
    currentLevel: number | null;
    status: string | null;
    admissionYear: number | null;
    issues: PlacementIssueType[];
    displayLabel: string;
    dependentCounts: { bills: number; registrations: number };
    totalDependents: number;
};

const ISSUE_LABELS: Record<PlacementIssueType, string> = {
    programme_type_mismatch: "Programme type disagrees with programme",
    no_programme: "No programme assigned",
    legacy_level: "Level stored as 100-500 instead of 1-2",
    graduant_status_on_hnd: "Marked ND graduant but on an HND programme",
};

/**
 * Every student whose stored placement is self-inconsistent. Each check mirrors
 * a real failure seen in production rather than a hypothetical one.
 */
export async function getPlacementIssues(limit = 500) {
    await ensureReviewAdmin();

    const rows = await db
        .select({
            id: students.id,
            matricNumber: students.matricNumber,
            firstName: students.firstName,
            lastName: students.lastName,
            email: users.email,
            deptId: students.deptId,
            programmeId: students.programmeId,
            storedProgrammeType: students.programmeType,
            currentLevel: students.currentLevel,
            status: students.status,
            admissionYear: students.admissionYear,
            programmeName: programmes.name,
            actualProgrammeType: programmes.programmeType,
            deptName: departments.name
        })
        .from(students)
        .leftJoin(users, eq(users.id, students.userId))
        .leftJoin(programmes, eq(programmes.id, students.programmeId))
        .leftJoin(departments, eq(departments.id, students.deptId))
        .where(and(isNull(students.deletedAt), sql`(
                ${students.programmeId} IS NULL
             OR ${students.currentLevel} NOT IN (1, 2)
             OR (${programmes.id} IS NOT NULL AND ${students.programmeType} <> ${programmes.programmeType})
             OR (${programmes.programmeType} = 'HND' AND ${students.status} = 'nd_graduant')
        )`))
        .orderBy(students.id)
        .limit(limit);

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const depRows = await db.execute(sql`
        SELECT s.id AS student_id,
          (SELECT COUNT(*) FROM student_bills WHERE student_id = s.id) AS bills,
          (SELECT COUNT(*) FROM student_course_registrations WHERE student_id = s.id) AS regs
        FROM students s WHERE s.id IN ${sql.join(ids.map((i) => sql`${i}`), sql`,`)}
    `) as unknown as Array<Record<string, number | string>>;
    const depMap = new Map<number, { bills: number; registrations: number }>();
    for (const d of depRows) depMap.set(Number(d.student_id), {
        bills: Number(d.bills ?? 0), registrations: Number(d.regs ?? 0)
    });

    return rows.map((r): PlacementIssue => {
        const issues: PlacementIssueType[] = [];
        if (!r.programmeId) issues.push("no_programme");
        if (r.currentLevel !== 1 && r.currentLevel !== 2) issues.push("legacy_level");
        if (r.programmeId && r.actualProgrammeType && r.storedProgrammeType !== r.actualProgrammeType) {
            issues.push("programme_type_mismatch");
        }
        if (r.actualProgrammeType === "HND" && r.status === "nd_graduant") {
            issues.push("graduant_status_on_hnd");
        }
        const dep = depMap.get(r.id) ?? { bills: 0, registrations: 0 };
        return {
            id: r.id,
            matricNumber: r.matricNumber,
            name: [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || "(no name)",
            email: r.email,
            deptId: r.deptId,
            deptName: r.deptName,
            programmeId: r.programmeId,
            programmeName: r.programmeName,
            storedProgrammeType: r.storedProgrammeType,
            actualProgrammeType: r.actualProgrammeType,
            currentLevel: r.currentLevel,
            status: r.status,
            admissionYear: r.admissionYear,
            issues,
            displayLabel: levelLabel(r.currentLevel, r.storedProgrammeType),
            dependentCounts: dep,
            totalDependents: dep.bills + dep.registrations
        };
    });
}

export function placementIssueLabel(t: PlacementIssueType) {
    return ISSUE_LABELS[t] ?? t;
}

/**
 * Applies a placement correction.
 *
 * The programme type and department are read from the programme row rather than
 * accepted from the caller, which is what stops the two from disagreeing. A
 * reason is mandatory so the audit trail explains itself later.
 */
export async function correctStudentPlacement(input: {
    studentId: number;
    programmeId: number | null;
    currentLevel: number;
    status?: string;
    reason: string;
}) {
    const actorId = await ensureReviewAdmin();
    const { studentId, programmeId, currentLevel, status, reason } = input;

    if (!studentId || Number.isNaN(Number(studentId))) {
        return { success: false, error: "Invalid student." };
    }
    if (currentLevel !== 1 && currentLevel !== 2) {
        return { success: false, error: "Level must be 1 or 2. (100-500 are course levels, not student levels.)" };
    }
    if (status && !STATUSES.includes(status as any)) {
        return { success: false, error: `Unknown status "${status}".` };
    }
    const trimmed = (reason || "").trim();
    if (trimmed.length < 5) {
        return { success: false, error: "A reason is required so this correction can be audited." };
    }

    const [before] = await db
        .select({
            id: students.id,
            matricNumber: students.matricNumber,
            programmeId: students.programmeId,
            programmeType: students.programmeType,
            deptId: students.deptId,
            currentLevel: students.currentLevel,
            status: students.status
        })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);
    if (!before) return { success: false, error: "Student not found." };

    let programmeRow: { id: number; name: string; programmeType: string; deptId: number | null } | null = null;
    if (programmeId != null) {
        const [p] = await db
            .select({
                id: programmes.id,
                name: programmes.name,
                programmeType: programmes.programmeType,
                deptId: programmes.deptId
            })
            .from(programmes)
            .where(eq(programmes.id, programmeId))
            .limit(1);
        if (!p) return { success: false, error: "That programme does not exist." };
        programmeRow = p;
    }

    const patch: Record<string, unknown> = { currentLevel };
    if (status) patch.status = status;
    if (programmeId != null) {
        patch.programmeId = programmeId;
        // Derived, never client supplied.
        patch.programmeType = toProgrammeType(programmeRow!.programmeType);
        if (programmeRow!.deptId != null) patch.deptId = programmeRow!.deptId;
    } else {
        patch.programmeId = null;
    }

    const changed = (Object.keys(patch) as Array<keyof typeof patch>).filter(
        (k) => String(before[k as keyof typeof before] ?? "") !== String(patch[k] ?? "")
    );
    if (changed.length === 0) {
        return { success: false, error: "Nothing to change - the values are already set." };
    }

    await db.update(students).set(patch as any).where(eq(students.id, studentId));

    const after = {
        programmeId: patch.programmeId ?? null,
        programmeType: patch.programmeType ?? null,
        deptId: patch.deptId ?? before.deptId,
        currentLevel,
        status: patch.status ?? before.status
    };

    // Surface what the correction actually does to the student's course list,
    // because changing the programme half of the label swaps the level 100/200
    // set for the 300/400 set.
    const beforeNumeric = resolveLevel(before.currentLevel, before.programmeType)?.numeric ?? null;
    const afterNumeric = resolveLevel(after.currentLevel, after.programmeType as string)?.numeric ?? null;

    await audit(actorId, "placement.correct", studentId, {
        reason: trimmed,
        changed,
        before: {
            programmeId: before.programmeId,
            programmeType: before.programmeType,
            deptId: before.deptId,
            currentLevel: before.currentLevel,
            status: before.status,
            label: levelLabel(before.currentLevel, before.programmeType),
            courseLevel: beforeNumeric
        },
        after: {
            programmeId: after.programmeId,
            programmeType: after.programmeType,
            deptId: after.deptId,
            currentLevel: after.currentLevel,
            status: after.status,
            programmeName: programmeRow?.name ?? null,
            label: levelLabel(after.currentLevel, after.programmeType as string),
            courseLevel: afterNumeric
        },
        courseListChanged: beforeNumeric !== null && afterNumeric !== null && beforeNumeric !== afterNumeric
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/students/placement");
    revalidatePath(`/admin/students/${studentId}`);

    return {
        success: true,
        message: `${before.matricNumber || `Student ${studentId}`} is now ${
            levelLabel(after.currentLevel, after.programmeType as string)
        }${programmeRow ? ` (${programmeRow.name})` : ""}.`
    };
}