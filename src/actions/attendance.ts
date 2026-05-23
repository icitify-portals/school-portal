"use server";

import crypto from "crypto";
import { auth } from "@/auth";
import { NotificationService } from "@/services/NotificationService";

import { db } from "@/db/db";
import { attendance, staffProfiles, students, users, departments, courses, attendanceExcuses, parentStudentMappings, attendanceKioskTokens } from "@/db/schema";
import { eq, desc, and, gte, lte, sql, or, count, isNull } from "drizzle-orm";
import { lectureSessions, lectureAttendance, timetableSlots, courseLecturers } from "@/db/schema";
import { getAttendanceSettings, getSettingByKey } from "@/actions/settings";

// ... previous code ...

export async function getActiveLectureSession(courseId: number) {
    try {
        const sessionRows = await db.select({
            session: lectureSessions,
            slot: timetableSlots,
            assignment: courseLecturers
        })
            .from(lectureSessions)
            .leftJoin(timetableSlots, eq(lectureSessions.slotId, timetableSlots.id))
            .leftJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
            .where(and(
                eq(lectureSessions.status, 'ongoing'),
                eq(courseLecturers.courseId, courseId)
            ))
            .limit(1);

        const session = sessionRows[0] ? {
            ...sessionRows[0].session,
            slot: {
                ...sessionRows[0].slot,
                assignment: sessionRows[0].assignment
            }
        } : null;

        if (session) {
            return { success: true, session };
        }

        return { success: true, session: null };
    } catch (error) {
        console.error("Get Active Session Error:", error);
        return { error: "Failed to fetch active session." };
    }
}

// ... existing code ...

// Duplicate logAttendance placeholder removed

// --- NEW CLASS ATTENDANCE ACTIONS ---

export async function startLectureSession(slotId: number, type: 'physical' | 'online' = 'physical') {
    try {
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        const qrToken = crypto.randomUUID();
        const today = new Date();

        // ... existing startLectureSession logic ...
        const [result] = await db.insert(lectureSessions).values({
            slotId,
            date: today,
            qrToken,
            type,
            status: 'ongoing',
            startTime: today,
        });

        // Notify enrolled students (simple lookup for demo/test)
        // In full flow, we'd join with enrollments
        const studentsToNotify = await db.select().from(students).limit(5);
        studentsToNotify.forEach(s => {
            if (s.barcode) { // Barcode as placeholder for phone
                NotificationService.sendAcademicAlert(s.barcode, "Course", today.toLocaleTimeString());
            }
        });

        return { success: true, sessionId: result.insertId, qrToken };
    } catch (error) {
        console.error("Start Session Error:", error);
        return { error: "Failed to start lecture session." };
    }
}

export async function closeLectureSession(sessionId: number) {
    try {
        await db.update(lectureSessions)
            .set({
                status: 'completed',
                endTime: new Date()
            })
            .where(eq(lectureSessions.id, sessionId));

        return { success: true };
    } catch (error) {
        console.error("Close Session Error:", error);
        return { error: "Failed to close lecture session." };
    }
}

export async function rotateQrToken(sessionId: number) {
    try {
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        // Get the current session
        const [current] = await db.select().from(lectureSessions)
            .where(and(eq(lectureSessions.id, sessionId), eq(lectureSessions.status, 'ongoing')))
            .limit(1);

        if (!current) return { error: "Session not found or not active." };

        const newToken = crypto.randomUUID();

        // Store old token as previous, set new current token
        await db.execute(sql`
            UPDATE lecture_sessions 
            SET previous_qr_token = qr_token, qr_token = ${newToken}, qr_rotated_at = NOW()
            WHERE id = ${sessionId}
        `);

        return { success: true, qrToken: newToken };
    } catch (error) {
        console.error("Rotate QR Error:", error);
        return { error: "Failed to rotate QR token." };
    }
}

