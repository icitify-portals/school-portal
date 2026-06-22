"use server";

import { db } from "@/db/db";
import {
    academicSessions,
    courses,
    staffProfiles,
    departments,
    courseLecturers,
    timetableSlots,
    users,
    students,
    enrollments,
    timetableSubmissions,
    faculties,
    venues,
    studentProgress,
    results,
    programmes,
    healthRecords,
    studentVitals,
    transactions,
    lessonNotes,
    courseDepartmentSettings
} from "@/db/schema";
import { eq, and, count, sql, inArray, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { TimetableService } from "@/services/TimetableService";
import { revalidatePath } from "next/cache";

export async function getLecturerDashboardStats(staffId: number) {
    try {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        if (!session) return { courses: 0, hours: 0 };

        const assignmentsData = await db.select({
            id: courseLecturers.id,
            staffId: courseLecturers.staffId,
            courseId: courseLecturers.courseId,
            sessionId: courseLecturers.sessionId,
            semester: courseLecturers.semester,
            courseName: courses.name,
            courseCode: courses.code
        })
            .from(courseLecturers)
            .innerJoin(courses, eq(courseLecturers.courseId, courses.id))
            .where(and(
                eq(courseLecturers.staffId, staffId),
                eq(courseLecturers.sessionId, session.id),
                eq(courseLecturers.semester, session.currentSemester === '1' ? '1' : '2')
            ));

        const assignmentIds = assignmentsData.map(a => a.id);
        const slots = assignmentIds.length > 0
            ? await db.select().from(timetableSlots).where(inArray(timetableSlots.courseLecturerId, assignmentIds))
            : [];

        const assignments = assignmentsData.map(a => ({
            ...a,
            slots: slots.filter(s => s.courseLecturerId === a.id)
        }));

        let totalHours = 0;
        assignments.forEach(a => {
            totalHours += a.slots.length;
        });

        return {
            courses: assignments.length,
            hours: totalHours,
            assignments: assignments // For listing
        };
    } catch (error) {
        console.error("Lecturer Stats Error:", error);
        return { courses: 0, hours: 0, assignments: [] };
    }
}

export async function getHODDashboardStats(deptId: number) {
    try {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        if (!session) return null;

        const submission = await TimetableService.getSubmission(deptId, session.id, session.currentSemester === '1' ? '1' : '2');

        const staffCount = await db.select({ value: count() })
            .from(staffProfiles)
            .where(eq(staffProfiles.departmentId, deptId));

        return {
            submissionStatus: submission?.status || 'draft',
            staffCount: staffCount[0].value,
            semester: session.currentSemester,
            sessionName: session.name
        };
    } catch (error) {
        console.error("HOD Stats Error:", error);
        return null;
    }
}

export async function getDeanDashboardStats(facultyId: number) {
    try {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        if (!session) return null;

        const depts = await db.select().from(departments).where(eq(departments.facultyId, facultyId));

        const deptIds = depts.map(d => d.id);

        const submissions = await db.select().from(timetableSubmissions)
            .where(and(
                inArray(timetableSubmissions.deptId, deptIds),
                eq(timetableSubmissions.sessionId, session.id),
                eq(timetableSubmissions.semester, session.currentSemester === '1' ? '1' : '2')
            ));

        const approved = submissions.filter(s => s.status === 'approved').length;
        const pending = submissions.filter(s => s.status === 'pending_approval').length;

        return {
            totalDepartments: depts.length,
            approvedCount: approved,
            pendingCount: pending,
            draftCount: depts.length - submissions.length + submissions.filter(s => s.status === 'draft').length
        };
    } catch (error) {
        console.error("Dean Stats Error:", error);
        return null;
    }
}

export async function getStudentDashboardStats(userId: number) {
    try {
        const [studentData] = await db.select({
            student: students,
            userStatus: users.status,
            programme: programmes
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .where(eq(students.userId, userId))
            .limit(1);

        if (!studentData) return null;

        const { student, userStatus, programme } = studentData;

        // Fetch enrolled courses
        const enrolledCourses = await db.select({
            id: courses.id,
            name: courses.name,
            code: courses.code,
            credits: courses.creditUnits
        })
            .from(enrollments)
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .where(and(
                eq(enrollments.studentId, student.id),
                eq(enrollments.status, 'approved')
            ));

        // Fetch course progress
        const detailedProgress = await db.select({
            courseName: courses.name,
            courseCode: courses.code,
            lastAccessed: studentProgress.lastAccessed
        })
            .from(studentProgress)
            .innerJoin(courses, eq(studentProgress.courseId, courses.id))
            .where(eq(studentProgress.studentId, student.id))
            .limit(5);

        // Fetch student results
        const studentResults = await db.select({
            totalScore: results.totalScore,
            grade: results.grade,
            courseName: courses.name,
            courseCode: courses.code
        })
            .from(results)
            .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .where(eq(enrollments.studentId, student.id))
            .orderBy(desc(results.id))
            .limit(3);

        const totalPoints = studentResults.reduce((acc, r) => acc + (parseFloat(r.totalScore?.toString() || "0")), 0);
        const cgpa = studentResults.length > 0 ? (totalPoints / (studentResults.length * 20)).toFixed(2) : "0.00";

        // Fetch recent transactions
        const recentTransactions = await db.select()
            .from(transactions)
            .where(eq(transactions.studentId, student.id))
            .orderBy(desc(transactions.id))
            .limit(3);

        // Fetch recent attendance check-ins using sql
        const recentAttendance = await db.execute(sql`
            SELECT la.time_in as timeIn, c.code as courseCode, c.name as courseName
            FROM lecture_attendance la
            INNER JOIN lecture_sessions ls ON la.session_id = ls.id
            INNER JOIN timetable_slots ts ON ls.slot_id = ts.id
            INNER JOIN course_lecturers cl ON ts.course_lecturer_id = cl.id
            INNER JOIN courses c ON cl.course_id = c.id
            WHERE la.student_id = ${student.id}
            ORDER BY la.id DESC
            LIMIT 3
        `);

        // Format recent activities into a unified feed
        const activities: any[] = [];
        
        // 1. Result/Grade activities
        studentResults.forEach(r => {
            activities.push({
                type: 'grade',
                title: `Grade Released: ${r.courseCode}`,
                description: `You scored ${r.totalScore} (${r.grade}) in ${r.courseName}`,
                date: new Date(),
                color: 'text-amber-600',
                bg: 'bg-amber-50'
            });
        });

        // 2. Transaction activities
        recentTransactions.forEach(t => {
            activities.push({
                type: 'payment',
                title: t.purpose,
                description: `₦${parseFloat(t.amount as any).toLocaleString()} payment ${t.status}`,
                date: t.createdAt,
                color: t.status === 'completed' ? 'text-emerald-600' : 'text-rose-600',
                bg: t.status === 'completed' ? 'bg-emerald-50' : 'bg-rose-50'
            });
        });

        // 3. Attendance activities
        if (recentAttendance && Array.isArray(recentAttendance[0])) {
            recentAttendance[0].forEach((a: any) => {
                activities.push({
                    type: 'attendance',
                    title: `Checked In: ${a.courseCode}`,
                    description: `Signed attendance for ${a.courseName}`,
                    date: new Date(a.timeIn),
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-50'
                });
            });
        }

        // Sort activities by date descending
        activities.sort((a, b) => b.date.getTime() - a.date.getTime());

        return {
            studentId: student.id,
            enrolledCourses: enrolledCourses.length,
            totalCredits: enrolledCourses.reduce((acc, c) => acc + (c.credits || 0), 0),
            level: student.currentLevel,
            matricNo: student.matricNumber || 'PENDING',
            cgpa,
            attendance: "94%",
            courseProgress: detailedProgress,
            status: userStatus,
            activities: activities.slice(0, 5),
            walletBalance: student.walletBalance || "0.00"
        };
    } catch (error) {
        console.error("Student Stats Error:", error);
        return null;
    }
}

export async function getHealthDashboardStats() {
    try {
        const [totalStudents] = await db.select({ value: count() }).from(students);
        const [cleared] = await db.select({ value: count() }).from(students).where(eq(students.healthStatus, 'cleared'));
        const [flagged] = await db.select({ value: count() }).from(students).where(eq(students.healthStatus, 'flagged'));
        const [pending] = await db.select({ value: count() }).from(students).where(eq(students.healthStatus, 'pending'));

        const recentReports = await db.select({
            id: healthRecords.id,
            title: healthRecords.title,
            studentName: users.name,
            createdAt: healthRecords.createdAt,
            status: healthRecords.status
        })
            .from(healthRecords)
            .innerJoin(students, eq(healthRecords.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .orderBy(desc(healthRecords.createdAt))
            .limit(5);

        const recentVitals = await db.select({
            id: studentVitals.id,
            studentName: users.name,
            recordedAt: studentVitals.recordedAt,
            bp: studentVitals.bloodPressure
        })
            .from(studentVitals)
            .innerJoin(students, eq(studentVitals.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .orderBy(desc(studentVitals.recordedAt))
            .limit(5);

        return {
            totalStudents: totalStudents.value,
            clearedCount: cleared.value,
            flaggedCount: flagged.value,
            pendingCount: pending.value,
            recentReports,
            recentVitals
        };
    } catch (error) {
        console.error("Health Dashboard Stats Error:", error);
        return null;
    }
}

export async function getDVCDashboardStats() {
    try {
        const stats = await Promise.all([
            db.select({ value: count() }).from(students),
            db.select({ value: count() }).from(staffProfiles),
            db.select({ value: count() }).from(faculties),
            db.select({ value: count() }).from(programmes),
            db.select({ value: sql<number>`sum(amount)` }).from(transactions).where(eq(transactions.status, 'completed'))
        ]);

        return {
            totalStudents: stats[0][0].value,
            totalStaff: stats[1][0].value,
            totalFaculties: stats[2][0].value,
            totalProgrammes: stats[3][0].value,
            totalRevenue: stats[4][0].value || 0
        };
    } catch (error) {
        console.error("DVC Dashboard Stats Error:", error);
        return null;
    }
}

export async function getPendingLessonNotesForHOD(deptId: number) {
    try {
        const rows = await db.select({
            id: lessonNotes.id,
            title: lessonNotes.title,
            weekNumber: lessonNotes.weekNumber,
            objectives: lessonNotes.objectives,
            contentBody: lessonNotes.contentBody,
            status: lessonNotes.status,
            createdAt: lessonNotes.createdAt,
            course: courses,
            teacher: users
        })
            .from(lessonNotes)
            .innerJoin(courses, eq(lessonNotes.courseId, courses.id))
            .innerJoin(courseDepartmentSettings, eq(courses.id, courseDepartmentSettings.courseId))
            .innerJoin(users, eq(lessonNotes.teacherId, users.id))
            .where(and(
                eq(courseDepartmentSettings.deptId, deptId),
                eq(lessonNotes.status, 'pending')
            ));

        return rows;
    } catch (error) {
        console.error("Failed to fetch pending lesson notes:", error);
        return [];
    }
}

export async function reviewLessonNote(noteId: number, status: 'approved' | 'rejected', feedback?: string, supervisorId?: number) {
    try {
        await db.update(lessonNotes)
            .set({
                status,
                supervisorFeedback: feedback || `${status.toUpperCase()} by Department HOD.`,
                supervisorId,
                updatedAt: new Date()
            })
            .where(eq(lessonNotes.id, noteId));
        
        revalidatePath("/admin/hod");
        return { success: true };
    } catch (error) {
        console.error("Failed to review lesson note:", error);
        return { success: false, error: "Failed to review lesson note" };
    }
}

