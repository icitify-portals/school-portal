"use strict";
"use server";

import { db } from "@/db/db";
import {
    students, programmes, departments, users, academicSessions,
    matriculationAuditLog, matriculationSettings, matriculationSequences,
    admissionApplicationsV2,
} from "@/db/schema";
import { eq, and, or, like, isNull, isNotNull, inArray, notInArray, desc, asc, sql, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { generateMatricNumber } from "@/actions/matriculation";
import { getLockedMatricStudentIds } from "@/lib/matric-visibility";
import { syncAdmittedMatricNumbers } from "@/actions/admission_v2";
import { extractBiodataFields } from "@/lib/applicant-names";
import { inArrayChunked } from "@/lib/db-helpers";

const ADMIN_ROLES = ['admin', 'superadmin', 'icitify_dev', 'dvc', 'registrar', 'admission_officer', 'ict_manager', 'ictmanager'];

async function requireAdmin() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized: Please log in");
    if (!ADMIN_ROLES.includes(session.user.role as string)) {
        throw new Error("Forbidden: You do not have permission to perform this action");
    }
    return session;
}

async function buildMatricFilterConditions(options?: {
    search?: string;
    deptId?: number;
    programmeType?: string;
    level?: number | string;
    sessionId?: number;
    matricStatus?: "all" | "assigned" | "pending";
    studentCategory?: string;
}) {
    const conditions: any[] = [isNull(students.deletedAt)];

    if (options?.search) {
        const s = `%${options.search}%`;
        conditions.push(
            or(
                like(students.firstName, s),
                like(students.lastName, s),
                like(students.otherNames, s),
                like(students.matricNumber, s),
                like(students.admissionNumber, s),
            )
        );
    }
    if (options?.deptId) {
        conditions.push(eq(students.deptId, options.deptId));
    }
    if (options?.programmeType) {
        conditions.push(eq(students.programmeType, options.programmeType as "ND" | "HND"));
    }
    if (options?.level !== undefined && options?.level !== "") {
        const lvlStr = String(options.level).trim();
        if (lvlStr === "ND 1") {
            conditions.push(
                and(
                    eq(students.currentLevel, 1),
                    eq(students.programmeType, "ND"),
                    sql`(${students.status} NOT IN ('nd_graduant','nd_graduated','hnd_graduant','hnd_graduated') OR ${students.status} IS NULL)`
                )
            );
        } else if (lvlStr === "ND 2") {
            conditions.push(
                and(
                    eq(students.currentLevel, 2),
                    eq(students.programmeType, "ND"),
                    sql`(${students.status} NOT IN ('nd_graduant','nd_graduated','hnd_graduant','hnd_graduated') OR ${students.status} IS NULL)`
                )
            );
        } else if (lvlStr === "HND 1") {
            conditions.push(
                and(
                    eq(students.currentLevel, 1),
                    eq(students.programmeType, "HND"),
                    sql`(${students.status} NOT IN ('nd_graduant','nd_graduated','hnd_graduant','hnd_graduated') OR ${students.status} IS NULL)`
                )
            );
        } else if (lvlStr === "HND 2") {
            conditions.push(
                and(
                    eq(students.currentLevel, 2),
                    eq(students.programmeType, "HND"),
                    sql`(${students.status} NOT IN ('nd_graduant','nd_graduated','hnd_graduant','hnd_graduated') OR ${students.status} IS NULL)`
                )
            );
        } else if (lvlStr === "ND_GRADUANT" || lvlStr === "ND Graduant") {
            conditions.push(sql`${students.status} IN ('nd_graduant', 'nd_graduated')`);
        } else if (lvlStr === "HND_GRADUANT" || lvlStr === "HND Graduant") {
            conditions.push(sql`${students.status} IN ('hnd_graduant', 'hnd_graduated')`);
        } else if (!isNaN(Number(lvlStr))) {
            conditions.push(eq(students.currentLevel, Number(lvlStr)));
        }
    }
    if (options?.sessionId) {
        conditions.push(
            or(
                eq(students.admissionSessionId, options.sessionId),
                eq(students.currentSessionId, options.sessionId)
            )
        );
    }
    if (options?.matricStatus === "assigned") {
        conditions.push(isNotNull(students.matricNumber));
    } else if (options?.matricStatus === "pending") {
        conditions.push(isNull(students.matricNumber));
    }

    if (options?.studentCategory && options.studentCategory !== "all") {
        const cat = options.studentCategory;
        if (cat === "active") {
            conditions.push(eq(students.status, "active"));
        } else if (cat === "inactive") {
            conditions.push(sql`${students.status} IN ('nd_graduant','hnd_graduant','nd_graduated','hnd_graduated','suspended','withdrawn','rusticated')`);
        } else if (cat === "nd_graduant") {
            conditions.push(sql`${students.status} IN ('nd_graduant','nd_graduated')`);
        } else if (cat === "hnd_graduant") {
            conditions.push(sql`${students.status} IN ('hnd_graduant','hnd_graduated')`);
        } else if (cat === "applicant") {
            const lockedSet = await getLockedMatricStudentIds();
            const lockedArr = Array.from(lockedSet);
            conditions.push(lockedArr.length > 0 ? inArray(students.id, lockedArr) : sql`1 = 0`);
        } else if (cat === "unlocked") {
            const lockedSet = await getLockedMatricStudentIds();
            const lockedArr = Array.from(lockedSet);
            if (lockedArr.length > 0) {
                conditions.push(and(eq(students.status, "active"), notInArray(students.id, lockedArr)));
            } else {
                conditions.push(eq(students.status, "active"));
            }
        }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function getMatricStudents(options?: {
    search?: string;
    deptId?: number;
    programmeType?: string;
    level?: number | string;
    sessionId?: number;
    matricStatus?: "all" | "assigned" | "pending";
    studentCategory?: string;
    page?: number;
    pageSize?: number;
}) {
    await requireAdmin();
    try {
        const page = options?.page || 1;
        const pageSize = options?.pageSize || 50;
        const offset = (page - 1) * pageSize;

        const whereClause = await buildMatricFilterConditions(options);

        const [totalRow] = await db
            .select({ value: count() })
            .from(students)
            .where(whereClause);
        const total = totalRow.value;

        const data = await db
            .select({
                id: students.id,
                firstName: students.firstName,
                lastName: students.lastName,
                otherNames: students.otherNames,
                matricNumber: students.matricNumber,
                previousMatricNumbers: students.previousMatricNumbers,
                admissionNumber: students.admissionNumber,
                admissionYear: students.admissionYear,
                programmeType: students.programmeType,
                currentLevel: students.currentLevel,
                studyMode: students.studyMode,
                status: students.status,
                deptId: students.deptId,
                programmeId: students.programmeId,
                deptName: departments.name,
                deptCode: departments.code,
                programmeName: programmes.name,
                sessionName: academicSessions.name,
            })
            .from(students)
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(academicSessions, eq(students.admissionSessionId, academicSessions.id))
            .where(whereClause)
            .orderBy(
                asc(students.matricNumber),
                asc(students.lastName),
                asc(students.firstName)
            )
            .limit(pageSize)
            .offset(offset);

        const lockedIds = await getLockedMatricStudentIds();

        return {
            students: data.map((s) => ({
                ...s,
                matricLocked: lockedIds.has(s.id),
                previousMatricNumbers: s.previousMatricNumbers
                    ? JSON.parse(s.previousMatricNumbers)
                    : [],
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    } catch (error) {
        console.error("[getMatricStudents] Failed:", error);
        return { students: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
    }
}

export async function exportAllMatricStudentsBiodata(options?: {
    search?: string;
    deptId?: number;
    programmeType?: string;
    level?: number | string;
    sessionId?: number;
    matricStatus?: "all" | "assigned" | "pending";
    studentCategory?: string;
}) {
    await requireAdmin();
    try {
        const whereClause = await buildMatricFilterConditions(options);

        const rows = await db
            .select({
                student: students,
                user: users,
                programme: programmes,
                department: departments,
                session: academicSessions,
            })
            .from(students)
            .leftJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(academicSessions, eq(students.admissionSessionId, academicSessions.id))
            .where(whereClause)
            .orderBy(
                asc(departments.name),
                asc(students.programmeType),
                asc(students.currentLevel),
                asc(students.matricNumber)
            );

        const studentIds = rows.map(r => r.student.id).filter(Boolean);
        const appByStudentId = new Map<number, any>();
        if (studentIds.length > 0) {
            const apps = await db
                .select({
                    id: admissionApplicationsV2.id,
                    studentId: admissionApplicationsV2.studentId,
                    formNumber: admissionApplicationsV2.formNumber,
                    applicationNumber: admissionApplicationsV2.applicationNumber,
                    nin: admissionApplicationsV2.nin,
                    jambRegNumber: admissionApplicationsV2.jambRegNumber,
                    data: admissionApplicationsV2.data,
                })
                .from(admissionApplicationsV2)
                .where(inArrayChunked(admissionApplicationsV2.studentId, studentIds));
            for (const a of apps) {
                if (a.studentId) appByStudentId.set(a.studentId, a);
            }
        }

        const lockedIds = studentIds.length > 0
            ? await getLockedMatricStudentIds(studentIds)
            : new Set<number>();

        const records = rows.map((r) => {
            const s = r.student;
            const u = r.user;
            const p = r.programme;
            const d = r.department;
            const app = appByStudentId.get(s.id) || null;
            let formData: any = {};
            if (app?.data) {
                try { formData = typeof app.data === "string" ? JSON.parse(app.data) : app.data; } catch {}
            }

            const bio = extractBiodataFields({
                formData,
                student: s,
                user: u,
                application: app,
            });

            const levelLabel = s.status === "nd_graduant" || s.status === "nd_graduated"
                ? "ND Graduant"
                : s.status === "hnd_graduant" || s.status === "hnd_graduated"
                    ? "HND Graduant"
                    : s.currentLevel
                        ? `${s.programmeType || p?.programmeType || ""} ${s.currentLevel}`.trim()
                        : (s.programmeType || p?.programmeType || "");

            const sessionName = r.session?.name || (s.admissionYear ? `${s.admissionYear}/${s.admissionYear + 1}` : "2026/2027");
            const isLocked = lockedIds.has(s.id);
            const matricNumber = s.matricNumber || formData.matricNumber || "";

            return {
                matricNumber,
                surname: bio.surname,
                firstName: bio.firstName,
                middleName: bio.middleName,
                gender: bio.gender,
                dob: bio.dob,
                stateOfOrigin: bio.stateOfOrigin,
                lga: bio.lga,
                nin: bio.nin,
                phone: bio.phone,
                email: bio.email,
                jambNumber: bio.jambNumber,
                level: levelLabel,
                programmeName: p?.name || "",
                deptName: d?.name || "",
                sessionName,
                matricVisibility: matricNumber
                    ? (isLocked ? "Hidden from Student (NELFUND Ready)" : "Unlocked (Fees Paid)")
                    : "Pending",
                admissionNumber: s.admissionNumber || app?.formNumber || app?.applicationNumber || "",
                status: s.status || "",
            };
        });

        return { success: true, records, total: records.length };
    } catch (error: any) {
        console.error("Failed to export matric students biodata:", error);
        return { success: false, records: [], total: 0, error: error.message || "Export failed" };
    }
}

export async function previewNextMatricNumber(options: {
    deptId?: number;
    programmeType?: string;
    studyMode?: string;
}) {
    await requireAdmin();
    try {
        const year = new Date().getFullYear();
        const result = await generateMatricNumber({
            year,
            deptId: options.deptId,
            programmeType: options.programmeType,
            studyMode: options.studyMode,
            previewOnly: true
        });
        return result;
    } catch (error) {
        console.error("[previewNextMatricNumber] Failed:", error);
        return { success: false, error: "Failed to preview" };
    }
}

export async function assignMatricNumber(studentId: number, matricNumber: string, reason?: string) {
    await requireAdmin();
    try {
        const session = await requireAdmin();
        const adminId = session.user.id;

        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId),
        });
        if (!student) return { success: false, error: "Student not found" };
        if (student.matricNumber) {
            return { success: false, error: "Student already has a matriculation number. Use Change instead." };
        }

        const trimmed = matricNumber.trim();
        if (!trimmed) return { success: false, error: "Matriculation number cannot be empty" };

        const existing = await db.query.students.findFirst({
            where: eq(students.matricNumber, trimmed),
        });
        if (existing) {
            return { success: false, error: `Duplicate: "${trimmed}" is already assigned to another student.` };
        }

        await db.transaction(async (tx) => {
            await tx.update(students)
                .set({ matricNumber: trimmed })
                .where(eq(students.id, studentId));

            await tx.insert(matriculationAuditLog).values({
                studentId,
                action: "assigned",
                oldMatric: null,
                newMatric: trimmed,
                reason: reason || null,
                performedById: adminId,
            });
        });

        revalidatePath("/admin/registrar/matriculation");
        return { success: true };
    } catch (error) {
        console.error("[assignMatricNumber] Failed:", error);
        return { success: false, error: "Failed to assign matriculation number" };
    }
}

export async function changeMatricNumber(studentId: number, newMatricNumber: string, reason: string) {
    await requireAdmin();
    try {
        const session = await requireAdmin();
        const adminId = session.user.id;

        if (!reason?.trim()) {
            return { success: false, error: "Reason is required for changing a matriculation number" };
        }

        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId),
        });
        if (!student) return { success: false, error: "Student not found" };

        const trimmed = newMatricNumber.trim();
        if (!trimmed) return { success: false, error: "Matriculation number cannot be empty" };

        if (student.matricNumber === trimmed) {
            return { success: false, error: "New number is the same as the current one" };
        }

        const existing = await db.query.students.findFirst({
            where: eq(students.matricNumber, trimmed),
        });
        if (existing) {
            return { success: false, error: `Duplicate: "${trimmed}" is already assigned to another student.` };
        }

        const oldMatric = student.matricNumber;
        const previousList: string[] = student.previousMatricNumbers
            ? JSON.parse(student.previousMatricNumbers)
            : [];
        if (oldMatric && !previousList.includes(oldMatric)) {
            previousList.push(oldMatric);
        }

        await db.transaction(async (tx) => {
            await tx.update(students)
                .set({
                    matricNumber: trimmed,
                    previousMatricNumbers: JSON.stringify(previousList),
                })
                .where(eq(students.id, studentId));

            await tx.insert(matriculationAuditLog).values({
                studentId,
                action: "changed",
                oldMatric,
                newMatric: trimmed,
                reason,
                performedById: adminId,
            });
        });

        revalidatePath("/admin/registrar/matriculation");
        return { success: true };
    } catch (error) {
        console.error("[changeMatricNumber] Failed:", error);
        return { success: false, error: "Failed to change matriculation number" };
    }
}

export async function restoreMatricNumber(studentId: number, restoreToMatric: string, reason: string) {
    await requireAdmin();
    try {
        const session = await requireAdmin();
        const adminId = session.user.id;

        if (!reason?.trim()) {
            return { success: false, error: "Reason is required for restoring a matriculation number" };
        }

        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId),
        });
        if (!student) return { success: false, error: "Student not found" };

        const trimmed = restoreToMatric.trim();
        const previousList: string[] = student.previousMatricNumbers
            ? JSON.parse(student.previousMatricNumbers)
            : [];

        if (!previousList.includes(trimmed)) {
            return { success: false, error: `"${trimmed}" is not in the student's previous matriculation numbers` };
        }

        const duplicate = await db.query.students.findFirst({
            where: and(
                eq(students.matricNumber, trimmed),
                sql`${students.id} != ${studentId}`
            ),
        });
        if (duplicate) {
            return { success: false, error: `Cannot restore: "${trimmed}" is currently assigned to another student.` };
        }

        const oldMatric = student.matricNumber;
        const updatedPrevious = previousList.filter((m) => m !== trimmed);

        await db.transaction(async (tx) => {
            await tx.update(students)
                .set({
                    matricNumber: trimmed,
                    previousMatricNumbers: JSON.stringify(updatedPrevious),
                })
                .where(eq(students.id, studentId));

            await tx.insert(matriculationAuditLog).values({
                studentId,
                action: "restored",
                oldMatric,
                newMatric: trimmed,
                reason,
                performedById: adminId,
            });
        });

        revalidatePath("/admin/registrar/matriculation");
        return { success: true };
    } catch (error) {
        console.error("[restoreMatricNumber] Failed:", error);
        return { success: false, error: "Failed to restore matriculation number" };
    }
}

