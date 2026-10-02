"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import {
    students, users, programmes, departments, academicSessions,
    semesterSummaries, promotionCriteria, promotionLogs, enrollments, results, courses,
    academicCarryOvers, annualSummaries
} from "@/db/schema";
import { eq, and, desc, sql, count, sum, or, like, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";
import { PromotionService } from "@/services/PromotionService";

// --- CRITERIA ---

export async function getDepartmentCriteria(deptId: number, sessionId?: number) {
    try {
        const rows = await db.select().from(promotionCriteria)
            .where(eq(promotionCriteria.deptId, deptId))
            .orderBy(desc(promotionCriteria.createdAt));

        const scoped = sessionId ? rows.find(r => r.sessionId === sessionId) : undefined;
        const global = rows.find(r => r.sessionId === null);
        const criteria = scoped || global;

        if (criteria) {
            return {
                success: true,
                criteria: {
                    ...criteria,
                    additionalRules: parseRulesArray(criteria.additionalRules),
                    ruleFlags: parseRuleFlags(criteria.additionalRules),
                },
            };
        }

        // Return university defaults
        return {
            success: true,
            criteria: {
                id: null,
                deptId,
                minCgpa: "1.00",
                minCreditsPerSession: 25,
                additionalRules: [],
                ruleFlags: { allowAutoWithdraw: false },
                isDefault: true,
            },
        };
    } catch (error) {
        console.error("Get Criteria Error:", error);
        return { error: "Failed to fetch criteria." };
    }
}

export async function saveDepartmentCriteria(deptId: number, data: {
    minCgpa: number;
    minCreditsPerSession: number;
    additionalRules: { field: string; operator: string; value: number; message: string }[];
    ruleFlags?: Record<string, unknown>;
    sessionId?: number | null;
}) {
    try {
        const allowed = await hasPermission("academic.promotion.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { error: "Unauthorized: Insufficient permissions to save promotion criteria" };
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        if (!Number.isFinite(data.minCgpa) || data.minCgpa < 0 || data.minCgpa > 5) {
            return { error: "Minimum CGPA must be between 0.00 and 5.00." };
        }
        if (!Number.isInteger(data.minCreditsPerSession) || data.minCreditsPerSession < 0) {
            return { error: "Minimum credits must be a whole number of 0 or more." };
        }

        const targetSessionId = data.sessionId ?? null;

        // Upsert on the (dept, session) pair
        const existingRows = await db.select().from(promotionCriteria)
            .where(eq(promotionCriteria.deptId, deptId));
        const existing = existingRows.find(r => r.sessionId === targetSessionId);

        if (existing) {
            await db.update(promotionCriteria)
                .set({
                    minCgpa: data.minCgpa.toFixed(2),
                    minCreditsPerSession: data.minCreditsPerSession,
                    additionalRules: serializeAdditionalRules(data.additionalRules, data.ruleFlags || {}),
                })
                .where(eq(promotionCriteria.id, existing.id));
        } else {
            await db.insert(promotionCriteria).values({
                deptId,
                sessionId: targetSessionId,
                minCgpa: data.minCgpa.toFixed(2),
                minCreditsPerSession: data.minCreditsPerSession,
                additionalRules: serializeAdditionalRules(data.additionalRules, data.ruleFlags || {}),
            });
        }

        revalidatePath("/admin/promotion/criteria");
        return { success: true, message: "Criteria saved." };
    } catch (error) {
        console.error("Save Criteria Error:", error);
        return { error: "Failed to save criteria." };
    }
}

// --- PROMOTION PREVIEW ---

interface StudentEvaluation {
    studentId: number;
    studentName: string;
    matricNumber: string | null;
    deptName: string;
    deptId: number | null;
    programmeName: string;
    studentProgrammeType: string;
    currentLevel: number;
    maxLevel: number;
    cgpa: number;
    creditsEarned: number;
    decision: 'promoted' | 'withdrawn' | 'nd_graduant' | 'hnd_graduant' | 'repeat' | 'concession' | 'pending_review';
    reasons: string[];
    newLevel: number;
    /** False when the student has no computed summary for the session being promoted. */
    hasSummary: boolean;
    /** Criteria actually applied, captured for the audit trail. */
    criteriaUsed: { minCgpa: number; minCredits: number; source: string } | null;
}

interface AppliedCriteria {
    minCgpa: number;
    minCredits: number;
    source: string;
    additionalRules: Record<string, unknown>;
}

const DEFAULT_CRITERIA: AppliedCriteria = {
    minCgpa: 1.0,
    minCredits: 25,
    source: 'university-default',
    additionalRules: {},
};

/**
 * `additional_rules` has historically held a JSON array of rule objects, and now also
 * carries scalar switches such as `allowAutoWithdraw`. Both shapes are supported:
 *   legacy:  [{ field, operator, value, message }]
 *   current: { allowAutoWithdraw?: boolean, rules?: [...] }
 */
function parseRuleFlags(raw: string | null): Record<string, unknown> {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) || parsed === null || typeof parsed !== 'object') return {};
        return parsed as Record<string, unknown>;
    } catch {
        return {};
    }
}

