import { db } from "@/db/db";
import {
    timetableSubmissions,
    timetableComments,
    departments,
    staffProfiles,
    courseLecturers,
    timetableSlots,
    users,
    institutionalUnits,
    venues,
    courses,
    faculties
} from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

/**
 * TimetableService
 * 
 * Encapsulates all business logic for timetable management.
 */
export class TimetableService {

    /**
     * patterns: 
     * isPractical: true -> lectureUnits = units - 1, practicalHours = 3
     * isPractical: false -> lectureUnits = units, practicalHours = 0
     * Rule: 1 Unit Lecture = 1 HR, 1 Unit Practical (Workshop/Lab) = 3 HRs
     */
    static getCourseHourRequirements(creditUnits: number, isPractical: boolean) {
        if (isPractical) {
            return {
                lecture: Math.max(0, creditUnits - 1),
                practical: 3
            };
        }
        return {
            lecture: creditUnits,
            practical: 0
        };
    }

    /**
     * Get the current submission status for a department
     */
    static async getSubmission(deptId: number, sessionId: number, semester: '1' | '2') {
        const rows = await db.select({
            submission: timetableSubmissions,
            submittedBy: users,
        })
            .from(timetableSubmissions)
            .leftJoin(users, eq(timetableSubmissions.submittedById, users.id))
            .where(and(
                eq(timetableSubmissions.deptId, deptId),
                eq(timetableSubmissions.sessionId, sessionId),
                eq(timetableSubmissions.semester, semester)
            ));

        if (rows.length === 0) return null;

        const main = rows[0];
        let submission = { ...main.submission, submittedBy: main.submittedBy, approvedBy: null as any, comments: [] as any[] };

        if (submission.approvedById) {
            const approver = await db.select().from(users).where(eq(users.id, submission.approvedById));
            if (approver.length > 0) submission.approvedBy = approver[0];
        }

        const comments = await db.select({
            comment: timetableComments,
            user: users
        })
            .from(timetableComments)
            .leftJoin(users, eq(timetableComments.userId, users.id))
            .where(eq(timetableComments.submissionId, submission.id))
            .orderBy(desc(timetableComments.createdAt));

        submission.comments = comments.map(c => ({ ...c.comment, user: c.user }));

        return submission;
    }

    static async isUserHOD(userId: number, deptId: number) {
        const result = await db.select({
            unit: institutionalUnits
        })
            .from(departments)
            .leftJoin(institutionalUnits, eq(departments.unitId, institutionalUnits.id))
            .where(eq(departments.id, deptId))
            .limit(1);

        return result[0]?.unit?.headUserId === userId;
    }

    static async isUserDean(userId: number, facultyId: number) {
        const result = await db.select({
            unit: institutionalUnits
        })
            .from(faculties)
            .leftJoin(institutionalUnits, eq(faculties.unitId, institutionalUnits.id))
            .where(eq(faculties.id, facultyId))
            .limit(1);

        return result[0]?.unit?.headUserId === userId;
    }

    static async validateAndSaveSlot(data: any) {
        const result = await db.select({
            assignment: courseLecturers,
            department: departments,
            course: courses
        })
            .from(courseLecturers)
            .leftJoin(departments, eq(courseLecturers.deptId, departments.id))
            .leftJoin(courses, eq(courseLecturers.courseId, courses.id))
            .where(eq(courseLecturers.id, data.courseLecturerId))
            .limit(1);

        const record = result[0];
        if (!record || !record.course) throw new Error("Assignment or Course not found");

        const assignment = { ...record.assignment, department: record.department, course: record.course };

        const submission = await this.getSubmission(assignment.deptId, assignment.sessionId, assignment.semester);
        if (submission?.status === 'approved') {
            throw new Error("Cannot modify an approved timetable");
        }

        // Logic for constraints (start/end/break)
        const settings = assignment.department!;
        const start = parseInt(data.startTime.replace(':', ''));
        const end = parseInt(data.endTime.replace(':', ''));
        const bStart = parseInt((settings.breakStart || "13:00").replace(':', ''));
        const bEnd = parseInt((settings.breakEnd || "14:00").replace(':', ''));

        if (start < bEnd && end > bStart) {
            throw new Error(`Cannot schedule class during break period`);
        }

        // Hour Requirement Check
        await this.checkHourRequirements(data, assignment);

        // Clash Detection
        await this.checkClashes(data, assignment);

        // Save to DB
        return await db.insert(timetableSlots).values(data);
    }

    private static async checkHourRequirements(data: any, assignment: any) {
        const reqs = this.getCourseHourRequirements(assignment.course.creditUnits, assignment.course.isPractical);
        const targetType = data.type as 'lecture' | 'practical';
        const allowed = targetType === 'lecture' ? reqs.lecture : reqs.practical;

        const existingSlots = await db.select().from(timetableSlots)
            .where(and(
                eq(timetableSlots.courseLecturerId, assignment.id),
                eq(timetableSlots.type, targetType)
            ));

        if (existingSlots.length >= allowed) {
            throw new Error(`This course has already filled its allocated ${allowed} hour(s) for ${targetType}s.`);
        }
    }

    private static async checkClashes(data: any, assignment: any) {
        const start = parseInt(data.startTime.replace(':', ''));
        const end = parseInt(data.endTime.replace(':', ''));

        const existingSlots = await db.select({
            slot: timetableSlots,
            assignment: courseLecturers
        })
            .from(timetableSlots)
            .leftJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
            .where(eq(timetableSlots.day, data.day));

        const activeSlots = existingSlots.filter(s =>
            s.assignment &&
            s.assignment.sessionId === assignment.sessionId &&
            s.assignment.semester === assignment.semester
        );

        for (const record of activeSlots) {
            const slot = record.slot;
            const slotAssignment = record.assignment!;

            const sStart = parseInt(slot.startTime.replace(':', ''));
            const sEnd = parseInt(slot.endTime.replace(':', ''));

            if (start < sEnd && end > sStart) {
                // Cross-Departmental Lecturer Clash
                if (slotAssignment.staffId === assignment.staffId) {
                    throw new Error(`Lecturer already has a class at this time (Day: ${data.day}, Time: ${slot.startTime} - ${slot.endTime})`);
                }

                // Venue Clash
                if (slot.venueId === data.venueId && data.venueId !== null) {
                    throw new Error("This venue is already occupied at this time.");
                }

                // Level Clash (Same Department)
                if (slot.level === data.level && slotAssignment.deptId === assignment.deptId) {
                    throw new Error(`Level ${data.level} already has a class at this time in this department.`);
                }
            }
        }
    }
}
