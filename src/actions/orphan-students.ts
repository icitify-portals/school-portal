"use server";

import { db } from "@/db/db";
import { students, users, systemAuditLogs } from "@/db/schema";
import { eq, and, or, like, inArray, sql, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Placeholder records were historically auto-generated as `STU/{year}/{random}`
 * with `current_level = 100` and no department/programme/session. They are
 * invalid admissions artefacts and must be resolved by an administrator.
 */
const PLACEHOLDER_PREFIX = "STU/";

async function ensureReviewAdmin() {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { role: true }
    });

    const allowed = ["admin", "registrar", "admission_officer", "ict_manager"];
    if (!user || !allowed.includes(user.role || "")) {
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

export async function getOrphanStudents() {
    await ensureReviewAdmin();

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
            admissionYear: students.admissionYear,
            createdAt: sql<string>`DATE_FORMAT(students.created_at, '%Y-%m-%d %H:%i')`
        })
        .from(students)
        .leftJoin(users, eq(users.id, students.userId))
        .where(orphanFilter())
        .orderBy(sql`students.id`);

    // Dependent-record counts so the admin knows what a delete would touch.
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return [];

    const depRows = await db.execute(sql`
        SELECT s.id AS student_id,
          (SELECT COUNT(*) FROM student_bills      WHERE student_id = s.id) AS bills,
          (SELECT COUNT(*) FROM student_course_registrations WHERE student_id = s.id) AS enrollments,
          (SELECT COUNT(*) FROM id_cards        WHERE student_id = s.id) AS id_cards,
          (SELECT COUNT(*) FROM student_medical_records WHERE student_id = s.id) AS medical,
          (SELECT COUNT(*) FROM conduct_logs    WHERE student_id = s.id) AS conduct
        FROM students s WHERE s.id IN ${sql.join(ids.map((i) => sql`${i}`), sql`,`)}
    `) as unknown as Array<Record<string, number | string>>;

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
    const actorId = await ensureReviewAdmin();
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
    const actorId = await ensureReviewAdmin();
    if (!ids.length) return { success: false, error: "No records selected" };

    await db.update(students)
        .set({ deletedAt: new Date(), status: "withdrawn" })
        .where(inArray(students.id, ids));

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
    const actorId = await ensureReviewAdmin();
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

    await audit(actorId, "ORPHAN_STUDENT_ENABLE", ids[0], { ids, count: ids.length });
    revalidatePath("/admin/students/orphans");
    revalidatePath("/admin/students");
    return {
        success: true,
        message: `Reset ${ids.length} record(s). Placeholder matric numbers cleared — the admission process must now assign the real details.`
    };
}