export async function getSessionAttendees(sessionId: number) {
    try {
        const attendees = await db.select({
            id: lectureAttendance.id,
            timeIn: lectureAttendance.timeIn,
            timeOut: lectureAttendance.timeOut,
            method: lectureAttendance.method,
            studentName: users.name,
            matricNo: students.matricNumber,
        })
            .from(lectureAttendance)
            .innerJoin(students, eq(lectureAttendance.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(lectureAttendance.sessionId, sessionId))
            .orderBy(desc(lectureAttendance.timeIn));

        return { success: true, attendees };
    } catch (error) {
        console.error("Get Attendees Error:", error);
        return { success: true, attendees: [] };
    }
}

export async function scanLectureQR(qrToken: string) {
    try {
        const authSession = await auth();
        if (!authSession?.user?.id) return { error: "Unauthorized" };

        // Find student
        const [student] = await db.select().from(students).where(eq(students.userId, parseInt(authSession.user.id))).limit(1);
        if (!student) return { error: "Student profile not found." };

        // Find active session by current token OR previous token (grace window)
        const [session] = await db.select().from(lectureSessions).where(and(
            or(
                eq(lectureSessions.qrToken, qrToken),
                sql`${lectureSessions}.previous_qr_token = ${qrToken}`
            ),
            eq(lectureSessions.status, 'ongoing')
        )).limit(1);

        if (!session) return { error: "Invalid or expired lecture QR code." };

        // Check if already signed in
        const [existing] = await db.select().from(lectureAttendance).where(and(
            eq(lectureAttendance.sessionId, session.id),
            eq(lectureAttendance.studentId, student.id)
        )).limit(1);

        if (existing) {
            // If already in, maybe they are signing out?
            if (!existing.timeOut) {
                await db.update(lectureAttendance)
                    .set({ timeOut: new Date() })
                    .where(eq(lectureAttendance.id, existing.id));
                return { success: true, message: "Checked out successfully." };
            }
            return { error: "Attendance already recorded for this session." };
        }

        // New check-in
        await db.insert(lectureAttendance).values({
            sessionId: session.id,
            studentId: student.id,
            timeIn: new Date(),
            method: 'qr'
        });

        return { success: true, message: "Checked in successfully." };
    } catch (error) {
        console.error("QR Scan Error:", error);
        return { error: "Failed to process QR scan." };
    }
}

export async function markOnlinePresence(sessionId: number, action: 'in' | 'out') {
    try {
        const authSession = await auth();
        if (!authSession?.user?.id) return { error: "Unauthorized" };

        const [student] = await db.select().from(students).where(eq(students.userId, parseInt(authSession.user.id))).limit(1);
        if (!student) return { error: "Student profile not found." };

        const [session] = await db.select().from(lectureSessions).where(eq(lectureSessions.id, sessionId)).limit(1);

        if (!session || session.status !== 'ongoing') {
            return { error: "Class session is not active." };
        }

        const [existing] = await db.select().from(lectureAttendance).where(and(
            eq(lectureAttendance.sessionId, sessionId),
            eq(lectureAttendance.studentId, student.id)
        )).limit(1);

        if (action === 'in') {
            if (existing) return { success: true, message: "Already marked as present." };
            await db.insert(lectureAttendance).values({
                sessionId,
                studentId: student.id,
                timeIn: new Date(),
                method: session.type === 'online' ? 'manual_online' : 'qr'
            });
        } else {
            if (!existing) return { error: "No entry record found." };
            await db.update(lectureAttendance)
                .set({ timeOut: new Date() })
                .where(eq(lectureAttendance.id, existing.id));
        }

        return { success: true };
    } catch (error) {
        console.error("Online Attendance Error:", error);
        return { error: "Failed to mark presence." };
    }
}

export async function getAttendanceAnalysis() {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const logsRaw = await db
            .select({
                attendance: attendance,
                user: users,
            })
            .from(attendance)
            .innerJoin(users, eq(attendance.userId, users.id))
            .where(gte(attendance.timestamp, todayStart))
            .orderBy(desc(attendance.timestamp));

        // Note: Granular roles (r.user.roles) are not easily fetched in one go without JSON_ARRAYAGG
        // Since getAttendanceAnalysis only uses userName, type, and timestamp in its final return,
        // we can simplify the roles fetch if it's not strictly needed for the analysis logic below.
        const logs = logsRaw.map(r => ({
            ...r.attendance,
            user: r.user
        }));

        // 1. Summary Stats
        const totalPresentToday = new Set(logs.map(l => l.userId)).size;

        // Find users whose last log today was "in"
        const lastLogsMap = new Map();
        [...logs].reverse().forEach(log => {
            lastLogsMap.set(log.userId, log.type);
        });
        const currentlyIn = Array.from(lastLogsMap.values()).filter(type => type === 'in').length;

        // Late arrivals (e.g., after 8:30 AM)
        const lateThreshold = new Date(todayStart);
        lateThreshold.setHours(8, 30, 0, 0);
        const lateArrivals = logs.filter(l => l.type === 'in' && l.timestamp! > lateThreshold).length;

        // 2. Hourly Trend (Today)
        const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }));
        logs.filter(l => l.type === 'in').forEach(log => {
            const hour = log.timestamp!.getHours();
            hourlyData[hour].count++;
        });

        // 3. Last 7 Days Trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const historicalLogs = await db.select({
            date: sql<string>`DATE(${attendance.timestamp})`,
            count: sql<number>`count(*)`
        })
            .from(attendance)
            .where(and(eq(attendance.type, 'in'), gte(attendance.timestamp, sevenDaysAgo)))
            .groupBy(sql`DATE(${attendance.timestamp})`)
            .orderBy(sql`DATE(${attendance.timestamp})`);

        // 4. Detailed Logs (for table)
        // We'll return the full raw logs for the table, but perhaps paginated in a real app.
        // For now, let's just return what we have.

        return {
            success: true,
            data: {
                summary: {
                    totalPresentToday,
                    currentlyIn,
                    lateArrivals,
                },
                hourlyTrend: hourlyData.filter(h => h.count > 0 || (new Date().getHours() >= parseInt(h.hour))),
                historicalTrend: historicalLogs,
                detailedLogs: logs.map(l => ({
                    id: l.id,
                    userName: l.user?.name,
                    timestamp: l.timestamp,
                    type: l.type,
                }))
            }
        };
    } catch (error) {
        console.error("Analysis Error:", error);
        return { error: "Failed to generate attendance analysis." };
    }
}