function parseRulesArray(raw: string | null): { field: string; operator: string; value: number; message: string }[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rules)) return parsed.rules;
        return [];
    } catch {
        return [];
    }
}

function serializeAdditionalRules(
    rules: { field: string; operator: string; value: number; message: string }[],
    flags: Record<string, unknown>
): string {
    const hasFlags = Object.keys(flags).some(k => k !== 'rules' && flags[k] !== undefined);
    if (!hasFlags) return JSON.stringify(rules);
    return JSON.stringify({ ...flags, rules });
}

async function loadCriteriaMap(sessionId: number): Promise<Map<number, AppliedCriteria>> {
    const rows = await db.select().from(promotionCriteria);
    const map = new Map<number, AppliedCriteria>();
    // A session-scoped row wins over a global (session_id IS NULL) row.
    for (const row of rows) {
        if (row.sessionId !== null && row.sessionId !== sessionId) continue;
        const source = row.sessionId !== null ? `criteria#${row.id} (session ${row.sessionId})` : `criteria#${row.id} (global)`;
        map.set(row.deptId, {
            minCgpa: parseFloat(String(row.minCgpa || '1.00')),
            minCredits: row.minCreditsPerSession || 25,
            source,
            additionalRules: parseRuleFlags(row.additionalRules),
        });
    }
    return map;
}

function formatCriteriaSnapshot(criteria: AppliedCriteria): string {
    return `criteria[source=${criteria.source};minCgpa=${criteria.minCgpa.toFixed(2)};minCredits=${criteria.minCredits}]`;
}

