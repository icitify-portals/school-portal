import { db } from "@/db/db";
import { privileges, studentPrivileges, students, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class StudentPrivilegeService {
    
    /**
     * Lists all defined privileges in the system.
     * Matches 'Privilege::list()' from Rust.
     */
    static async listPrivileges() {
        return await db.select().from(privileges).where(eq(privileges.isActive, true));
    }

    /**
     * Grants a privilege to a student.
     */
    static async grantPrivilege(studentId: number, privilegeId: number, grantedBy: number, expiresAt?: Date) {
        return await db.insert(studentPrivileges).values({
            studentId,
            privilegeId,
            grantedBy,
            expiresAt
        });
    }

    /**
     * Revokes a privilege from a student.
     */
    static async revokePrivilege(studentId: number, privilegeId: number) {
        return await db.delete(studentPrivileges)
            .where(and(
                eq(studentPrivileges.studentId, studentId),
                eq(studentPrivileges.privilegeId, privilegeId)
            ));
    }

    /**
     * Checks if a student has a specific privilege.
     */
    static async hasPrivilege(studentId: number, privilegeName: string): Promise<boolean> {
        const [priv] = await db.select({ id: privileges.id })
            .from(privileges)
            .where(eq(privileges.name, privilegeName))
            .limit(1);

        if (!priv) return false;

        const [entry] = await db.select()
            .from(studentPrivileges)
            .where(and(
                eq(studentPrivileges.studentId, studentId),
                eq(studentPrivileges.privilegeId, priv.id)
            ))
            .limit(1);

        return !!entry;
    }

    /**
     * Batch grants a privilege to multiple students.
     * Matches 'UpdateMany' logic from Rust.
     */
    static async batchGrantPrivilege(studentIds: number[], privilegeId: number, grantedBy: number, expiresAt?: Date) {
        const values = studentIds.map(id => ({
            studentId: id,
            privilegeId,
            grantedBy,
            expiresAt
        }));

        return await db.insert(studentPrivileges).values(values);
    }

    /**
     * Retrieves detailed privilege status data for a cohort of students.
     * Matches 'school.students_with_serial_numbers' and 'Privilege::status_data' from Rust.
     */
    static async getDetailedCohortPrivilegeStatus(privilegeName: string, sessionId: number, branchId?: number) {
        const [priv] = await db.select({ id: privileges.id })
            .from(privileges)
            .where(eq(privileges.name, privilegeName))
            .limit(1);

        if (!priv) throw new Error(`Privilege ${privilegeName} not found`);

        const statusData = await db.select({
            admissionNumber: students.admissionNumber,
            name: users.name,
            grantedAt: studentPrivileges.grantedAt,
            expiresAt: studentPrivileges.expiresAt,
            grantedBy: users.name // Need to join for grantor name
        })
        .from(studentPrivileges)
        .innerJoin(students, eq(studentPrivileges.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .where(and(
            eq(studentPrivileges.privilegeId, priv.id),
            branchId ? eq(students.unitId, branchId) : undefined as any
            // session filtering can be added via students table or enrollments
        ));

        return statusData;
    }

    /**
     * Batch revokes a privilege from multiple students.
     * Matches 'UpdateMany' (value=0) logic from Rust.
     */
    static async batchRevokePrivilege(studentIds: number[], privilegeId: number) {
        return await db.delete(studentPrivileges)
            .where(and(
                eq(studentPrivileges.privilegeId, privilegeId),
                sql`${studentPrivileges.studentId} IN (${studentIds.join(',')})`
            ));
    }
}
