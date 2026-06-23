"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import {
    students, users, programmes, departments, academicSessions,
    semesterSummaries, promotionCriteria, promotionLogs, enrollments, results, courses, academicCarryOvers
} from "@/db/schema";
import { eq, and, desc, sql, count, sum, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { PromotionService } from "@/services/PromotionService";

// --- CRITERIA ---

export async function getDepartmentCriteria(deptId: number) {
    try {
        const [criteria] = await db.select().from(promotionCriteria)
            .where(eq(promotionCriteria.deptId, deptId))
            .orderBy(desc(promotionCriteria.createdAt))
            .limit(1);

        if (criteria) {
            return {
                success: true,
                criteria: {
                    ...criteria,
                    additionalRules: criteria.additionalRules ? JSON.parse(criteria.additionalRules) : [],
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
}) {
    try {
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        // Upsert: check if exists
        const [existing] = await db.select().from(promotionCriteria)
            .where(eq(promotionCriteria.deptId, deptId))
            .limit(1);

        if (existing) {
            await db.update(promotionCriteria)
                .set({
                    minCgpa: data.minCgpa.toFixed(2),
                    minCreditsPerSession: data.minCreditsPerSession,
                    additionalRules: JSON.stringify(data.additionalRules),
                })
                .where(eq(promotionCriteria.id, existing.id));
        } else {
            await db.insert(promotionCriteria).values({
                deptId,
                minCgpa: data.minCgpa.toFixed(2),
                minCreditsPerSession: data.minCreditsPerSession,
                additionalRules: JSON.stringify(data.additionalRules),
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
    currentLevel: number;
    maxLevel: number;
    cgpa: number;
    creditsEarned: number;
    decision: 'promoted' | 'withdrawn' | 'graduated' | 'repeat' | 'concession';
    reasons: string[];
    newLevel: number;
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
        currentLevel: students.currentLevel,
        durationYears: programmes.durationYears,
    })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .leftJoin(programmes, eq(students.programmeId, programmes.id))
        .where(eq(students.status, 'active'));

    // Get all department criteria
    const allCriteria = await db.select().from(promotionCriteria);
    const criteriaMap = new Map(allCriteria.map(c => [c.deptId, c]));

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
        const maxLevel = (student.durationYears || 4) * 100;
        const studentSummaries = summaryMap.get(student.studentId) || [];

        // Sum credits earned across both semesters for this session
        const creditsEarned = studentSummaries.reduce((total, s) => total + (s.tce || 0), 0);

        // Get latest CGPA (from semester 2 if available, else semester 1)
        const sem2 = studentSummaries.find(s => s.semester === '2');
        const sem1 = studentSummaries.find(s => s.semester === '1');
        const latestSummary = sem2 || sem1;
        const cgpa = latestSummary ? parseFloat(String(latestSummary.cgpa || '0')) : 0;

        // Decision Logic
        const reasons: string[] = [];
        let decision: 'promoted' | 'withdrawn' | 'graduated' | 'repeat' = 'promoted';

        if (!student.programmeId) {
            // K-12 Logic
            const isPromotedK12 = await PromotionService.isPromoted(student.matricNumber || "", "", "", 0); 
            // Note: isPromoted handles its own internal logic for session/branch, but for batch we might want a more efficient check.
            // For now, let's just use the logic directly here for performance in a loop if possible, 
            // but the user's snippet was specifically about a single result method.
            
            // Re-evaluating based on the specific K-12 rules provided:
            const [annualSummary] = await db.select().from(annualSummaries).where(and(eq(annualSummaries.studentId, student.studentId), eq(annualSummaries.sessionId, sessionId))).limit(1);
            const average = annualSummary ? parseFloat(annualSummary.averageScore?.toString() || "0") : 0;
            
            if (average < 50) {
                decision = 'repeat';
                reasons.push(`Annual Average (${average.toFixed(2)}%) is below the required 50% threshold.`);
            } else if (student.currentLevel >= 400) {
                // Senior Secondary Core Subject Check
                const hasPassedCore = await (PromotionService as any).hasPassedCoreSubjects(student.studentId, sessionId);
                if (!hasPassedCore) {
                    decision = 'repeat';
                    reasons.push(`Passed overall average but failed core subjects (Math & English) required for Senior Secondary.`);
                }
            }
        } else {
            // Tertiary (University) Logic
            if (cgpa <= 1.0 && creditsEarned <= 25) {
                decision = 'withdrawn';
                reasons.push(`CGPA (${cgpa.toFixed(2)}) ≤ 1.0 and credits earned (${creditsEarned}) ≤ 25 — university minimum not met`);
            } else {
                const deptCriteria = student.deptId ? criteriaMap.get(student.deptId) : null;
                if (deptCriteria) {
                    const deptMinCgpa = parseFloat(String(deptCriteria.minCgpa || '1.00'));
                    const deptMinCredits = deptCriteria.minCreditsPerSession || 25;

                    if (cgpa < deptMinCgpa) {
                        decision = 'repeat';
                        reasons.push(`CGPA (${cgpa.toFixed(2)}) below department minimum (${deptMinCgpa.toFixed(2)})`);
                    }
                    if (creditsEarned < deptMinCredits) {
                        decision = 'repeat';
                        reasons.push(`Credits earned (${creditsEarned}) below department minimum (${deptMinCredits})`);
                    }
                } else {
                    if (cgpa <= 1.0) {
                        decision = 'repeat';
                        reasons.push(`CGPA (${cgpa.toFixed(2)}) ≤ 1.0 — below university minimum`);
                    }
                    if (creditsEarned <= 25) {
                        decision = 'repeat';
                        reasons.push(`Credits earned (${creditsEarned}) ≤ 25 — below university minimum`);
                    }
                }
            }
        }

        // Check graduation
        const currentLevel = student.currentLevel || 100;
        let newLevel = currentLevel;

        if (decision === 'promoted') {
            if (currentLevel >= maxLevel) {
                decision = 'graduated';
                reasons.push(`Completed max level (${maxLevel}) — eligible for graduation`);
                newLevel = currentLevel;
            } else {
                newLevel = currentLevel + 100;
                reasons.push(`Promoted from ${currentLevel} to ${newLevel}`);
            }
        } else if (decision === 'repeat') {
            newLevel = currentLevel; // same level
            if (reasons.length === 0) reasons.push('Repeating current level');
        }

        evaluations.push({
            studentId: student.studentId,
            studentName: student.studentName,
            matricNumber: student.matricNumber,
            deptName: student.deptName || 'Unknown',
            deptId: student.deptId,
            programmeName: student.programmeName || 'Unknown',
            currentLevel,
            maxLevel,
            cgpa,
            creditsEarned,
            decision,
            reasons,
            newLevel,
        });
    }

    return evaluations;
}

export async function getPromotionPreview(sessionId: number) {
    try {
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        const evaluations = await evaluateStudents(sessionId);

        const summary = {
            total: evaluations.length,
            promoted: evaluations.filter(e => e.decision === 'promoted').length,
            graduated: evaluations.filter(e => e.decision === 'graduated').length,
            withdrawn: evaluations.filter(e => e.decision === 'withdrawn').length,
            repeat: evaluations.filter(e => e.decision === 'repeat').length,
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
        const authSession = await auth();
        if (!authSession?.user?.id) return { error: "Unauthorized" };

        const evaluations = await evaluateStudents(sessionId);
        const promotedBy = parseInt(authSession.user.id);

        let promoted = 0, graduated = 0, withdrawn = 0, repeated = 0, concessional = 0;

        for (const evaluation of evaluations) {
            // Apply Manual Override if present
            let finalDecision = evaluation.decision;
            let finalReasons = evaluation.reasons.join('; ');
            let finalNewLevel = evaluation.newLevel;

            if (overrides && overrides[evaluation.studentId]) {
                const override = overrides[evaluation.studentId];
                finalDecision = override.decision as any;
                if (override.reason) finalReasons = `[OVERRIDE] ${override.reason} (Original: ${finalReasons})`;
                
                // Adjust level if decision changed to promoted or concession
                if (finalDecision === 'promoted' || finalDecision === 'concession') {
                    finalNewLevel = evaluation.currentLevel + 100;
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

                case 'graduated':
                    const [pendingCarryOver] = await db.select().from(academicCarryOvers).where(and(
                        eq(academicCarryOvers.studentId, evaluation.studentId),
                        eq(academicCarryOvers.status, 'pending')
                    )).limit(1);

                    if (pendingCarryOver) {
                        await db.update(students)
                            .set({
                                academicStatus: 'spill_over',
                                spillOverSessionCount: sql`spill_over_session_count + 1`,
                                currentLevel: evaluation.currentLevel, // Stay at final year level
                            })
                            .where(eq(students.id, evaluation.studentId));
                        repeated++; // treat as retained/repeated logically for counts
                    } else {
                        await db.update(students)
                            .set({
                                status: 'graduated',
                                academicStatus: 'graduated',
                                currentLevel: evaluation.currentLevel,
                            })
                            .where(eq(students.id, evaluation.studentId));
                        // Also update user status
                        const [graduatingStudent] = await db.select({ userId: students.userId })
                            .from(students).where(eq(students.id, evaluation.studentId)).limit(1);
                        if (graduatingStudent?.userId) {
                            await db.update(users)
                                .set({ status: 'graduated' })
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
            message: `Promotion complete: ${promoted} promoted, ${concessional} concessional, ${graduated} graduated, ${withdrawn} withdrawn, ${repeated} repeating.`,
            summary: { promoted, concessional, graduated, withdrawn, repeated, total: evaluations.length },
        };
    } catch (error) {
        console.error("Run Promotion Error:", error);
        return { error: "Failed to run promotion." };
    }
}

// --- LOGS ---

export async function getPromotionLogs(sessionId?: number) {
    try {
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
            const maxLevel = (s.durationYears || 4) * 100;
            const isFinalYear = (s.currentLevel || 100) >= maxLevel;
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
                currentLevel: s.currentLevel || 100,
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
