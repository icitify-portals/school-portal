"use server";

import { ResultWorkflowService } from "@/services/ResultWorkflowService";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";
import { db } from "@/db/db";
import { semesterSummaries, resultComplaints, students, users, faculties, departments, courses } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function approveDepartmentResultsAction(deptId: number, sessionId: number, semester: '1' | '2') {
    try {
        const isHod = await hasPermission("academic.results.approve") || await hasRole("hod") || await hasRole("superadmin");
        if (!isHod) throw new Error("Unauthorized: HOD access required");
        
        // Use a placeholder for the current user ID
        const userId = 1; 

        await ResultWorkflowService.approveDepartmentResults(deptId, sessionId, semester, userId);
        revalidatePath("/admin/academic/results/approval");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function approveFacultyResultsAction(facultyId: number, sessionId: number, semester: '1' | '2') {
    try {
        const isDean = await hasPermission("academic.results.approve") || await hasRole("dean") || await hasRole("superadmin");
        if (!isDean) throw new Error("Unauthorized: Dean access required");
        
        const userId = 1; 

        await ResultWorkflowService.approveFacultyResults(facultyId, sessionId, semester, userId);
        revalidatePath("/admin/academic/results/approval");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getApprovalStats(sessionId: number, semester: '1' | '2') {
    try {
        const stats = await db.select({
            status: semesterSummaries.approvalStatus,
            count: sql<number>`count(*)`
        })
        .from(semesterSummaries)
        .where(and(
            eq(semesterSummaries.sessionId, sessionId),
            eq(semesterSummaries.semester, semester)
        ))
        .groupBy(semesterSummaries.approvalStatus);

        return { success: true, data: stats };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function submitResultComplaintAction(data: any) {
    try {
        await ResultWorkflowService.submitComplaint(data);
        revalidatePath("/student/results/complaints");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getResultComplaintsAction() {
    try {
        const complaints = await db.select({
            id: resultComplaints.id,
            studentName: users.name,
            courseName: courses.name,
            subject: resultComplaints.subject,
            message: resultComplaints.message,
            status: resultComplaints.status,
            createdAt: resultComplaints.createdAt
        })
        .from(resultComplaints)
        .innerJoin(students, eq(resultComplaints.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .innerJoin(courses, eq(resultComplaints.courseId, courses.id))
        .orderBy(sql`${resultComplaints.createdAt} DESC`);

        return { success: true, data: complaints };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