export async function logAttendance(barcode: string) {
    try {
        // 1. Find the user by barcode (check students first, then staff)
        let userId: number | null = null;
        let userName: string = "";
        let userRole: string = "";
        let studentId: number | null = null;

        const studentResult = await db
            .select({ student: students, user: users })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.barcode, barcode))
            .limit(1);

        if (studentResult.length > 0 && studentResult[0].user) {
            userId = studentResult[0].user.id;
            userName = studentResult[0].user.name;
            userRole = "student";
            studentId = studentResult[0].student.id;
        } else {
            const staffResult = await db
                .select({ staff: staffProfiles, user: users })
                .from(staffProfiles)
                .innerJoin(users, eq(staffProfiles.userId, users.id))
                .where(eq(staffProfiles.barcode, barcode))
                .limit(1);

            if (staffResult.length > 0 && staffResult[0].user) {
                userId = staffResult[0].user.id;
                userName = staffResult[0].user.name;
                userRole = "staff";
            }
        }

        if (!userId) {
            return { error: "User not found for this barcode." };
        }

        // 2. Get the last attendance record to determine if they are coming in or out
        const lastRecord = await db
            .select()
            .from(attendance)
            .where(eq(attendance.userId, userId))
            .orderBy(desc(attendance.timestamp))
            .limit(1);

        const newType = lastRecord[0]?.type === "in" ? "out" : "in";
        const now = new Date();
        const settings = await getAttendanceSettings();
        
        let isLate = false;
        if (newType === 'in') {
            const openingTime = new Date(now);
            openingTime.setHours(8, 0, 0, 0); // Default 8:00 AM
            const lateTime = new Date(openingTime.getTime() + settings.lateThresholdMinutes * 60000);
            if (now > lateTime) isLate = true;
        }

        // 3. Create the attendance record
        await db.insert(attendance).values({
            userId,
            type: newType,
            category: userRole as any,
            location: 'gate',
            isLate,
            timestamp: now,
        });

        // 4. Notifications
        const timeString = now.toLocaleTimeString();
        
        // Notify Parent if Student
        if (userRole === 'student' && studentId) {
            const mappings = await db.select({ parentEmail: users.email })
                .from(parentStudentMappings)
                .innerJoin(users, eq(parentStudentMappings.parentId, users.id))
                .where(eq(parentStudentMappings.studentId, studentId));
            
            for (const m of mappings) {
                if (m.parentEmail) {
                    NotificationService.sendAttendanceGateAlert(m.parentEmail, {
                        userName,
                        type: newType,
                        time: timeString,
                        location: 'Main Gate'
                    });
                }
            }
        }

        // Notify Admin on Check-out
        if (newType === 'out') {
            const adminEmail = await getSettingByKey('admin_notification_email') || 'admin@school.edu';
            NotificationService.sendAttendanceGateAlert(adminEmail, {
                userName: `${userName} (${userRole})`,
                type: 'out',
                time: timeString,
                location: 'Main Gate'
            });
        }

        return {
            success: true,
            message: `${userName} (${userRole}) logged ${newType === "in" ? "IN" : "OUT"} successfully.`,
            userName,
            userRole,
            type: newType,
            isLate
        };
    } catch (error) {
        console.error("Attendance Error:", error);
        return { error: "An unexpected error occurred while logging attendance." };
    }
}

