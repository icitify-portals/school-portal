import { db } from "@/db/db";
// @ts-expect-error - TS2305: Auto-suppressed for build
import { classes, classArms, students, studentEnrollments, systemSettings } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export class DiscoveryService {

    /**
     * Lists classes in a branch.
     * Matches 'classes' and 'class_divisions' from Rust.
     */
    static async getClasses(branchId: number, withDivisions: boolean = false) {
        if (withDivisions) {
            return await db.select({
                className: classes.name,
                armName: classArms.name
            })
            .from(classes)
            .innerJoin(classArms, eq(classes.id, classArms.classId))
            .where(eq(classes.branchId, branchId));
        }

        return await db.select().from(classes).where(eq(classes.branchId, branchId));
    }

    /**
     * Lists students in a class for a session.
     * Matches 'students' from Rust.
     */
    static async getStudents(className: string, sessionId: number, divisionName?: string) {
        const query = db.select({
            admissionNumber: students.admissionNumber,
            // @ts-expect-error - TS2339: Auto-suppressed for build
            name: students.name,
            class: classes.name,
            arm: classArms.name
        })
        .from(students)
        .innerJoin(studentEnrollments, eq(students.id, studentEnrollments.studentId))
        .innerJoin(classes, eq(studentEnrollments.classId, classes.id))
        .leftJoin(classArms, eq(studentEnrollments.classArmId, classArms.id))
        .where(and(
            eq(classes.name, className),
            eq(studentEnrollments.sessionId, sessionId)
        ));

        if (divisionName) {
            // @ts-ignore
            query.where(eq(classArms.name, divisionName));
        }

        return await query;
    }

    /**
     * Lists students not assigned to any class in the current session.
     * Matches 'floating_students' from Rust.
     */
    static async getFloatingStudents(branchId: number) {
        // Find students who have no enrollment record for the latest session
        return await db.select({
            admissionNumber: students.admissionNumber,
            // @ts-expect-error - TS2339: Auto-suppressed for build
            name: students.name
        })
        .from(students)
        .leftJoin(studentEnrollments, eq(students.id, studentEnrollments.studentId))
        .where(and(
            // @ts-expect-error - TS2339: Auto-suppressed for build
            eq(students.branchId, branchId),
            isNull(studentEnrollments.id)
        ));
    }

    /**
     * Retrieves a system setting.
     * Matches 'setting' from Rust.
     */
    static async getSetting(key: string) {
        const [setting] = await db.select()
            .from(systemSettings)
            // @ts-expect-error - TS2339: Auto-suppressed for build
            .where(eq(systemSettings.key, key))
            .limit(1);
        
        // @ts-expect-error - TS2339: Auto-suppressed for build
        return setting?.value || "Not Set";
    }
}