export async function getMatricAuditLog(options?: {
    search?: string;
    action?: string;
    page?: number;
    pageSize?: number;
}) {
    await requireAdmin();
    try {
        const page = options?.page || 1;
        const pageSize = options?.pageSize || 50;
        const offset = (page - 1) * pageSize;

        const conditions: any[] = [];

        if (options?.action && options.action !== "all") {
            conditions.push(eq(matriculationAuditLog.action, options.action as any));
        }

        if (options?.search) {
            const s = `%${options.search}%`;
            conditions.push(
                or(
                    like(students.firstName, s),
                    like(students.lastName, s),
                    like(students.matricNumber, s),
                    like(matriculationAuditLog.newMatric, s),
                    like(matriculationAuditLog.oldMatric, s),
                    like(users.name, s),
                )
            );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [totalRow] = await db
            .select({ value: count() })
            .from(matriculationAuditLog)
            .leftJoin(students, eq(matriculationAuditLog.studentId, students.id))
            .leftJoin(users, eq(matriculationAuditLog.performedById, users.id))
            .where(whereClause);
        const total = totalRow.value;

        const data = await db
            .select({
                id: matriculationAuditLog.id,
                action: matriculationAuditLog.action,
                oldMatric: matriculationAuditLog.oldMatric,
                newMatric: matriculationAuditLog.newMatric,
                reason: matriculationAuditLog.reason,
                createdAt: matriculationAuditLog.createdAt,
                studentId: students.id,
                studentFirstName: students.firstName,
                studentLastName: students.lastName,
                studentDeptId: students.deptId,
                deptName: departments.name,
                performedById: users.id,
                performedByName: users.name,
            })
            .from(matriculationAuditLog)
            .leftJoin(students, eq(matriculationAuditLog.studentId, students.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(users, eq(matriculationAuditLog.performedById, users.id))
            .where(whereClause)
            .orderBy(desc(matriculationAuditLog.createdAt))
            .limit(pageSize)
            .offset(offset);

        return {
            logs: data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    } catch (error) {
        console.error("[getMatricAuditLog] Failed:", error);
        return { logs: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
    }
}

export async function batchAssignMatricNumbers(year: number) {
    await requireAdmin();
    try {
        const session = await requireAdmin();
        const adminId = session.user.id;

        // First sync any admitted V2 applications that do not yet have pre-generated matriculation numbers
        const syncRes = await syncAdmittedMatricNumbers();

        // Fetch all active students for the given admission year who DO NOT have a matric number
        const pendingStudents = await db.query.students.findMany({
            where: and(
                eq(students.admissionYear, year),
                eq(students.status, "active"),
                isNull(students.matricNumber)
            )
        });

        if (pendingStudents.length === 0) {
            const preGenCount = syncRes.success ? (syncRes.generatedCount || 0) : 0;
            return {
                success: true,
                message: preGenCount > 0
                    ? `Pre-generated ${preGenCount} matriculation numbers for admitted candidates.`
                    : "All admitted and active students for that year already have matriculation numbers assigned.",
                count: preGenCount
            };
        }

        let assignedCount = 0;

        for (const student of pendingStudents) {
            // Generate Matric Number
            const genRes = await generateMatricNumber({
                year,
                deptId: student.deptId || undefined,
                studyMode: student.studyMode || undefined,
                programmeType: student.programmeType || undefined
            });

            if (genRes.success && genRes.matricNumber) {
                await db.transaction(async (tx) => {
                    await tx.update(students)
                        .set({ matricNumber: genRes.matricNumber })
                        .where(eq(students.id, student.id));

                    await tx.insert(matriculationAuditLog).values({
                        studentId: student.id,
                        action: "assigned",
                        oldMatric: null,
                        newMatric: genRes.matricNumber,
                        reason: "Batch Assignment",
                        performedById: adminId,
                    });
                });
                assignedCount++;
            }
        }

        revalidatePath("/admin/registrar/matriculation");
        return { success: true, message: `Successfully assigned ${assignedCount} matriculation numbers.`, count: assignedCount };
    } catch (error) {
        console.error("[batchAssignMatricNumbers] Failed:", error);
        return { success: false, error: "Failed to run batch assignment." };
    }
}

export async function getStudentMatricHistory(studentId: number) {
    await requireAdmin();
    try {
        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId),
        });
        if (!student) return null;

        const logs = await db
            .select({
                id: matriculationAuditLog.id,
                action: matriculationAuditLog.action,
                oldMatric: matriculationAuditLog.oldMatric,
                newMatric: matriculationAuditLog.newMatric,
                reason: matriculationAuditLog.reason,
                createdAt: matriculationAuditLog.createdAt,
                performedByName: users.name,
            })
            .from(matriculationAuditLog)
            .leftJoin(users, eq(matriculationAuditLog.performedById, users.id))
            .where(eq(matriculationAuditLog.studentId, studentId))
            .orderBy(desc(matriculationAuditLog.createdAt));

        return {
            student: {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                matricNumber: student.matricNumber,
                previousMatricNumbers: student.previousMatricNumbers
                    ? JSON.parse(student.previousMatricNumbers)
                    : [],
            },
            logs,
        };
    } catch (error) {
        console.error("[getStudentMatricHistory] Failed:", error);
        return null;
    }
}

export async function getLastMatricNumbers() {
    try {
        // Get all non-deleted students with matric numbers
        const matriculated = await db.select({
            matricNumber: students.matricNumber,
            programmeType: students.programmeType,
        }).from(students)
          .where(and(
              isNull(students.deletedAt),
              isNotNull(students.matricNumber),
              sql`${students.matricNumber} <> ''`
          ));

        const ndStudents = matriculated.filter(s => {
            const m = s.matricNumber || '';
            return s.programmeType === 'ND' || m.includes('/ND/') || m.startsWith('ND');
        });

        const hndStudents = matriculated.filter(s => {
            const m = s.matricNumber || '';
            return s.programmeType === 'HND' || m.includes('/HND/') || m.startsWith('HND') || m.includes('DPP/HND');
        });

        // Sort 2026 matrics first so the top card shows the latest 2026 ND & HND matric numbers
        const sort2026First = (a: any, b: any) => {
            const ma = String(a.matricNumber || '');
            const mb = String(b.matricNumber || '');
            const a26 = ma.includes('/2026/') ? 1 : 0;
            const b26 = mb.includes('/2026/') ? 1 : 0;
            if (a26 !== b26) return b26 - a26;
            return mb.localeCompare(ma, undefined, { numeric: true });
        };

        const lastND = [...ndStudents].sort(sort2026First)[0] || null;
        const lastHND = [...hndStudents].sort(sort2026First)[0] || null;

        return {
            nd: lastND ? { matricNumber: lastND.matricNumber, count: ndStudents.length } : { matricNumber: null, count: ndStudents.length },
            hnd: lastHND ? { matricNumber: lastHND.matricNumber, count: hndStudents.length } : { matricNumber: null, count: hndStudents.length },
        };
    } catch (error) {
        return { nd: { matricNumber: null, count: 0 }, hnd: { matricNumber: null, count: 0 } };
    }
}