export async function generateKioskToken() {
    try {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60000); // 1 minute expiry

        await db.insert(attendanceKioskTokens).values({
            token,
            expiresAt
        });

        return { success: true, token };
    } catch (error) {
        return { error: "Failed to generate token" };
    }
}

export async function logKioskAttendance(token: string) {
    try {
        const authSession = await auth();
        if (!authSession?.user?.id) return { error: "Unauthorized" };

        const userId = parseInt(authSession.user.id);
        const [validToken] = await db.select().from(attendanceKioskTokens)
            .where(and(
                eq(attendanceKioskTokens.token, token),
                gte(attendanceKioskTokens.expiresAt, new Date())
            )).limit(1);

        if (!validToken) return { error: "Invalid or expired Kiosk QR code." };

        // Determine type (in/out) based on last record
        const [last] = await db.select().from(attendance)
            .where(eq(attendance.userId, userId))
            .orderBy(desc(attendance.timestamp))
            .limit(1);
        
        const newType = last?.type === 'in' ? 'out' : 'in';

        await db.insert(attendance).values({
            userId,
            type: newType,
            location: 'kiosk',
            category: (authSession.user as any).role || 'student',
        });

        return { success: true, message: `Successfully logged ${newType.toUpperCase()} via Kiosk.` };
    } catch (error) {
        return { error: "Failed to log kiosk attendance." };
    }
}

// --- FEATURE 2: ATTENDANCE PERCENTAGE PER COURSE ---