async function evaluateStudents(sessionId: number): Promise<StudentEvaluation[]> {
    // Get all active students with their programme and department
    const activeStudents = await db.select({
        studentId: students.id,
        studentName: users.name,
        matricNumber: students.matricNumber,
        deptId: students.deptId,
        deptName: departments.name,
        programmeId: students.programmeId,
        programmeName: programmes.name,
        studentProgrammeType: students.programmeType,
        currentLevel: students.currentLevel,
        durationYears: programmes.durationYears,
    })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .leftJoin(programmes, eq(students.programmeId, programmes.id))
        .where(eq(students.status, 'active'));

    // Get all department criteria (session-scoped rows preferred)
    const criteriaMap = await loadCriteriaMap(sessionId);

    // Get semester summaries for this session
    const summaries = await db.select().from(semesterSummaries)
        .where(eq(semesterSummaries.sessionId, sessionId));

    // Group summaries by student
    const summaryMap = new Map<number, typeof summaries>();
    for (const s of summaries) {
        if (!summaryMap.has(s.studentId)) summaryMap.set(s.studentId, []);
        summaryMap.get(s.studentId)!.push(s);
    }

    const evaluations: StudentEvaluation[] = [];

    for (const student of activeStudents) {
        const maxLevel = (student.durationYears || 2);
        const studentSummaries = summaryMap.get(student.studentId) || [];

        // Sum credits earned across both semesters for this session
        const creditsEarned = studentSummaries.reduce((total, s) => total + (s.tce || 0), 0);

        // Get latest CGPA (from semester 2 if available, else semester 1)
        const sem2 = studentSummaries.find(s => s.semester === '2');
        const sem1 = studentSummaries.find(s => s.semester === '1');
        const latestSummary = sem2 || sem1;
        const hasSummary = studentSummaries.length > 0;
        const cgpa = hasSummary ? parseFloat(String(latestSummary!.cgpa || '0')) : 0;

        const currentLevel = student.currentLevel || 1;
        const reasons: string[] = [];
        const criteria: AppliedCriteria = (student.deptId ? criteriaMap.get(student.deptId) : null) || DEFAULT_CRITERIA;
        const allowAutoWithdraw = criteria.additionalRules.allowAutoWithdraw === true;

        let decision: StudentEvaluation['decision'] = 'promoted';
        let newLevel = currentLevel;

        // SAFETY: a student with no computed summary for this session is never promoted,
        // repeated, withdrawn or graduated. Absence of results is not a result.
        if (!hasSummary) {
            evaluations.push({
                studentId: student.studentId,
                studentName: student.studentName,
                matricNumber: student.matricNumber,
                deptName: student.deptName || 'Unknown',
                deptId: student.deptId,
                programmeName: student.programmeName || 'Unknown',
                studentProgrammeType: student.studentProgrammeType,
                currentLevel,
                maxLevel,
                cgpa,
                creditsEarned,
                decision: 'pending_review',
                reasons: ['No semester summary for this session — held for manual review, no level change applied.'],
                newLevel: currentLevel,
                hasSummary: false,
                criteriaUsed: null,
            });
            continue;
        }

        if (!student.programmeId) {
            // K-12 Logic
            const [annualSummary] = await db.select().from(annualSummaries)
                .where(and(eq(annualSummaries.studentId, student.studentId), eq(annualSummaries.sessionId, sessionId)))
                .limit(1);
            const average = annualSummary ? parseFloat(annualSummary.averageScore?.toString() || "0") : 0;

            if (average < 50) {
                decision = 'repeat';
                reasons.push(`Annual Average (${average.toFixed(2)}%) is below the required 50% threshold.`);
            } else if ((student.currentLevel || 0) >= 400) {
                const hasPassedCore = await (PromotionService as any).hasPassedCoreSubjects(student.studentId, sessionId);
                if (!hasPassedCore) {
                    decision = 'repeat';
                    reasons.push(`Passed overall average but failed core subjects (Math & English) required for Senior Secondary.`);
                }
            }
        } else {
            // Tertiary (University) Logic
            const failedCgpa = cgpa < criteria.minCgpa;
            const failedCredits = creditsEarned < criteria.minCredits;

            if (failedCgpa && failedCredits) {
                if (allowAutoWithdraw) {
                    decision = 'withdrawn';
                    reasons.push(`CGPA (${cgpa.toFixed(2)}) < ${criteria.minCgpa.toFixed(2)} and credits (${creditsEarned}) < ${criteria.minCredits} — university minimum not met`);
                } else {
                    decision = 'repeat';
                    reasons.push(`CGPA (${cgpa.toFixed(2)}) and credits (${creditsEarned}) both below minimum — held for review (auto-withdrawal disabled)`);
                }
            } else {
                if (failedCgpa) {
                    decision = 'repeat';
                    reasons.push(`CGPA (${cgpa.toFixed(2)}) below minimum (${criteria.minCgpa.toFixed(2)})`);
                }
                if (failedCredits) {
                    decision = 'repeat';
                    reasons.push(`Credits earned (${creditsEarned}) below minimum (${criteria.minCredits})`);
                }
            }
        }

        if (decision === 'promoted') {
            if (currentLevel >= maxLevel) {
                decision = student.studentProgrammeType === 'HND' ? 'hnd_graduant' : 'nd_graduant';
                reasons.push(`Completed max level (${maxLevel}) with a published summary — eligible for graduation`);
                newLevel = currentLevel;
            } else {
                newLevel = currentLevel + 1;
                reasons.push(`Promoted from ${currentLevel} to ${newLevel}`);
            }
        } else if (decision === 'repeat') {
            newLevel = currentLevel;
            if (reasons.length === 0) reasons.push('Repeating current level');
        }

        evaluations.push({
            studentId: student.studentId,
            studentName: student.studentName,
            matricNumber: student.matricNumber,
            deptName: student.deptName || 'Unknown',
            deptId: student.deptId,
            programmeName: student.programmeName || 'Unknown',
            studentProgrammeType: student.studentProgrammeType,
            currentLevel,
            maxLevel,
            cgpa,
            creditsEarned,
            decision,
            reasons,
            newLevel,
            hasSummary,
            criteriaUsed: { minCgpa: criteria.minCgpa, minCredits: criteria.minCredits, source: criteria.source },
        });
    }

    return evaluations;
}

