import { db } from "@/db/db";
import { semesterSummaries, resultComplaints, students, users, departments, faculties } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export class ResultWorkflowService {

    /**
     * HOD Approves all results for a specific department.
     */
    static async approveDepartmentResults(deptId: number, sessionId: number, semester: '1' | '2', approverId: number) {
        // Find all students in this department
        const studentIds = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.deptId, deptId));

        const ids = studentIds.map(s => s.id);
        if (ids.length === 0) return { success: true };

        return await db.update(semesterSummaries)
            .set({
                approvalStatus: 'hod_approved',
                hodApprovedBy: approverId,
                hodApprovedAt: new Date()
            })
            .where(and(
                inArray(semesterSummaries.studentId, ids),
                eq(semesterSummaries.sessionId, sessionId),
                eq(semesterSummaries.semester, semester),
                eq(semesterSummaries.approvalStatus, 'pending')
            ));
    }

    /**
     * Dean Approves all results for a specific faculty.
     */
    static async approveFacultyResults(facultyId: number, sessionId: number, semester: '1' | '2', approverId: number) {
        // Find all students in this faculty
        const studentIds = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.facultyId, facultyId));

        const ids = studentIds.map(s => s.id);
        if (ids.length === 0) return { success: true };

        return await db.update(semesterSummaries)
            .set({
                approvalStatus: 'dean_approved',
                deanApprovedBy: approverId,
                deanApprovedAt: new Date()
            })
            .where(and(
                inArray(semesterSummaries.studentId, ids),
                eq(semesterSummaries.sessionId, sessionId),
                eq(semesterSummaries.semester, semester),
                eq(semesterSummaries.approvalStatus, 'hod_approved')
            ));
    }

    /**
     * Final Publication: Makes results visible to students.
     */
    static async publishResults(sessionId: number, semester: '1' | '2') {
        return await db.update(semesterSummaries)
            .set({ approvalStatus: 'published' })
            .where(and(
                eq(semesterSummaries.sessionId, sessionId),
                eq(semesterSummaries.semester, semester),
                eq(semesterSummaries.approvalStatus, 'dean_approved')
            ));
    }

    /**
     * Student submits a result complaint.
     */
    static async submitComplaint(data: {
        studentId: number,
        courseId: number,
        sessionId: number,
        semester: '1' | '2',
        subject: string,
        message: string
    }) {
        return await db.insert(resultComplaints).values({
            studentId: data.studentId,
            courseId: data.courseId,
            sessionId: data.sessionId,
            semester: data.semester,
            subject: data.subject,
            message: data.message,
            status: 'pending'
        });
    }

    /**
     * Admin resolves a complaint.
     */
    static async resolveComplaint(complaintId: number, response: string, handlerId: number) {
        return await db.update(resultComplaints)
            .set({
                response,
                status: 'resolved',
                handledBy: handlerId,
                updatedAt: new Date()
            })
            .where(eq(resultComplaints.id, complaintId));
    }
}