export async function getStudentCourseAttendance(studentId?: number) {
    try {
        const authSession = await auth();
        if (!authSession?.user?.id) return { error: "Unauthorized" };

        let sid = studentId;
        if (!sid) {
            const [student] = await db.select().from(students).where(eq(students.userId, parseInt(authSession.user.id))).limit(1);
            if (!student) return { error: "Student profile not found." };
            sid = student.id;
        }

        const settings = await getAttendanceSettings();

        // Get all courses the student has attendance records for
        const studentAttendanceRows = await db.select({
            courseId: courseLecturers.courseId,
            courseName: courses.name,
            courseCode: courses.code,
            creditUnits: courses.creditUnits,
            sessionId: lectureSessions.id,
            attendanceId: lectureAttendance.id,
            timeIn: lectureAttendance.timeIn,
            status: lectureAttendance.status,
            sessionDate: lectureSessions.date,
        })
            .from(lectureAttendance)
            .innerJoin(lectureSessions, eq(lectureAttendance.sessionId, lectureSessions.id))
            .innerJoin(timetableSlots, eq(lectureSessions.slotId, timetableSlots.id))
            .innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
            .innerJoin(courses, eq(courseLecturers.courseId, courses.id))
            .where(eq(lectureAttendance.studentId, sid))
            .orderBy(desc(lectureSessions.date));

        // Get total sessions per course (all completed/ongoing sessions)
        const allSessions = await db.select({
            courseId: courseLecturers.courseId,
            sessionCount: count(lectureSessions.id),
        })
            .from(lectureSessions)
            .innerJoin(timetableSlots, eq(lectureSessions.slotId, timetableSlots.id))
            .innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
            .where(or(eq(lectureSessions.status, 'completed'), eq(lectureSessions.status, 'ongoing')))
            .groupBy(courseLecturers.courseId);

        const sessionMap = new Map(allSessions.map(s => [s.courseId, Number(s.sessionCount)]));

        // Group attendance by course
        const courseMap = new Map<number, {
            courseId: number; courseName: string; courseCode: string; creditUnits: number;
            attended: number; sessions: any[];
        }>();

        for (const row of studentAttendanceRows) {
            if (!courseMap.has(row.courseId)) {
                courseMap.set(row.courseId, {
                    courseId: row.courseId,
                    courseName: row.courseName,
                    courseCode: row.courseCode,
                    creditUnits: row.creditUnits,
                    attended: 0,
                    sessions: [],
                });
            }
            const entry = courseMap.get(row.courseId)!;
            entry.attended++;
            entry.sessions.push({
                sessionId: row.sessionId,
                date: row.sessionDate,
                timeIn: row.timeIn,
                status: row.status,
            });
        }

        const courseAttendance = Array.from(courseMap.values()).map(c => {
            const totalSessions = sessionMap.get(c.courseId) || c.attended;
            const percentage = totalSessions > 0 ? Math.round((c.attended / totalSessions) * 100) : 100;
            const riskStatus = percentage >= settings.safeThreshold ? 'safe'
                : percentage >= settings.warningThreshold ? 'warning'
                : 'at_risk';

            return {
                ...c,
                totalSessions,
                percentage,
                riskStatus,
            };
        });

        // Summary
        const totalClasses = courseAttendance.reduce((s, c) => s + c.totalSessions, 0);
        const totalAttended = courseAttendance.reduce((s, c) => s + c.attended, 0);
        const totalMissed = totalClasses - totalAttended;
        const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;

        return {
            success: true,
            courses: courseAttendance,
            summary: { totalClasses, totalAttended, totalMissed, overallPercentage },
            settings: settings,
        };
    } catch (error) {
        console.error("Student Course Attendance Error:", error);
        return { error: "Failed to fetch attendance data." };
    }
}