export async function getPromotionPreview(sessionId: number) {
    try {
        const allowed = await hasPermission("academic.promotion.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { error: "Unauthorized: Insufficient permissions to view promotion preview" };
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        const evaluations = await evaluateStudents(sessionId);

        const summary = {
            total: evaluations.length,
            promoted: evaluations.filter(e => e.decision === 'promoted').length,
            graduated: evaluations.filter(e => e.decision === 'nd_graduant' || e.decision === 'hnd_graduant').length,
            withdrawn: evaluations.filter(e => e.decision === 'withdrawn').length,
            repeat: evaluations.filter(e => e.decision === 'repeat').length,
            pendingReview: evaluations.filter(e => e.decision === 'pending_review').length,
        };

        return { success: true, evaluations, summary };
    } catch (error) {
        console.error("Preview Error:", error);
        return { error: "Failed to generate promotion preview." };
    }
}

// --- RUN PROMOTION ---

export async function runPromotion(sessionId: number, targetSessionId: number, overrides?: Record<number, { decision: string, reason?: string }>) {
    try {
        const allowed = await hasPermission("academic.promotion.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { error: "Unauthorized: Insufficient permissions to run student promotion" };
        const authSession = await auth();
        if (!authSession?.user?.id) return { error: "Unauthorized" };

        const evaluations = await evaluateStudents(sessionId);
        const promotedBy = parseInt(authSession.user.id);

        let promoted = 0, graduated = 0, withdrawn = 0, repeated = 0, concessional = 0, skipped = 0;

        for (const evaluation of evaluations) {
            // SAFETY: never act on a student who has no summary for this session.
            if (evaluation.decision === 'pending_review') {
                skipped++;
                continue;
            }

            // Apply Manual Override if present
            let finalDecision = evaluation.decision;
            let finalReasons = evaluation.reasons.join('; ');
            let finalNewLevel = evaluation.newLevel;

            if (evaluation.criteriaUsed) {
                finalReasons = `${finalReasons} | ${formatCriteriaSnapshot({
                    minCgpa: evaluation.criteriaUsed.minCgpa,
                    minCredits: evaluation.criteriaUsed.minCredits,
                    source: evaluation.criteriaUsed.source,
                    additionalRules: {},
                })}`;
            }

            if (overrides && overrides[evaluation.studentId]) {
                const override = overrides[evaluation.studentId];
                finalDecision = override.decision as any;
                if (override.reason) finalReasons = `[OVERRIDE] ${override.reason} (Original: ${finalReasons})`;

                // Adjust level if decision changed to promoted or concession
                if (finalDecision === 'promoted' || finalDecision === 'concession') {
                    finalNewLevel = evaluation.currentLevel + 1;
                } else if (finalDecision === 'repeat') {
                    finalNewLevel = evaluation.currentLevel;
                }
            }

            // Log the decision
            await db.insert(promotionLogs).values({
                studentId: evaluation.studentId,
                fromLevel: evaluation.currentLevel,
                toLevel: finalNewLevel,
                fromSessionId: sessionId,
                toSessionId: finalDecision === 'withdrawn' ? null : targetSessionId,
                decision: finalDecision,
                cgpa: evaluation.cgpa.toFixed(2),
                creditsEarned: evaluation.creditsEarned,
                reason: finalReasons,
                promotedBy,
            });

            // Apply the decision
            switch (finalDecision) {
                case 'promoted':
                case 'concession':
                    await db.update(students)
                        .set({ currentLevel: finalNewLevel })
                        .where(eq(students.id, evaluation.studentId));
                    if (finalDecision === 'promoted') promoted++; else concessional++;
                    break;

                case 'nd_graduant':
                case 'hnd_graduant':
                    const [pendingCarryOver] = await db.select().from(academicCarryOvers).where(and(
                        eq(academicCarryOvers.studentId, evaluation.studentId),
                        eq(academicCarryOvers.status, 'pending')
                    )).limit(1);

                    if (pendingCarryOver) {
                        // Spill-over: hold the student at their final level as active.
                        // The students table has no academic_status/spill_over columns,
                        // so the carry-over is recorded in the audit log only.
                        await db.update(students)
                            .set({ currentLevel: evaluation.currentLevel })
                            .where(eq(students.id, evaluation.studentId));
                        await db.insert(promotionLogs).values({
                            studentId: evaluation.studentId,
                            fromLevel: evaluation.currentLevel,
                            toLevel: evaluation.currentLevel,
                            fromSessionId: sessionId,
                            toSessionId: targetSessionId,
                            decision: 'repeat',
                            cgpa: evaluation.cgpa.toFixed(2),
                            creditsEarned: evaluation.creditsEarned,
                            reason: `[SPILLOVER] Final year reached with ${pendingCarryOver} pending academic carry-over(s); held at level ${evaluation.currentLevel} pending completion.`,
                            promotedBy,
                        });
                        repeated++;
                    } else {
                        const gradStatus = evaluation.studentProgrammeType === 'HND' ? 'hnd_graduant' : 'nd_graduant';
                        await db.update(students)
                            .set({
                                status: gradStatus,
                                currentLevel: evaluation.currentLevel,
                            })
                            .where(eq(students.id, evaluation.studentId));
                        // Also update user status
                        const [graduatingStudent] = await db.select({ userId: students.userId })
                            .from(students).where(eq(students.id, evaluation.studentId)).limit(1);
                        if (graduatingStudent?.userId) {
                            await db.update(users)
                                .set({ status: gradStatus })
                                .where(eq(users.id, graduatingStudent.userId));
                        }
                        graduated++;
                    }
                    break;

                case 'withdrawn':
                    await db.update(students)
                        .set({ status: 'withdrawn' })
                        .where(eq(students.id, evaluation.studentId));
                    const [withdrawnStudent] = await db.select({ userId: students.userId })
                        .from(students).where(eq(students.id, evaluation.studentId)).limit(1);
                    if (withdrawnStudent?.userId) {
                        await db.update(users)
                            .set({ status: 'withdrawn' })
                            .where(eq(users.id, withdrawnStudent.userId));
                    }
                    withdrawn++;
                    break;

                case 'repeat':
                    // Keep same level — no change needed to student record
                    repeated++;
                    break;
            }
        }

        revalidatePath("/admin/promotion");
        revalidatePath("/admin/students");

        return {
            success: true,
            message: `Promotion complete: ${promoted} promoted, ${concessional} concessional, ${graduated} graduated, ${withdrawn} withdrawn, ${repeated} repeating, ${skipped} held for review (no summary).`,
            summary: { promoted, concessional, graduated, withdrawn, repeated, pendingReview: skipped, total: evaluations.length },
        };
    } catch (error) {
        console.error("Run Promotion Error:", error);
        return { error: "Failed to run promotion." };
    }
}

// --- LOGS ---

export async function getPromotionLogs(sessionId?: number) {
    try {
        const allowed = await hasPermission("academic.promotion.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar") || await hasRole("hod") || await hasRole("dean");
        if (!allowed) return { error: "Unauthorized: Insufficient permissions to view promotion logs" };
        let logsQuery = db.select({
            id: promotionLogs.id,
            studentName: users.name,
            matricNumber: students.matricNumber,
            fromLevel: promotionLogs.fromLevel,
            toLevel: promotionLogs.toLevel,
            decision: promotionLogs.decision,
            cgpa: promotionLogs.cgpa,
            creditsEarned: promotionLogs.creditsEarned,
            reason: promotionLogs.reason,
            createdAt: promotionLogs.createdAt,
        })
            .from(promotionLogs)
            .innerJoin(students, eq(promotionLogs.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id));

        let logs;
        if (sessionId) {
            logs = await logsQuery
                .where(eq(promotionLogs.fromSessionId, sessionId))
                .orderBy(desc(promotionLogs.createdAt));
        } else {
            logs = await logsQuery.orderBy(desc(promotionLogs.createdAt)).limit(500);
        }

        return { success: true, logs };
    } catch (error) {
        console.error("Get Logs Error:", error);
        return { error: "Failed to fetch promotion logs." };
    }
}

// --- HOD COUNCIL REPORTS ---

export async function generateHodReport(deptId: number, sessionId: number, type: 'non_final_year' | 'final_year') {
    try {
        const allowed = await hasPermission("academic.promotion.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar") || await hasRole("hod") || await hasRole("dean");
        if (!allowed) return { error: "Unauthorized: Insufficient permissions to generate HOD promotion reports" };
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        // Get department + faculty info
        const [dept] = await db.select({
            id: departments.id,
            name: departments.name,
            code: departments.code,
            facultyId: departments.facultyId,
        }).from(departments).where(eq(departments.id, deptId)).limit(1);
        if (!dept) return { error: "Department not found." };

        // Get faculty name
        let facultyName = "Faculty";
        if (dept.facultyId) {
            const { faculties } = await import("@/db/schema");
            const [fac] = await db.select({ name: faculties.name }).from(faculties)
                .where(eq(faculties.id, dept.facultyId)).limit(1);
            if (fac) facultyName = fac.name;
        }

        // Get academic session info
        const [acadSession] = await db.select().from(academicSessions)
            .where(eq(academicSessions.id, sessionId)).limit(1);

        // Get students in this department with admission info
        const deptStudents = await db.select({
            studentId: students.id,
            studentName: users.name,
            firstName: students.firstName,
            lastName: students.lastName,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            admissionYear: students.admissionYear,
            modeOfEntry: students.modeOfEntry,
            programmeName: programmes.name,
            durationYears: programmes.durationYears,
            status: students.status,
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .where(and(
                eq(students.deptId, deptId),
                eq(students.status, 'active')
            ));

        // Filter by final/non-final year
        const filteredStudents = deptStudents.filter(s => {
            const maxLevel = (s.durationYears || 2);
            const isFinalYear = (s.currentLevel || 1) >= maxLevel;
            return type === 'final_year' ? isFinalYear : !isFinalYear;
        });

        const studentIds = filteredStudents.map(s => s.studentId);
        if (studentIds.length === 0) {
            return {
                success: true,
                report: {
                    department: dept,
                    facultyName,
                    session: acadSession,
                    type,
                    levelGroups: [],
                    generatedAt: new Date(),
                },
            };
        }

        // Get ALL semester summaries for cumulative calculation
        const allSummaries = await db.select({
            studentId: semesterSummaries.studentId,
            sessionId: semesterSummaries.sessionId,
            semester: semesterSummaries.semester,
            tcr: semesterSummaries.tcr,
            tce: semesterSummaries.tce,
            twgp: semesterSummaries.twgp,
            gpa: semesterSummaries.gpa,
            cgpa: semesterSummaries.cgpa,
        })
            .from(semesterSummaries)
            .where(sql`${semesterSummaries.studentId} IN (${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})`)
            .orderBy(semesterSummaries.sessionId, semesterSummaries.semester);

        // Group summaries by student
        const summaryMap = new Map<number, any[]>();
        for (const s of allSummaries) {
            if (!summaryMap.has(s.studentId)) summaryMap.set(s.studentId, []);
            summaryMap.get(s.studentId)!.push(s);
        }

        // Get promotion criteria for this department
        const [criteria] = await db.select().from(promotionCriteria)
            .where(eq(promotionCriteria.deptId, deptId)).limit(1);
        const minCgpa = criteria ? parseFloat(String(criteria.minCgpa || '1.00')) : 1.0;
        const minCredits = criteria?.minCreditsPerSession || 25;

        // Build student report data
        const reportStudents = filteredStudents.map(s => {
            const studentSummaries = summaryMap.get(s.studentId) || [];

            // Cumulative totals across ALL sessions
            const cumulativeUnitsRegistered = studentSummaries.reduce((t: number, sm: any) => t + (sm.tcr || 0), 0);
            const cumulativeUnitsPassed = studentSummaries.reduce((t: number, sm: any) => t + (sm.tce || 0), 0);
            const unitsNotIn = cumulativeUnitsRegistered - cumulativeUnitsPassed;

            // Using `twgp` assuming it exists on semesterSummaries, else calculating fallback assuming gpa=twgp for now.
            // Note: DB schema for semesterSummaries might need 'twgp' but we will defensively check.
            const totalWgp = studentSummaries.reduce((t: number, sm: any) => t + (sm.twgp || 0), 0);

            // Latest CGPA
            const latestCgpa = studentSummaries.length > 0
                ? parseFloat(String(studentSummaries[studentSummaries.length - 1].cgpa || '0'))
                : 0;

            // Session-specific credits earned (for this session only)
            const sessionSummaries = studentSummaries.filter((sm: any) => sm.sessionId === sessionId);
            const sessionCreditsEarned = sessionSummaries.reduce((t: number, sm: any) => t + (sm.tce || 0), 0);

            // Determine remarks
            let remarks = 'PASSED';
            if (latestCgpa <= 1.0 && sessionCreditsEarned <= 25) {
                remarks = 'WITHDRAWN';
            } else if (latestCgpa < minCgpa || sessionCreditsEarned < minCredits) {
                remarks = 'REPEAT';
            }

            // Determine Class of Degree (only relevant usually for Final Year, but we can compute it for all)
            let classOfDegree = '---';
            if (latestCgpa >= 4.50) classOfDegree = '1st Class';
            else if (latestCgpa >= 3.50) classOfDegree = '2nd Class Upper';
            else if (latestCgpa >= 2.40) classOfDegree = '2nd Class Lower';
            else if (latestCgpa >= 1.50) classOfDegree = '3rd Class';
            else if (latestCgpa > 0) classOfDegree = 'Pass';

            // Mock Faculty/Dept Requirements (Passed if unitsNotIn == 0 roughly)
            const facultyReq = unitsNotIn === 0 ? 'YES' : 'NO';
            const deptReq = unitsNotIn === 0 ? 'YES' : 'NO';

            // Format student name: SURNAME Firstname Middlename
            const nameParts = (s.studentName || '').trim().split(/\s+/);
            let formattedName = s.studentName || '';
            if (s.lastName && s.firstName) {
                formattedName = `${s.lastName.toUpperCase()} ${s.firstName}`;
            } else if (nameParts.length >= 2) {
                // Use last word as surname
                const surname = nameParts[nameParts.length - 1];
                const otherNames = nameParts.slice(0, -1).join(' ');
                formattedName = `${surname.toUpperCase()} ${otherNames}`;
            }

            // Year of entry — use admissionYear or derive from matric
            const yearOfEntry = s.admissionYear
                ? `${s.admissionYear}/${s.admissionYear + 1}`
                : '—';

            return {
                studentId: s.studentId,
                matricNumber: s.matricNumber || '—',
                yearOfEntry,
                modeOfEntry: s.modeOfEntry || 'UTME',
                studentName: formattedName,
                sortName: (s.lastName || nameParts[nameParts.length - 1] || '').toUpperCase(),
                currentLevel: s.currentLevel || 1,
                cumulativeUnitsRegistered,
                cumulativeUnitsPassed,
                unitsNotIn: Math.max(0, unitsNotIn),
                totalWgp,
                cgpa: latestCgpa,
                classOfDegree,
                facultyReq,
                deptReq,
                remarks,
            };
        });

        // Sort alphabetically by surname
        reportStudents.sort((a, b) => a.sortName.localeCompare(b.sortName));

        // Group by level
        const levelMap = new Map<number, any[]>();
        for (const s of reportStudents) {
            if (!levelMap.has(s.currentLevel)) levelMap.set(s.currentLevel, []);
            levelMap.get(s.currentLevel)!.push(s);
        }

        const levelGroups = Array.from(levelMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([level, students]) => ({ level, students }));

        return {
            success: true,
            report: {
                department: dept,
                facultyName,
                session: acadSession,
                type,
                levelGroups,
                generatedAt: new Date(),
            },
        };
    } catch (error) {
        console.error("HOD Report Error:", error);
        return { error: "Failed to generate report." };
    }
}

// --- ACADEMIC SESSIONS HELPER ---

export async function getAcademicSessionsList() {
    try {
        const sessions = await db.select().from(academicSessions)
            .orderBy(desc(academicSessions.id));
        return { success: true, sessions };
    } catch (error) {
        console.error("Get Sessions Error:", error);
        return { error: "Failed to fetch sessions." };
    }
}

export async function getDepartmentsList() {
    try {
        const depts = await db.select().from(departments)
            .orderBy(departments.name);
        return { success: true, departments: depts };
    } catch (error) {
        console.error("Get Departments Error:", error);
        return { error: "Failed to fetch departments." };
    }
}

// --- MANUAL / BULK LEVEL ADJUSTMENT ---
// Admins can place a student (or a cohort) into any level. Every change is written
// to promotion_logs with the actor, the reason and the criteria in force, so manual
// and automatic decisions share one append-only audit trail.

const MAX_BULK = 2000;
const MIN_REASON_LENGTH = 10;

export type LevelAdjustmentMode = 'promote' | 'demote' | 'assign';

export interface LevelAdjustmentInput {
    studentIds: number[];
    targetLevel: number;
    mode: LevelAdjustmentMode;
    reason: string;
    fromSessionId?: number | null;
    toSessionId?: number | null;
    activateStudents?: boolean;
    dryRun?: boolean;
}

export async function searchLevelCandidates(search: string, limit = 25) {
    try {
        const allowed = await hasPermission("academic.promotion.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar") || await hasRole("hod");
        if (!allowed) return { error: "Unauthorized: Insufficient permissions" };
        const searchSession = await auth();
        if (!searchSession?.user?.id) return { error: "Unauthorized" };

        const term = search.trim();
        if (term.length < 2) return { success: true, candidates: [] };

        const pattern = `%${term}%`;
        const rows = await db.select({
            studentId: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            status: students.status,
            programmeType: students.programmeType,
            deptName: departments.name,
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .where(and(
                or(
                    like(students.matricNumber, pattern),
                    like(users.name, pattern),
                ),
                isNull(students.deletedAt)
            ))
            .limit(limit);

        return { success: true, candidates: rows };
    } catch (error) {
        console.error("Search Level Candidates Error:", error);
        return { error: "Failed to search students." };
    }
}

export async function bulkAdjustLevels(input: LevelAdjustmentInput) {
    try {
        const allowed = await hasPermission("academic.promotion.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { error: "Unauthorized: Insufficient permissions to adjust student levels" };
        const authSession = await auth();
        if (!authSession?.user?.id) return { error: "Unauthorized" };

        const ids = Array.from(new Set((input.studentIds || []).map(Number).filter(Boolean)));
        if (ids.length === 0) return { error: "Select at least one student." };
        if (ids.length > MAX_BULK) return { error: `Too many students selected (max ${MAX_BULK} per operation).` };

        const targetLevel = Number(input.targetLevel);
        if (!Number.isInteger(targetLevel) || targetLevel < 1 || targetLevel > 9) {
            return { error: "Target level must be a whole number between 1 and 9." };
        }

        const reason = (input.reason || "").trim();
        if (reason.length < MIN_REASON_LENGTH) {
            return { error: `A reason of at least ${MIN_REASON_LENGTH} characters is required for every manual level change.` };
        }

        const mode = input.mode;
        if (!['promote', 'demote', 'assign'].includes(mode)) return { error: "Invalid adjustment mode." };

        const rows = await db.select({
            studentId: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            status: students.status,
            currentSessionId: students.currentSessionId,
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(and(inArray(students.id, ids), isNull(students.deletedAt)));

        const found = new Map(rows.map(r => [r.studentId, r]));
        const missing = ids.filter(id => !found.has(id));
        const requestedFromSessionId = input.fromSessionId ?? null;
        const requestedToSessionId = input.toSessionId ?? null;

        const plan: { studentId: number; name: string; matricNumber: string | null; fromLevel: number; toLevel: number; action: string; resolvedFromSessionId?: number; warning?: string }[] = [];

        for (const id of ids) {
            const r = found.get(id);
            if (!r) continue;
            const fromLevel = r.currentLevel || 1;

            if (mode === 'demote' && targetLevel >= fromLevel) {
                plan.push({ studentId: id, name: r.name, matricNumber: r.matricNumber, fromLevel, toLevel: fromLevel, action: 'skipped', warning: 'Target level is not lower than the current level' });
                continue;
            }
            if (mode === 'promote' && targetLevel <= fromLevel) {
                plan.push({ studentId: id, name: r.name, matricNumber: r.matricNumber, fromLevel, toLevel: fromLevel, action: 'skipped', warning: 'Target level is not higher than the current level' });
                continue;
            }
            if (targetLevel === fromLevel) {
                plan.push({ studentId: id, name: r.name, matricNumber: r.matricNumber, fromLevel, toLevel: fromLevel, action: 'skipped', warning: 'Already at the target level' });
                continue;
            }
            if (targetLevel < 1) {
                plan.push({ studentId: id, name: r.name, matricNumber: r.matricNumber, fromLevel, toLevel: fromLevel, action: 'skipped', warning: 'Refused: level 1 is the floor' });
                continue;
            }

            const action = mode === 'promote' ? 'promote' : mode === 'demote' ? 'demote' : 'assign';
            const warnings: string[] = [];
            if (mode === 'assign' && targetLevel > fromLevel + 1) warnings.push(`Skips level${targetLevel - fromLevel > 1 ? 's' : ''} (${fromLevel} to ${targetLevel})`);
            if (input.activateStudents && r.status !== 'active') warnings.push(`Student status will be set to active (currently ${r.status})`);

            // promotion_logs.from_session_id is NOT NULL with an FK to academic_sessions,
            // so it must never be defaulted to 0. Resolve a real session, preferring the
            // caller, then the student's own current session.
            const resolvedFromSessionId = requestedFromSessionId ?? requestedToSessionId ?? r.currentSessionId ?? null;
            if (resolvedFromSessionId === null) {
                plan.push({
                    studentId: id, name: r.name, matricNumber: r.matricNumber,
                    fromLevel, toLevel: fromLevel, action: 'skipped',
                    warning: 'No session on record for this student, so the change cannot be logged. Set a source session first.',
                });
                continue;
            }

            plan.push({
                studentId: id,
                name: r.name,
                matricNumber: r.matricNumber,
                fromLevel,
                toLevel: targetLevel,
                action,
                resolvedFromSessionId,
                warning: warnings.length ? warnings.join('; ') : undefined,
            });
        }

        const applicable = plan.filter(p => p.action !== 'skipped');

        if (input.dryRun) {
            return {
                success: true,
                dryRun: true,
                summary: {
                    requested: ids.length,
                    applicable: applicable.length,
                    skipped: plan.length - applicable.length,
                    missing: missing.length,
                },
                plan,
            };
        }

        if (applicable.length === 0) {
            return { success: true, message: "No students required a level change.", summary: { requested: ids.length, applied: 0, skipped: plan.length, missing: missing.length }, plan };
        }

        const actorId = parseInt(authSession.user.id);
        const toSessionId = requestedToSessionId;
        const batchTag = `batch:${applicable.length}`;

        for (const p of applicable) {
            const decision = p.action === 'demote' ? 'demoted' : p.action === 'promote' ? 'promoted' : 'level_assigned';
            const setClause: Record<string, unknown> = { currentLevel: p.toLevel };
            if (input.activateStudents) setClause.status = 'active';

            // Every applicable row carries a resolved session (rows without one were
            // skipped during planning), so from_session_id is always a valid FK.
            if (p.resolvedFromSessionId === undefined) {
                continue;
            }

            await db.update(students).set(setClause).where(eq(students.id, p.studentId));

            await db.insert(promotionLogs).values({
                studentId: p.studentId,
                fromLevel: p.fromLevel,
                toLevel: p.toLevel,
                fromSessionId: p.resolvedFromSessionId,
                toSessionId,
                decision: decision as 'promoted' | 'demoted' | 'level_assigned',
                reason: `[MANUAL ${p.action.toUpperCase()}] ${reason} | ${batchTag}`,
                promotedBy: actorId,
            });
        }

        revalidatePath("/admin/promotion");
        revalidatePath("/admin/students");

        return {
            success: true,
            message: `Applied ${applicable.length} level change(s); ${plan.length - applicable.length} skipped.`,
            summary: { requested: ids.length, applied: applicable.length, skipped: plan.length - applicable.length, missing: missing.length },
            plan,
        };
    } catch (error) {
        console.error("Bulk Adjust Levels Error:", error);
        return { error: "Failed to adjust student levels." };
    }
}
