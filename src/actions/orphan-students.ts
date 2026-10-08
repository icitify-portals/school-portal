"use server";

import { db } from "@/db/db";
import { students, users, systemAuditLogs } from "@/db/schema";
import { eq, and, or, like, inArray, sql, isNull, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Placeholder records were historically auto-generated as `STU/{year}/{random}`
 * with `current_level = 100` and no department/programme/session. They are
 * invalid admissions artefacts and must be resolved by an administrator.
 */
const PLACEHOLDER_PREFIX = "STU/";

async function ensureReviewAdmin(): Promise<
    { actorId: number; error: null } | { actorId: null; error: string }
> {
    const session = await auth();
    if (!session?.user) {
        return { actorId: null, error: "You are not signed in, or your session has expired." };
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, Number(session.user.id)),
        columns: { id: true, role: true }
    });

    // The sidebar shows Student Management to superadmin and icitify_dev too,
    // so leaving them out here denied the very roles that can see the link.
    const allowed = ["admin", "superadmin", "icitify_dev", "registrar", "admission_officer", "record_officer", "ict_manager"];
    if (!user || !allowed.includes(user.role || "")) {
        // Returned rather than thrown: Next.js redacts a thrown error from a
        // server action in production, so the admin would never learn why.
        return {
            actorId: null,
            error: `Your role "${user?.role || "none"}" may not correct incomplete admission records. ` +
                `Allowed roles: ${allowed.join(", ")}.`
        };
    }
    return { actorId: user.id, error: null };
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
        console.error("[orphan-students] audit write failed:", e);
    }
}

/** Student rows that look like the auto-generated placeholder artefacts. */
function orphanFilter() {
    return and(
        isNull(students.deletedAt),
        or(
            like(students.matricNumber, `${PLACEHOLDER_PREFIX}%`),
            eq(students.status, "pending_review")
        )
    );
}

export async function getOrphanStudents(): Promise<{ data: unknown[]; error: string | null }> {
    const authz = await ensureReviewAdmin();
    if (authz.error) return { data: [], error: authz.error };

    try {
        return { data: await loadOrphanStudents(), error: null };
    } catch (e: any) {
        // Returned rather than thrown: Next.js redacts a thrown server-action
        // error in production, so the admin previously got an empty table and
        // a message that named no cause.
        return {
            data: [],
            error: e?.message || "Could not read incomplete admission records."
        };
    }
}

async function loadOrphanStudents() {
    const rows = await db
        .select({
            id: students.id,
            userId: students.userId,
            matricNumber: students.matricNumber,
            firstName: students.firstName,
            lastName: students.lastName,
            email: users.email,
            userName: users.name,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            studyMode: students.studyMode,
            status: students.status,
            admissionYear: students.admissionYear
        })
        .from(students)
        .leftJoin(users, eq(users.id, students.userId))
        .where(orphanFilter())
        .orderBy(sql`students.id`);

    // Dependent-record counts so the admin knows what a delete would touch.
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return [];

    // sql.join emits only a separator, so the list has to be parenthesised
    // or MySQL rejects "IN 1,2,3" with a syntax error. mysql2 answers a raw
    // execute with [rows, fields], so unwrap before counting.
    const rawDep = await db.execute(sql`
        SELECT s.id AS student_id,
          (SELECT COUNT(*) FROM student_bills      WHERE student_id = s.id) AS bills,
          (SELECT COUNT(*) FROM student_course_registrations WHERE student_id = s.id) AS enrollments,
          (SELECT COUNT(*) FROM id_cards        WHERE student_id = s.id) AS id_cards,
          (SELECT COUNT(*) FROM student_medical_records WHERE student_id = s.id) AS medical,
          (SELECT COUNT(*) FROM conduct_logs    WHERE student_id = s.id) AS conduct
        FROM students s WHERE s.id IN (${sql.join(ids.map((i) => sql`${i}`), sql`,`)})
    `);
    const depRows = (Array.isArray(rawDep) && Array.isArray(rawDep[0])
        ? rawDep[0] : rawDep) as Array<Record<string, number | string>>;

    const depMap = new Map<number, Record<string, number | string>>();
    for (const d of depRows) depMap.set(Number(d.student_id), d);

    return rows.map((r) => {
        const d = depMap.get(r.id);
        return {
            ...r,
            dependentCounts: {
                bills: Number(d?.bills ?? 0),
                enrollments: Number(d?.enrollments ?? 0),
                idCards: Number(d?.id_cards ?? 0),
                medical: Number(d?.medical ?? 0),
                conduct: Number(d?.conduct ?? 0)
            },
            totalDependents:
                Number(d?.bills ?? 0) + Number(d?.enrollments ?? 0) +
                Number(d?.id_cards ?? 0) + Number(d?.medical ?? 0) +
                Number(d?.conduct ?? 0)
        };
    });
}

