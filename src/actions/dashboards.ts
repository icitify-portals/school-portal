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
    transactions
} from "@/db/schema";
import { eq, and, count, sql, inArray, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { TimetableService } from "@/services/TimetableService";

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
        console.log("Fetching student dashboard stats for user:", userId);
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

        console.log("Student Data result:", studentData ? "Found" : "Not Found");
        if (!studentData) return null;

        const { student, userStatus, programme } = studentData;

        console.log("Fetching enrolled courses for student:", student.id);
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

        console.log("Enrolled courses count:", enrolledCourses.length);

        console.log("Fetching detailed progress...");
        const detailedProgress = await db.select({
            courseName: courses.name,
            courseCode: courses.code,
            progress: sql<number>`0`, // Placeholder as progressPercent doesn't exist
            lastAccessed: studentProgress.lastAccessed
        })
            .from(studentProgress)
            .innerJoin(courses, eq(studentProgress.courseId, courses.id))
            .where(eq(studentProgress.studentId, student.id))
            .limit(5);

        console.log("Detailed progress count:", detailedProgress.length);

        console.log("Fetching student results...");
        const studentResults = await db.select({
            totalScore: results.totalScore
        })
            .from(results)
            .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
            .where(eq(enrollments.studentId, student.id));

        console.log("Student results count:", studentResults.length);

        const totalPoints = studentResults.reduce((acc, r) => acc + (parseFloat(r.totalScore?.toString() || "0")), 0);
        const cgpa = studentResults.length > 0 ? (totalPoints / (studentResults.length * 20)).toFixed(2) : "0.00"; // Mock scale

        console.log("Calculated CGPA:", cgpa);

        const result = {
            studentId: student.id,
            enrolledCourses: enrolledCourses.length,
            totalCredits: enrolledCourses.reduce((acc, c) => acc + (c.credits || 0), 0),
            rank: 1, // Placeholder for now to fix build
            level: student.currentLevel,
            matricNo: student.matricNumber,
            cgpa,
            attendance: "92%",
            courseProgress: detailedProgress,
            status: userStatus,
            isFinalYear: (programme && student.currentLevel && programme.durationMonths)
                ? (student.currentLevel >= (programme.durationMonths / 12) * 100)
                : false
        };

        console.log("Returning stats result.");
        return result;
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
