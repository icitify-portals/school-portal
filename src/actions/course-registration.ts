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
        const { semesterSummaries, departments, academicSessions, transactions, studentBills } = await import("@/db/schema");
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
                    sql`(${transactions.purpose} LIKE '%Print Fee%' OR ${transactions.purpose} LIKE '%Course Form%' OR ${transactions.gatewayReference} LIKE 'PRINT_%')`
                ))
                .limit(1);
            if (paidTx.length > 0) {
                isPrintFeePaid = true;
            } else {
                const paidBill = await db.select({ id: studentBills.id })
                    .from(studentBills)
                    .where(and(
                        eq(studentBills.studentId, studentId),
                        eq(studentBills.sessionId, sessionId),
                        eq(studentBills.paymentStatus, "paid"),
                        sql`(${studentBills.feeItemId} = 52 OR ${studentBills.description} LIKE '%Course Form%')`
                    ))
                    .limit(1);
                if (paidBill.length > 0) {
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

        const formattedRegistered = registered.map((c) => ({
            ...c,
            statusCode: c.status === 'elective' ? 'E' : c.status === 'required' ? 'R' : 'C',
            isCarryOver: Boolean(c.courseLevel && c.courseLevel < ownNumericLevel),
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

        return { success: true, data: formattedRegistered, isPrintFeePaid, studentInfo };
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