export async function getCourseAttendanceSummary(courseId: number) {
    try {
        const authSession = await auth();
        if (!authSession?.user) return { error: "Unauthorized" };

        const settings = await getAttendanceSettings();

        // Get all sessions for this course
        const sessions = await db.select({ id: lectureSessions.id })
            .from(lectureSessions)
            .innerJoin(timetableSlots, eq(lectureSessions.slotId, timetableSlots.id))
            .innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
            .where(and(
                eq(courseLecturers.courseId, courseId),
                or(eq(lectureSessions.status, 'completed'), eq(lectureSessions.status, 'ongoing'))
            ));

        const totalSessions = sessions.length;
        const sessionIds = sessions.map(s => s.id);

        if (totalSessions === 0) {
            return { success: true, students: [], totalSessions: 0, courseId };
        }

        // Get all attendance records for these sessions
        const attendanceRows = await db.select({
            studentId: lectureAttendance.studentId,
            studentName: users.name,
            matricNo: students.matricNumber,
            attendanceCount: count(lectureAttendance.id),
        })
            .from(lectureAttendance)
            .innerJoin(students, eq(lectureAttendance.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .where(sql`${lectureAttendance.sessionId} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`)
            .groupBy(lectureAttendance.studentId, users.name, students.matricNumber);

        const studentSummary = attendanceRows.map(row => {
            const attended = Number(row.attendanceCount);
            const percentage = Math.round((attended / totalSessions) * 100);
            const riskStatus = percentage >= settings.safeThreshold ? 'safe'
                : percentage >= settings.warningThreshold ? 'warning'
                : 'at_risk';

            return {
                studentId: row.studentId,
                studentName: row.studentName,
                matricNo: row.matricNo,
                attended,
                totalSessions,
                percentage,
                riskStatus,
            };
        });

        return { success: true, students: studentSummary, totalSessions, courseId };
    } catch (error) {
        console.error("Course Attendance Summary Error:", error);
        return { error: "Failed to fetch course attendance summary." };
    }
}

export async function manualMarkAttendance(sessionId: number, studentId: number, status: 'present' | 'late' = 'present') {
    try {
        const authSession = await auth();
        if (!authSession?.user) return { error: "Unauthorized" };

        // Verify session exists
        const [session] = await db.select().from(lectureSessions).where(eq(lectureSessions.id, sessionId)).limit(1);
        if (!session) return { error: "Session not found." };

        // Check if already has attendance
        const [existing] = await db.select().from(lectureAttendance).where(and(
            eq(lectureAttendance.sessionId, sessionId),
            eq(lectureAttendance.studentId, studentId)
        )).limit(1);

        if (existing) {
            // Update status if already exists
            await db.update(lectureAttendance)
                .set({ status, method: 'manual' })
                .where(eq(lectureAttendance.id, existing.id));
            return { success: true, message: "Attendance updated (manual override)." };
        }

        await db.insert(lectureAttendance).values({
            sessionId,
            studentId,
            timeIn: new Date(),
            method: 'manual',
            status,
        });

        return { success: true, message: "Attendance marked manually." };
    } catch (error) {
        console.error("Manual Mark Error:", error);
        return { error: "Failed to manually mark attendance." };
    }
}

// --- FEATURE 4: EXCUSE/EXEMPTION SYSTEM ---

export async function submitExcuse(data: {
    courseId: number;
    sessionId?: number;
    reason: string;
    excuseType: 'medical' | 'official_duty' | 'family_emergency' | 'other';
    documentUrl?: string;
}) {
    try {
        const authSession = await auth();
        if (!authSession?.user?.id) return { error: "Unauthorized" };

        const [student] = await db.select().from(students).where(eq(students.userId, parseInt(authSession.user.id))).limit(1);
        if (!student) return { error: "Student profile not found." };

        const settings = await getAttendanceSettings();

        // Check excuse window if session is specified
        if (data.sessionId) {
            const [session] = await db.select().from(lectureSessions).where(eq(lectureSessions.id, data.sessionId)).limit(1);
            if (session) {
                const sessionDate = new Date(session.date);
                const daysSince = Math.floor((Date.now() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSince > settings.excuseWindowDays) {
                    return { error: `Excuse window has expired. You can only submit excuses within ${settings.excuseWindowDays} days of the session.` };
                }
            }
        }

        await db.insert(attendanceExcuses).values({
            studentId: student.id,
            sessionId: data.sessionId || null,
            courseId: data.courseId,
            reason: data.reason,
            excuseType: data.excuseType,
            documentUrl: data.documentUrl || null,
            status: 'pending',
        });

        return { success: true, message: "Excuse submitted successfully." };
    } catch (error) {
        console.error("Submit Excuse Error:", error);
        return { error: "Failed to submit excuse." };
    }
}

export async function getMyExcuses() {
    try {
        const authSession = await auth();
        if (!authSession?.user?.id) return { error: "Unauthorized" };

        const [student] = await db.select().from(students).where(eq(students.userId, parseInt(authSession.user.id))).limit(1);
        if (!student) return { error: "Student profile not found." };

        const excuses = await db.select({
            id: attendanceExcuses.id,
            courseId: attendanceExcuses.courseId,
            courseName: courses.name,
            courseCode: courses.code,
            reason: attendanceExcuses.reason,
            excuseType: attendanceExcuses.excuseType,
            documentUrl: attendanceExcuses.documentUrl,
            status: attendanceExcuses.status,
            reviewNotes: attendanceExcuses.reviewNotes,
            createdAt: attendanceExcuses.createdAt,
            reviewedAt: attendanceExcuses.reviewedAt,
        })
            .from(attendanceExcuses)
            .innerJoin(courses, eq(attendanceExcuses.courseId, courses.id))
            .where(eq(attendanceExcuses.studentId, student.id))
            .orderBy(desc(attendanceExcuses.createdAt));

        return { success: true, excuses };
    } catch (error) {
        console.error("Get Excuses Error:", error);
        return { error: "Failed to fetch excuses." };
    }
}

export async function reviewExcuse(excuseId: number, status: 'approved' | 'rejected', notes?: string) {
    try {
        const authSession = await auth();
        if (!authSession?.user?.id) return { error: "Unauthorized" };

        await db.update(attendanceExcuses)
            .set({
                status,
                reviewNotes: notes || null,
                reviewedBy: parseInt(authSession.user.id),
                reviewedAt: new Date(),
            })
            .where(eq(attendanceExcuses.id, excuseId));

        return { success: true, message: `Excuse ${status} successfully.` };
    } catch (error) {
        console.error("Review Excuse Error:", error);
        return { error: "Failed to review excuse." };
    }
}

export async function getPendingExcuses(courseId?: number) {
    try {
        const authSession = await auth();
        if (!authSession?.user) return { error: "Unauthorized" };

        let query = db.select({
            id: attendanceExcuses.id,
            studentName: users.name,
            matricNo: students.matricNumber,
            courseId: attendanceExcuses.courseId,
            courseName: courses.name,
            courseCode: courses.code,
            reason: attendanceExcuses.reason,
            excuseType: attendanceExcuses.excuseType,
            documentUrl: attendanceExcuses.documentUrl,
            status: attendanceExcuses.status,
            createdAt: attendanceExcuses.createdAt,
        })
            .from(attendanceExcuses)
            .innerJoin(students, eq(attendanceExcuses.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(courses, eq(attendanceExcuses.courseId, courses.id));

        let excuses;
        if (courseId) {
            excuses = await query
                .where(and(eq(attendanceExcuses.status, 'pending'), eq(attendanceExcuses.courseId, courseId)))
                .orderBy(desc(attendanceExcuses.createdAt));
        } else {
            excuses = await query
                .where(eq(attendanceExcuses.status, 'pending'))
                .orderBy(desc(attendanceExcuses.createdAt));
        }

        return { success: true, excuses };
    } catch (error) {
        console.error("Get Pending Excuses Error:", error);
        return { error: "Failed to fetch pending excuses." };
    }
}

// --- FEATURE 5: EXAM ELIGIBILITY GATE ---

export async function checkExamEligibility(studentId: number, courseId: number) {
    try {
        const settings = await getAttendanceSettings();

        // Get total sessions for this course
        const totalSessionsResult = await db.select({ total: count(lectureSessions.id) })
            .from(lectureSessions)
            .innerJoin(timetableSlots, eq(lectureSessions.slotId, timetableSlots.id))
            .innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
            .where(and(
                eq(courseLecturers.courseId, courseId),
                or(eq(lectureSessions.status, 'completed'), eq(lectureSessions.status, 'ongoing'))
            ));

        const totalSessions = Number(totalSessionsResult[0]?.total || 0);

        if (totalSessions === 0) {
            return {
                eligible: true,
                attendancePercentage: 100,
                minimumRequired: settings.eligibilityThreshold,
                approvedExcuses: 0,
                totalSessions: 0,
                attendedSessions: 0,
                message: "No sessions recorded yet."
            };
        }

        // Get attended sessions
        const attendedResult = await db.select({ attended: count(lectureAttendance.id) })
            .from(lectureAttendance)
            .innerJoin(lectureSessions, eq(lectureAttendance.sessionId, lectureSessions.id))
            .innerJoin(timetableSlots, eq(lectureSessions.slotId, timetableSlots.id))
            .innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
            .where(and(
                eq(lectureAttendance.studentId, studentId),
                eq(courseLecturers.courseId, courseId)
            ));

        const attendedSessions = Number(attendedResult[0]?.attended || 0);

        // Get approved excuses count
        const excusesResult = await db.select({ approved: count(attendanceExcuses.id) })
            .from(attendanceExcuses)
            .where(and(
                eq(attendanceExcuses.studentId, studentId),
                eq(attendanceExcuses.courseId, courseId),
                eq(attendanceExcuses.status, 'approved')
            ));

        const approvedExcuses = Number(excusesResult[0]?.approved || 0);

        // Calculate effective attendance (attended + approved excuses)
        const effectiveAttendance = attendedSessions + approvedExcuses;
        const attendancePercentage = Math.round((effectiveAttendance / totalSessions) * 100);
        const eligible = attendancePercentage >= settings.eligibilityThreshold;

        return {
            eligible,
            attendancePercentage,
            minimumRequired: settings.eligibilityThreshold,
            approvedExcuses,
            totalSessions,
            attendedSessions,
            message: eligible
                ? "Student meets attendance requirements."
                : `Student has ${attendancePercentage}% attendance (minimum ${settings.eligibilityThreshold}% required).`
        };
    } catch (error) {
        console.error("Eligibility Check Error:", error);
        return { eligible: false, error: "Failed to check eligibility." };
    }
}