export async function blockOrphanStudents(ids: number[]) {
    const authz = await ensureReviewAdmin();
    if (authz.error) return { success: false, error: authz.error };
    const actorId = authz.actorId!;
    if (!ids.length) return { success: false, error: "No records selected" };

    await db.update(students)
        .set({ status: "pending_review" })
        .where(inArray(students.id, ids));

    await audit(actorId, "ORPHAN_STUDENT_BLOCK", ids[0], { ids, count: ids.length });
    revalidatePath("/admin/students/orphans");
    return { success: true, message: `Blocked ${ids.length} record(s) from portal access.` };
}

/**
 * Soft delete. ~70 tables reference students.id with FK constraints, so a hard
 * delete is unsafe. Soft delete preserves referential integrity and is reversible.
 */
export async function deleteOrphanStudents(ids: number[]) {
    const authz = await ensureReviewAdmin();
    if (authz.error) return { success: false, error: authz.error };
    const actorId = authz.actorId!;
    if (!ids.length) return { success: false, error: "No records selected" };

    const studentRows = await db.select({ id: students.id, userId: students.userId, matricNumber: students.matricNumber })
        .from(students)
        .where(inArray(students.id, ids));

    const userIds = studentRows.map(r => r.userId!).filter(Boolean);
    const now = new Date();
    const timestamp = Date.now();

    await db.update(students)
        .set({ deletedAt: now, status: "withdrawn" })
        .where(inArray(students.id, ids));

    if (userIds.length > 0) {
        const userList = await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, userIds));
        for (const u of userList) {
            const releasedEmail = u.email && !u.email.includes(".deleted.") ? `${u.email}.deleted.${timestamp}` : u.email;
            await db.update(users)
                .set({ deletedAt: now, email: releasedEmail })
                .where(eq(users.id, u.id));
        }
    }

    await audit(actorId, "ORPHAN_STUDENT_DELETE", ids[0], { ids, count: ids.length });
    revalidatePath("/admin/students/orphans");
    revalidatePath("/admin/students");
    return { success: true, message: `Removed ${ids.length} record(s) from the portal.` };
}

/**
 * Reset the placeholder artefacts so the record is clean and the student can be
 * re-processed through the admission flow, which will assign the real
 * department, programme, level, session and matric number.
 */
export async function enableOrphanStudents(ids: number[]) {
    const authz = await ensureReviewAdmin();
    if (authz.error) return { success: false, error: authz.error };
    const actorId = authz.actorId!;
    if (!ids.length) return { success: false, error: "No records selected" };

    await db.update(students)
        .set({
            status: "active",
            matricNumber: null,
            barcode: null,
            currentLevel: 1,
            currentSessionId: null,
            admissionSessionId: null,
            profileCompleted: false,
            isProfileLocked: false
        })
        .where(inArray(students.id, ids));

    // Reset the linked portal account to applicant so the user sees the
    // admission flow rather than the student dashboard.
    const userRows = await db.select({ userId: students.userId })
        .from(students)
        .where(and(inArray(students.id, ids), isNotNull(students.userId)));
    const userIds = userRows.map(r => r.userId!).filter(Boolean);
    if (userIds.length > 0) {
        await db.update(users)
            .set({ role: "applicant" })
            .where(and(
                inArray(users.id, userIds),
                inArray(users.role, ["student", "fresher", "applicant"])
            ));
        for (const uid of userIds) {
            await audit(actorId, "UPDATE_USER_BASE_ROLE", uid, {
                reason: "Reset incomplete admission record to applicant",
                source: "orphans.enable"
            });
        }
    }

    await audit(actorId, "ORPHAN_STUDENT_ENABLE", ids[0], { ids, count: ids.length });
    revalidatePath("/admin/students/orphans");
    revalidatePath("/admin/students");
    return {
        success: true,
        message: `Reset ${ids.length} record(s). Linked portal account(s) set to applicant so the admission flow can re-process them.`
    };
}
