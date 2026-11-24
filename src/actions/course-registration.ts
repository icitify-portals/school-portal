"use server";

import { CourseRegistrationService } from "@/services/CourseRegistrationService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { studentCourseRegistrations, courses, students, users, courseDepartmentSettings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { hasRole, hasPermission } from "@/lib/rbac";
import { sendInAppNotification } from "./notifications";

export async function getAvailableCoursesAction(studentId: number, semester: '1' | '2') {
    try {
        const data = await CourseRegistrationService.getAvailableCourses(studentId, semester);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function submitCourseRegistrationAction(data: {
    studentId: number,
    sessionId: number,
    semester: '1' | '2',
    courseIds: number[]
}) {
    try {
        // COURSE-6: early prerequisite check before level/capacity validations
        const failedPrerequisites = await CourseRegistrationService.validatePrerequisites(data.studentId, data.courseIds);
        if (failedPrerequisites.length > 0) {
            return { success: false, error: "Prerequisite Failure", failedPrerequisites };
        }

        const result = await CourseRegistrationService.submitRegistration(data);
        
        const student = await db.select({ userId: students.userId }).from(students).where(eq(students.id, data.studentId)).limit(1);
        if (student.length > 0 && student[0].userId) {
            await sendInAppNotification({
                userId: student[0].userId,
                title: "Registration Submitted",
                message: `You have successfully submitted your course registration (${result.totalUnits} units).`,
                type: "success",
                link: "/student/courses/registration"
            });
        }

        revalidatePath("/student/courses/registration");
        return { success: true, totalUnits: result.totalUnits };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getRegisteredCoursesAction(studentId: number, sessionId: number, semester: '1' | '2') {
    try {
        const { semesterSummaries, departments, academicSessions, transactions, studentBills, studentBillItems, feeItems, payment_transactions } = await import("@/db/schema");
        const { resolveLevel } = await import("@/lib/levels");

        const summary = await db.select({ isPrintFeePaid: semesterSummaries.isPrintFeePaid })
            .from(semesterSummaries)
            .where(and(
                eq(semesterSummaries.studentId, studentId),
                eq(semesterSummaries.sessionId, sessionId),
                eq(semesterSummaries.semester, semester)
            ))
            .limit(1);
        let isPrintFeePaid = summary[0]?.isPrintFeePaid || false;

        if (!isPrintFeePaid) {
            const paidTx = await db.select({ id: transactions.id })
                .from(transactions)
                .where(and(
                    eq(transactions.studentId, studentId),
                    eq(transactions.status, "completed"),
                    sql`(${transactions.purpose} LIKE '%Print Fee%' OR ${transactions.purpose} LIKE '%Course Form%' OR ${transactions.gatewayReference} LIKE 'PRINT_%' OR CAST(${transactions.amount} AS DECIMAL(12,2)) = 500)`
                ))
                .limit(1);
            if (paidTx.length > 0) {
                isPrintFeePaid = true;
            } else {
                const paidBill = await db.select({ id: studentBills.id })
                    .from(studentBills)
                    .innerJoin(studentBillItems, eq(studentBillItems.billId, studentBills.id))
                    .leftJoin(feeItems, eq(studentBillItems.feeItemId, feeItems.id))
                    .where(and(
                        eq(studentBills.studentId, studentId),
                        eq(studentBills.sessionId, sessionId),
                        eq(studentBills.status, "paid"),
                        sql`(${studentBillItems.feeItemId} = 52 OR ${feeItems.name} LIKE '%Course Form%' OR ${feeItems.name} LIKE '%Print%' OR ${studentBills.note} LIKE '%Course Form%')`
                    ))
                    .limit(1);
                if (paidBill.length > 0) {
                    isPrintFeePaid = true;
                }
            }
        }

        if (!isPrintFeePaid) {
            const [stuUser] = await db.select({ userId: students.userId }).from(students).where(eq(students.id, studentId)).limit(1);
            if (stuUser?.userId) {
                const paidPt = await db.select({ id: payment_transactions.id })
                    .from(payment_transactions)
                    .where(and(
                        eq(payment_transactions.userId, stuUser.userId),
                        eq(payment_transactions.status, "completed"),
                        sql`(CAST(${payment_transactions.amount} AS DECIMAL(12,2)) = 500 OR ${payment_transactions.metadata} LIKE '%Course Form%' OR ${payment_transactions.metadata} LIKE '%Print Fee%')`
                    ))
                    .limit(1);
                if (paidPt.length > 0) {
                    isPrintFeePaid = true;
                }
            }
        }

        // Fetch student info & session for official printout
        const [studentRow] = await db.select({
            id: students.id,
            matricNumber: students.matricNumber,
            admissionNumber: students.admissionNumber,
            jambNumber: students.jambNumber,
            firstName: students.firstName,
            lastName: students.lastName,
            otherNames: students.otherNames,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            studyMode: students.studyMode,
            imageUrl: students.imageUrl,
            signatureUrl: students.signatureUrl,
            deptName: departments.name,
            userName: users.name,
        })
        .from(students)
        .leftJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(eq(students.id, studentId))
        .limit(1);

        const [sessionRow] = await db.select({
            name: academicSessions.name,
        })
        .from(academicSessions)
        .where(eq(academicSessions.id, sessionId))
        .limit(1);

        const resolvedLvl = studentRow ? resolveLevel(studentRow.currentLevel, studentRow.programmeType) : null;
        const ownNumericLevel = resolvedLvl?.numeric || 100;

        const carryOverCourseIds = await CourseRegistrationService.getCarryOverCourseIds(studentId);
        const owedCarrySet = new Set(carryOverCourseIds);

        const registered = await db.select({
            id: courses.id,
            name: sql<string>`COALESCE(${courseDepartmentSettings.courseTitle}, ${courses.name})`,
            code: courses.code,
            units: sql<number>`COALESCE(${courseDepartmentSettings.creditUnits}, ${courses.creditUnits})`.mapWith(Number),
            status: courseDepartmentSettings.status,
            courseLevel: courseDepartmentSettings.level,
            finalStatus: studentCourseRegistrations.finalStatus,
            advisorStatus: studentCourseRegistrations.advisorStatus,
            hodStatus: studentCourseRegistrations.hodStatus
        })
        .from(studentCourseRegistrations)
        .innerJoin(courses, eq(studentCourseRegistrations.courseId, courses.id))
        .innerJoin(students, eq(studentCourseRegistrations.studentId, students.id))
        .leftJoin(courseDepartmentSettings, and(
            eq(courseDepartmentSettings.courseId, courses.id),
            eq(courseDepartmentSettings.deptId, students.deptId),
            sql`${studentCourseRegistrations.semester} = ${courseDepartmentSettings.semester}`
        ))
        .where(and(
            eq(studentCourseRegistrations.studentId, studentId),
            eq(studentCourseRegistrations.sessionId, sessionId),
            eq(studentCourseRegistrations.semester, semester)
        ));

        // Group and deduplicate by course id, preferring the settings row matching the student's own level
        const courseMap = new Map<number, typeof registered[0]>();
        for (const row of registered) {
            const existing = courseMap.get(row.id);
            if (!existing) {
                courseMap.set(row.id, row);
            } else if (existing.courseLevel !== ownNumericLevel && row.courseLevel === ownNumericLevel) {
                courseMap.set(row.id, row);
            }
        }
        const dedupedRegistered = Array.from(courseMap.values());

        const formattedRegistered = dedupedRegistered.map((c) => ({
            ...c,
            statusCode: c.status === 'elective' ? 'E' : c.status === 'required' ? 'R' : 'C',
            isCarryOver: owedCarrySet.has(c.id),
        }));

        const matricOrReg = studentRow?.matricNumber || studentRow?.admissionNumber || studentRow?.jambNumber || '';
        const fullName = studentRow
            ? (`${studentRow.lastName || ''} ${studentRow.firstName || ''} ${studentRow.otherNames || ''}`.trim() || studentRow.userName || '').toUpperCase()
            : '';
        let programLabel = 'FULL-TIME';
        if (matricOrReg.toUpperCase().includes('/DPP/')) {
            programLabel = 'DPP';
        } else if (matricOrReg.toUpperCase().includes('/PT/') || studentRow?.studyMode === 'part_time') {
            programLabel = 'PART-TIME';
        } else if (studentRow?.studyMode) {
            programLabel = studentRow.studyMode.replace('_', '-').toUpperCase();
        }

        const rawSessionName = sessionRow?.name || '2026/2027';
        const formattedSession = rawSessionName.replace('/', '-');
        const semesterLabel = semester === '2' ? 'Second Semester' : 'First Semester';

        const studentInfo = studentRow ? {
            matricNumber: matricOrReg,
            fullName,
            levelLabel: resolvedLvl?.label || `${studentRow.programmeType || ''} ${studentRow.currentLevel || ''}`.trim(),
            program: programLabel,
            sessionSemester: `${formattedSession} ${semesterLabel}`,
            departmentName: studentRow.deptName || '',
            imageUrl: studentRow.imageUrl || null,
            signatureUrl: studentRow.signatureUrl || null,
        } : null;

        const registrationWindow = await CourseRegistrationService.getRegistrationWindowStatus(studentId, sessionId, semester);

        return { success: true, data: formattedRegistered, isPrintFeePaid, studentInfo, registrationWindow };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function approveStudentRegistrationAction(studentId: number, sessionId: number, semester: '1' | '2') {
    try {
        const isStaff = await hasPermission("academic.registration.approve") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("teacher");
        if (!isStaff) throw new Error("Unauthorized access");

        const staffId = 1; // Placeholder
        await CourseRegistrationService.approveRegistration(studentId, sessionId, semester, staffId);
        
        const student = await db.select({ userId: students.userId }).from(students).where(eq(students.id, studentId)).limit(1);
        if (student.length > 0 && student[0].userId) {
            await sendInAppNotification({
                userId: student[0].userId,
                title: "Registration Approved",
                message: `Your course registration has been approved.`,
                type: "success",
                link: "/student/courses/registration"
            });
        }

        revalidatePath("/admin/academic/registrations");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getCourseRegisteredStudentsRosterAction(courseId: number, sessionId?: number, semester?: '1' | '2') {
    try {
        const isAuthorized = await hasPermission("academic.registration.approve") || 
                             await hasRole("admin") || 
                             await hasRole("superadmin") || 
                             await hasRole("record_officer") ||
                             await hasRole("registrar") ||
                             await hasRole("teacher");
                             
        if (!isAuthorized) throw new Error("Unauthorized: Insufficient permissions to view course roster");

        let conditions = [eq(studentCourseRegistrations.courseId, courseId)];
        if (sessionId) conditions.push(eq(studentCourseRegistrations.sessionId, sessionId));
        if (semester) conditions.push(eq(studentCourseRegistrations.semester, semester));

        const rows = await db.select({
            registrationId: studentCourseRegistrations.id,
            studentId: students.id,
            matricNumber: students.matricNumber,
            admissionNumber: students.admissionNumber,
            studentName: users.name,
            studentEmail: users.email,
            level: students.currentLevel,
            courseId: courses.id,
            courseCode: courses.code,
            courseName: courses.name,
            creditUnits: sql<number>`COALESCE(${courseDepartmentSettings.creditUnits}, ${courses.creditUnits})`.mapWith(Number),
            finalStatus: studentCourseRegistrations.finalStatus,
            advisorStatus: studentCourseRegistrations.advisorStatus,
            registeredAt: studentCourseRegistrations.registeredAt
        })
        .from(studentCourseRegistrations)
        .innerJoin(students, eq(studentCourseRegistrations.studentId, students.id))
        .leftJoin(users, eq(students.userId, users.id))
        .innerJoin(courses, eq(studentCourseRegistrations.courseId, courses.id))
        .leftJoin(courseDepartmentSettings, and(
            eq(courseDepartmentSettings.courseId, courses.id),
            eq(courseDepartmentSettings.deptId, students.deptId),
            sql`${studentCourseRegistrations.semester} = ${courseDepartmentSettings.semester}`
        ))
        .where(and(...conditions));

        return { success: true, data: rows };
    } catch (error) {
        console.error("getCourseRegisteredStudentsRosterAction error:", error);
        return { success: false, error: (error as Error).message, data: [] };
    }
}



export async function adminSearchStudentsForRegistrationAction(query: string) {
    try {
        const isAuthorized =
            (await hasPermission("academic.registration.approve")) ||
            (await hasRole(["admin", "superadmin", "registrar", "ict_manager", "record_officer", "icitify_dev", "hod"]));
        if (!isAuthorized) return { success: false, error: "Unauthorized", data: [] };

        const q = (query || "").trim();
        if (!q) return { success: true, data: [] };

        const { departments } = await import("@/db/schema");
        const { or, like, isNull } = await import("drizzle-orm");

        const rows = await db.select({
            id: students.id,
            matricNumber: students.matricNumber,
            admissionNumber: students.admissionNumber,
            name: users.name,
            firstName: students.firstName,
            lastName: students.lastName,
            otherNames: students.otherNames,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            deptId: students.deptId,
            deptName: departments.name,
            status: students.status,
        })
        .from(students)
        .leftJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(and(
            isNull(students.deletedAt),
            or(
                like(students.matricNumber, `%${q}%`),
                like(students.admissionNumber, `%${q}%`),
                like(users.name, `%${q}%`),
                like(students.firstName, `%${q}%`),
                like(students.lastName, `%${q}%`)
            )
        ))
        .limit(25);

        return { success: true, data: rows };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

export async function adminGetStudentRegistrationDetailAction(studentId: number, sessionId: number, semester: '1' | '2') {
    try {
        const isAuthorized =
            (await hasPermission("academic.registration.approve")) ||
            (await hasRole(["admin", "superadmin", "registrar", "ict_manager", "record_officer", "icitify_dev", "hod"]));
        if (!isAuthorized) throw new Error("Unauthorized");

        const [regRes, availCourses] = await Promise.all([
            getRegisteredCoursesAction(studentId, sessionId, semester),
            CourseRegistrationService.getAvailableCourses(studentId, semester),
        ]);

        // Also provide all portal courses so admin can add electives or cross-dept courses
        const allCourses = await db.select({
            id: courses.id,
            code: courses.code,
            name: courses.name,
            units: courses.creditUnits,
        })
        .from(courses)
        .orderBy(courses.code)
        .limit(1000);

        return {
            success: true,
            studentInfo: (regRes as any).studentInfo || null,
            registeredCourses: (regRes as any).data || [],
            availableCourses: availCourses || [],
            allCourses,
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function adminUpdateStudentCoursesAction(
    studentId: number,
    sessionId: number,
    semester: '1' | '2',
    courseIds: number[]
) {
    try {
        const isAuthorized =
            (await hasPermission("academic.registration.approve")) ||
            (await hasRole(["admin", "superadmin", "registrar", "ict_manager", "record_officer", "icitify_dev", "hod"]));
        if (!isAuthorized) throw new Error("Unauthorized");

        const { auth } = await import("@/auth");
        const { systemAuditLogs, enrollments, semesterSummaries, academicSessions } = await import("@/db/schema");
        const session = await auth();
        const actorId = session?.user?.id ? parseInt(String(session.user.id)) : null;

        const uniqueCourseIds = Array.from(new Set((courseIds || []).map(Number))).filter(Boolean);

        // If admin deletes all courses
        if (uniqueCourseIds.length === 0) {
            await db.delete(studentCourseRegistrations).where(and(
                eq(studentCourseRegistrations.studentId, studentId),
                eq(studentCourseRegistrations.sessionId, sessionId),
                eq(studentCourseRegistrations.semester, semester)
            ));

            const [sessionRow] = await db.select({ name: academicSessions.name, currentSemester: academicSessions.currentSemester })
                .from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);
            if (sessionRow?.name) {
                const semesterNo = semester === '2' ? 2 : 1;
                await db.delete(enrollments).where(and(
                    eq(enrollments.studentId, studentId),
                    eq(enrollments.academicYear, sessionRow.name),
                    eq(enrollments.semester, semesterNo)
                ));
            }

            const existingSummaries = await db.select({ id: semesterSummaries.id })
                .from(semesterSummaries)
                .where(and(
                    eq(semesterSummaries.studentId, studentId),
                    eq(semesterSummaries.sessionId, sessionId),
                    eq(semesterSummaries.semester, semester)
                ));
            if (existingSummaries.length > 0) {
                await db.update(semesterSummaries).set({ tcr: 0 }).where(eq(semesterSummaries.id, existingSummaries[0].id));
                const redundant = existingSummaries.slice(1).map(s => s.id);
                if (redundant.length > 0) {
                    await db.delete(semesterSummaries).where(inArray(semesterSummaries.id, redundant));
                }
            } else {
                await db.insert(semesterSummaries).values({
                    studentId,
                    sessionId,
                    semester,
                    tcr: 0
                });
            }

            await db.insert(systemAuditLogs).values({
                userId: actorId,
                action: "ADMIN_CLEAR_COURSE_REGISTRATION",
                resource: `student:${studentId}`,
                details: JSON.stringify({ studentId, sessionId, semester, action: "cleared_all_courses" }),
            }).catch(() => {});

            revalidatePath("/student/courses/registration");
            revalidatePath("/admin/ict/course-registrations");
            revalidatePath("/admin/registration/manage");
            return { success: true, totalUnits: 0 };
        }

        const result = await CourseRegistrationService.submitRegistration(
            { studentId, sessionId, semester, courseIds: uniqueCourseIds },
            { adminOverride: true }
        );

        await db.insert(systemAuditLogs).values({
            userId: actorId,
            action: "ADMIN_EDIT_COURSE_REGISTRATION",
            resource: `student:${studentId}`,
            details: JSON.stringify({ studentId, sessionId, semester, courseIds, totalUnits: result.totalUnits }),
        }).catch(() => {});

        const [stu] = await db.select({ userId: students.userId }).from(students).where(eq(students.id, studentId)).limit(1);
        if (stu?.userId) {
            await sendInAppNotification({
                userId: stu.userId,
                title: "Course Registration Updated by Admin",
                message: `An administrator updated your course registration (${result.totalUnits} units).`,
                type: "info",
                link: "/student/courses/registration"
            }).catch(() => {});
        }

        revalidatePath("/student/courses/registration");
        revalidatePath("/admin/ict/course-registrations");
        revalidatePath("/admin/registration/manage");
        return { success: true, totalUnits: result.totalUnits };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
