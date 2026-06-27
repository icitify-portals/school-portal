"use strict";
"use server";

import { db } from "@/db/db";
import { academicSessions, courses, staffProfiles, departments, courseLecturers, timetableSlots, users, students, enrollments, timetableSubmissions, timetableComments, institutionalUnits, courseDepartmentSettings, venues as venuesTable } from "@/db/schema";
import { eq, and, or, gte, lte, count, sql, desc, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";
import { TimetableService } from "@/services/TimetableService";
import { TimetableAutoScheduler } from "@/services/TimetableAutoScheduler";

export async function generateAutoTimetable(deptId: number, sessionId: number, semester: '1' | '2', preserveExisting: boolean = true) {
    try {
        const allowed = await hasPermission("academic.timetable.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to generate auto-schedule" };
        const result = await TimetableAutoScheduler.generate(deptId, sessionId, semester, preserveExisting);
        revalidatePath("/admin/academics/timetable");
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getStaffDepartment(userId: number) {
    try {
        const [staff] = await db
            .select({ departmentId: staffProfiles.departmentId })
            .from(staffProfiles)
            .where(eq(staffProfiles.userId, userId))
            .limit(1);
        return staff?.departmentId;
    } catch (error) {
        console.error("Failed to fetch staff department:", error);
        return null;
    }
}

export async function isUserHOD(userId: number, deptId: number) {
    return await TimetableService.isUserHOD(userId, deptId);
}

export async function isUserDean(userId: number, facultyId: number) {
    return await TimetableService.isUserDean(userId, facultyId);
}

export async function getDepartmentStaff(deptId: number) {
    try {
        const staff = await db
            .select({
                id: staffProfiles.id,
                userId: staffProfiles.userId,
                departmentId: staffProfiles.departmentId,
                jobTitle: staffProfiles.jobTitle,
                rank: staffProfiles.rank,
                user: users
            })
            .from(staffProfiles)
            .innerJoin(users, eq(staffProfiles.userId, users.id))
            .where(eq(staffProfiles.departmentId, deptId));

        return staff;
    } catch (error) {
        console.error("Failed to fetch department staff:", error);
        return [];
    }
}

export async function getVenues(facultyId: number) {
    try {
        return await db.select().from(venuesTable).where(eq(venuesTable.facultyId, facultyId));
    } catch (error) {
        console.error("Failed to fetch venues:", error);
        return [];
    }
}

export async function saveVenue(data: { name: string; capacity?: number; facultyId: number; id?: number }) {
    try {
        const allowed = await hasPermission("academic.timetable.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to save venue" };
        if (data.id) {
            await db.update(venuesTable).set(data).where(eq(venuesTable.id, data.id));
        } else {
            await db.insert(venuesTable).values(data as any);
        }
        revalidatePath("/admin/academics/timetable");
        return { success: true };
    } catch (error) {
        console.error("Failed to save venue:", error);
        return { success: false, error: "Failed to save venue" };
    }
}

export async function toggleCoursePractical(courseId: number, isPractical: boolean) {
    try {
        const allowed = await hasPermission("academic.timetable.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to modify course practical status" };
        await db.update(courses).set({ isPractical }).where(eq(courses.id, courseId));
        revalidatePath("/admin/academics/timetable");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle course practical status:", error);
        return { success: false, error: "Failed to update course" };
    }
}

export async function getDepartmentSettings(deptId: number) {
    try {
        const [dept] = await db.select().from(departments).where(eq(departments.id, deptId)).limit(1);
        return dept || null;
    } catch (error) {
        console.error("Failed to fetch department settings:", error);
        return null;
    }
}

export async function updateDepartmentTimetableSettings(deptId: number, data: {
    timetableStart: string;
    timetableEnd: string;
    breakStart: string;
    breakEnd: string;
}) {
    try {
        const allowed = await hasPermission("academic.timetable.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update timetable settings" };
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'admin') {
            return { success: false, error: "Unauthorized" };
        }

        await db.update(departments)
            .set(data)
            .where(eq(departments.id, deptId));

        revalidatePath("/admin/academics/timetable");
        return { success: true };
    } catch (error) {
        console.error("Failed to update department settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}

export async function getTimetableSubmission(deptId: number, sessionId: number, semester: '1' | '2') {
    try {
        return await TimetableService.getSubmission(deptId, sessionId, semester);
    } catch (error) {
        console.error("Failed to fetch timetable submission:", error);
        return null;
    }
}

export async function submitTimetableForApproval(deptId: number, sessionId: number, semester: '1' | '2') {
    try {
        const allowed = await hasPermission("academic.timetable.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("hod");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to submit timetable for approval" };
        const session = await auth();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const existing = await getTimetableSubmission(deptId, sessionId, semester);

        if (existing) {
            await db.update(timetableSubmissions)
                .set({
                    status: 'pending_approval',
                    submittedById: parseInt((session.user as any).id),
                    updatedAt: new Date()
                })
                .where(eq(timetableSubmissions.id, existing.id));
        } else {
            await db.insert(timetableSubmissions).values({
                deptId,
                sessionId,
                semester,
                status: 'pending_approval',
                submittedById: parseInt((session.user as any).id)
            });
        }

        revalidatePath("/admin/academics/timetable");
        return { success: true };
    } catch (error) {
        console.error("Failed to submit timetable:", error);
        return { success: false, error: "Failed to submit timetable" };
    }
}

export async function approveTimetable(submissionId: number, notes?: string) {
    try {
        const allowed = await hasPermission("academic.timetable.approve") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("dean");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to approve timetable" };
        const session = await auth();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const submissionRows = await db.select({
            submission: timetableSubmissions,
            department: departments
        })
            .from(timetableSubmissions)
            .innerJoin(departments, eq(timetableSubmissions.deptId, departments.id))
            .where(eq(timetableSubmissions.id, submissionId))
            .limit(1);

        const submission = submissionRows[0] ? {
            ...submissionRows[0].submission,
            department: submissionRows[0].department
        } : null;

        if (!submission) return { success: false, error: "Submission not found" };

        const isDean = await TimetableService.isUserDean(parseInt((session.user as any).id), (submission.department as any).facultyId);
        const isAdmin = (session.user as any).role === 'admin';

        if (!isDean && !isAdmin) {
            return { success: false, error: "Only the Dean or Admin can give final approval." };
        }

        await db.update(timetableSubmissions)
            .set({
                status: 'approved',
                approvedById: parseInt((session.user as any).id),
                approvalNotes: notes,
                updatedAt: new Date()
            })
            .where(eq(timetableSubmissions.id, submissionId));

        revalidatePath("/admin/academics/timetable");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve timetable:", error);
        return { success: false, error: "Failed to approve timetable" };
    }
}

export async function requestTimetableRevision(submissionId: number, notes: string) {
    try {
        const allowed = await hasPermission("academic.timetable.approve") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("dean");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to request revision" };
        const session = await auth();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        await db.update(timetableSubmissions)
            .set({
                status: 'draft',
                approvalNotes: notes,
                updatedAt: new Date()
            })
            .where(eq(timetableSubmissions.id, submissionId));

        // Add the notes as a comment too
        await db.insert(timetableComments).values({
            submissionId,
            userId: parseInt((session.user as any).id),
            content: notes
        });

        revalidatePath("/admin/academics/timetable");
        return { success: true };
    } catch (error) {
        console.error("Failed to request revision:", error);
        return { success: false, error: "Failed to request revision" };
    }
}

export async function addTimetableComment(submissionId: number, content: string) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        await db.insert(timetableComments).values({
            submissionId,
            userId: parseInt((session.user as any).id),
            content
        });

        revalidatePath("/admin/academics/timetable");
        return { success: true };
    } catch (error) {
        console.error("Failed to add comment:", error);
        return { success: false, error: "Failed to add comment" };
    }
}

export async function assignCourseToLecturer(data: {
    sessionId: number;
    courseId: number;
    staffId: number;
    deptId: number;
    semester: '1' | '2';
    role?: 'main' | 'co_lecturer';
}) {
    try {
        const allowed = await hasPermission("academic.timetable.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("hod");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to assign lecturer" };
        // Check if assignment already exists for this STAFF and COURSE
        const existing = await db.select().from(courseLecturers).where(and(
            eq(courseLecturers.sessionId, data.sessionId),
            eq(courseLecturers.courseId, data.courseId),
            eq(courseLecturers.staffId, data.staffId),
            eq(courseLecturers.semester, data.semester)
        )).limit(1);

        if (existing.length > 0) {
            // Update role if exists
            await db.update(courseLecturers)
                .set({
                    role: data.role || 'main'
                })
                .where(eq(courseLecturers.id, existing[0].id));
        } else {
            // Check if there is already a 'main' lecturer for this course?
            // Optional: enforce only one main lecturer? Or allow multiple?
            // For now, just insert.
            await db.insert(courseLecturers).values({
                ...data,
                role: data.role || 'main',
                canGrade: true
            });
        }

        revalidatePath("/admin/academics/timetable");
        revalidatePath("/admin/academics/assignments");
        return { success: true };
    } catch (error) {
        console.error("Failed to assign course to lecturer:", error);
        return { success: false, error: "Failed to assign course" };
    }
}

export async function removeLecturerFromCourse(assignmentId: number) {
    try {
        const allowed = await hasPermission("academic.timetable.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("hod");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to remove lecturer" };
        await db.delete(courseLecturers).where(eq(courseLecturers.id, assignmentId));
        revalidatePath("/admin/academics/timetable");
        revalidatePath("/admin/academics/assignments");
        return { success: true };
    } catch (error) {
        console.error("Failed to remove lecturer:", error);
        return { success: false, error: "Failed to remove lecturer" };
    }
}

export async function getCourseAssignments(deptId: number, sessionId: number, semester: '1' | '2') {
    try {
        const rows = await db.select({
            assignment: courseLecturers,
            course: courses,
            staff: staffProfiles,
            user: users
        })
            .from(courseLecturers)
            .leftJoin(courses, eq(courseLecturers.courseId, courses.id))
            .leftJoin(staffProfiles, eq(courseLecturers.staffId, staffProfiles.id))
            .leftJoin(users, eq(staffProfiles.userId, users.id))
            .where(and(
                eq(courseLecturers.deptId, deptId),
                eq(courseLecturers.sessionId, sessionId),
                eq(courseLecturers.semester, semester)
            ));

        const assignmentIds = rows.map(r => r.assignment.id);

        let slots: any[] = [];
        if (assignmentIds.length > 0) {
            slots = await db.select({
                slot: timetableSlots,
                venue: venuesTable
            })
                .from(timetableSlots)
                .leftJoin(venuesTable, eq(timetableSlots.venueId, venuesTable.id))
                .where(inArray(timetableSlots.courseLecturerId, assignmentIds));
        }

        return rows.map(r => {
            const courseSlots = slots.filter(s => s.slot.courseLecturerId === r.assignment.id);
            const reqs = TimetableService.getCourseHourRequirements(r.course?.creditUnits || 0, r.course?.isPractical || false);

            return {
                ...r.assignment,
                course: r.course,
                staff: r.staff ? { ...r.staff, user: r.user } : null,
                slots: courseSlots.map(cs => ({ ...cs.slot, venue: cs.venue })),
                requirements: reqs,
                stats: {
                    lecture: courseSlots.filter(s => s.slot.type === 'lecture').length,
                    practical: courseSlots.filter(s => s.slot.type === 'practical').length
                }
            };
        });
    } catch (error) {
        console.error("Failed to fetch course assignments:", error);
        return [];
    }
}

export async function saveTimetableSlot(data: {
    courseLecturerId: number;
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    startTime: string;
    endTime: string;
    venueId: number;
    type: 'lecture' | 'practical';
    level: number;
}) {
    try {
        const allowed = await hasPermission("academic.timetable.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("hod");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to save timetable slot" };
        // Clash detection logic (still here for now, or could be moved to service)
        // ... (keeping clash detection and just delegating the save/validate)

        await TimetableService.validateAndSaveSlot(data);

        revalidatePath("/admin/academics/timetable");
        revalidatePath("/admin/academics/assignments");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to save timetable slot:", error);
        return { success: false, error: error.message || "Failed to save slot" };
    }
}

export async function deleteTimetableSlot(slotId: number) {
    try {
        const allowed = await hasPermission("academic.timetable.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("hod");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to delete timetable slot" };
        await db.delete(timetableSlots).where(eq(timetableSlots.id, slotId));
        revalidatePath("/admin/academics/timetable");
        revalidatePath("/admin/academics/assignments");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete slot" };
    }
}

export async function getLevelTimetable(deptId: number, level: number, sessionId: number, semester: string) {
    try {
        const slotsRaw = await db.select({
            slot: timetableSlots,
            assignment: courseLecturers,
            course: courses,
            staff: staffProfiles,
            user: users
        })
            .from(timetableSlots)
            .innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
            .innerJoin(courses, eq(courseLecturers.courseId, courses.id))
            .innerJoin(staffProfiles, eq(courseLecturers.staffId, staffProfiles.id))
            .innerJoin(users, eq(staffProfiles.userId, users.id))
            .where(and(
                eq(timetableSlots.level, level),
                eq(courseLecturers.deptId, deptId),
                eq(courseLecturers.sessionId, sessionId),
                eq(courseLecturers.semester, semester as any)
            ));

        const submission = await db.select().from(timetableSubmissions).where(and(
            eq(timetableSubmissions.deptId, deptId),
            eq(timetableSubmissions.sessionId, sessionId),
            eq(timetableSubmissions.semester, semester as any),
            eq(timetableSubmissions.status, 'approved')
        ));

        if (submission.length === 0) {
            return []; // Hide if not approved
        }

        return slotsRaw.map(r => ({
            ...r.slot,
            assignment: {
                ...r.assignment,
                course: r.course,
                staff: { ...r.staff, user: r.user }
            }
        }));
    } catch (error) {
        console.error("Failed to fetch level timetable:", error);
        return [];
    }
}

export async function getStudentTimetable(studentId: number) {
    try {
        const sessionRows = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
        const currentSession = sessionRows[0] || null;

        if (!currentSession) return [];

        const studentEnrollments = await db.select().from(enrollments).where(and(
            eq(enrollments.studentId, studentId),
            eq(enrollments.academicYear, currentSession.name),
            eq(enrollments.semester, currentSession.currentSemester === '2' ? 2 : 1)
        ));

        const courseIds = studentEnrollments.map(e => e.courseId);
        if (courseIds.length === 0) return [];

        const slotsRaw = await db.select({
            slot: timetableSlots,
            assignment: courseLecturers,
            course: courses,
            staff: staffProfiles,
            user: users
        })
            .from(timetableSlots)
            .innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
            .innerJoin(courses, eq(courseLecturers.courseId, courses.id))
            .innerJoin(staffProfiles, eq(courseLecturers.staffId, staffProfiles.id))
            .innerJoin(users, eq(staffProfiles.userId, users.id))
            .where(and(
                eq(courseLecturers.sessionId, currentSession.id),
                eq(courseLecturers.semester, currentSession.currentSemester === '1' ? '1' : '2')
            ));

        const allSubmissions = await db.select().from(timetableSubmissions).where(and(
            eq(timetableSubmissions.sessionId, currentSession.id),
            eq(timetableSubmissions.semester, currentSession.currentSemester === '1' ? '1' : '2'),
            eq(timetableSubmissions.status, 'approved')
        ));
        const approvedDepts = new Set(allSubmissions.map(s => s.deptId));

        return slotsRaw.map(r => ({
            ...r.slot,
            assignment: {
                ...r.assignment,
                course: r.course,
                staff: { ...r.staff, user: r.user }
            }
        })).filter(s =>
            courseIds.includes(s.assignment.courseId) &&
            approvedDepts.has(s.assignment.deptId)
        );
    } catch (error) {
        console.error("Failed to fetch student timetable:", error);
        return [];
    }
}

export async function getDepartmentCourses(deptId: number) {
    try {
        const rows = await db.select({
            course: courses,
            settings: courseDepartmentSettings
        })
            .from(courseDepartmentSettings)
            .innerJoin(courses, eq(courseDepartmentSettings.courseId, courses.id))
            .where(eq(courseDepartmentSettings.deptId, deptId));

        return rows.map(r => ({
            ...r.course,
            settings: r.settings
        }));
    } catch (error) {
        console.error("Failed to fetch department courses:", error);
        return [];
    }
}

export async function getFacultySubmissions(facultyId: number) {
    try {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
        if (!session) return [];

        const depts = await db.select().from(departments).where(eq(departments.facultyId, facultyId));
        if (depts.length === 0) return [];

        const deptIds = depts.map(d => d.id);

        const rows = await db.select({
            submission: timetableSubmissions,
            department: departments,
            submittedBy: users
        })
            .from(timetableSubmissions)
            .innerJoin(departments, eq(timetableSubmissions.deptId, departments.id))
            .leftJoin(users, eq(timetableSubmissions.submittedById, users.id))
            .where(and(
                inArray(timetableSubmissions.deptId, deptIds),
                eq(timetableSubmissions.sessionId, session.id),
                eq(timetableSubmissions.semester, session.currentSemester === '1' ? '1' : '2')
            ));

        return rows;
    } catch (error) {
        console.error("Failed to fetch faculty submissions:", error);
        return [];
    }
}

export async function getFacultyDepartments(facultyId: number) {
    try {
        return await db.select({
            id: departments.id,
            name: departments.name,
            code: departments.code,
            unitId: departments.unitId
        })
            .from(departments)
            .where(eq(departments.facultyId, facultyId));
    } catch (error) {
        console.error("Failed to fetch faculty departments:", error);
        return [];
    }
}


