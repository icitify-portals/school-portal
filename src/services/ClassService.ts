import { db } from "@/db/db";
import { studentGroups, staffSubjectAssignments, courses, academicSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class ClassService {

    /**
     * Retrieves all student groups for a branch.
     */
    static async getStudentGroups(unitId: number) {
        return await db.select().from(studentGroups).where(eq(studentGroups.unitId, unitId));
    }

    /**
     * Retrieves subjects assigned to a specific group for a session.
     * Matches 'school_class.subjects' logic from Rust.
     */
    static async getGroupSubjects(groupId: number, sessionId: number) {
        const assignments = await db.select({
            subjectName: courses.name,
            subjectCode: courses.code
        })
        .from(staffSubjectAssignments)
        .innerJoin(courses, eq(staffSubjectAssignments.courseId, courses.id))
        .where(and(
            eq(staffSubjectAssignments.groupId, groupId),
            eq(staffSubjectAssignments.sessionId, sessionId)
        ));

        return assignments.map(a => `${a.subjectName} (${a.subjectCode})`);
    }

    /**
     * Generates a comprehensive report of classes and their subjects for a session.
     * Matches the batch reporting logic from Rust.
     */
    static async getBranchSubjectsReport(unitId: number, sessionId: number) {
        const groups = await this.getStudentGroups(unitId);
        const report = [];

        for (const group of groups) {
            const subjects = await this.getGroupSubjects(group.id, sessionId);
            if (subjects.length > 0) {
                report.push({
                    class: group.level.toString(),
                    class_division: group.name,
                    subjects
                });
            }
        }

        return report;
    }
}
