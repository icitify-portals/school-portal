"use server";

import { db } from "@/db/db";
import { 
    students, 
    users, 
    programmes, 
    departments, 
    academicSessions, 
    studentMedicalRecords, 
    matriculationRegister 
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";

export async function getStudentDossierData(targetStudentId?: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const currentUserId = parseInt(session.user.id);
        const currentUserRole = (session.user as any)?.role || "student";

        let studentId = targetStudentId;

        // If no target ID provided or user is student, resolve student's own ID
        if (!studentId || currentUserRole === "student") {
            const studentRecord = await db.query.students.findFirst({
                where: eq(students.userId, currentUserId),
                columns: { id: true },
            });
            if (!studentRecord) {
                return { success: false, error: "Student record not found" };
            }
            // If student tries to query someone else, override to their own ID
            if (currentUserRole === "student" || !studentId) {
                studentId = studentRecord.id;
            }
        }

        const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
        if (!student) {
            return { success: false, error: "Student not found" };
        }

        const [user] = student.userId 
            ? await db.select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                role: users.role,
                image: users.image,
                status: users.status,
            }).from(users).where(eq(users.id, student.userId)).limit(1)
            : [null];

        const [programme] = student.programmeId
            ? await db.select().from(programmes).where(eq(programmes.id, student.programmeId)).limit(1)
            : [null];

        const deptId = student.deptId || programme?.departmentId;
        const [department] = deptId
            ? await db.select().from(departments).where(eq(departments.id, deptId)).limit(1)
            : [null];

        const [currentSession] = student.currentSessionId
            ? await db.select().from(academicSessions).where(eq(academicSessions.id, student.currentSessionId)).limit(1)
            : await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        const [admissionSession] = student.admissionSessionId
            ? await db.select().from(academicSessions).where(eq(academicSessions.id, student.admissionSessionId)).limit(1)
            : [null];

        const [medicalRecord] = await db.select()
            .from(studentMedicalRecords)
            .where(eq(studentMedicalRecords.studentId, student.id))
            .limit(1);

        const [matricRecord] = await db.select()
            .from(matriculationRegister)
            .where(eq(matriculationRegister.studentId, student.id))
            .orderBy(desc(matriculationRegister.signedAt))
            .limit(1);

        return {
            success: true,
            data: {
                student,
                user,
                programme,
                department,
                currentSession,
                admissionSession,
                medicalRecord: medicalRecord || null,
                matricRecord: matricRecord || null,
            }
        };
    } catch (e: any) {
        console.error("Error fetching student dossier data:", e);
        return { success: false, error: e.message || "Failed to load student dossier" };
    }
}

export async function getStudentMatriculationOathData(targetStudentId?: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const currentUserId = parseInt(session.user.id);
        const currentUserRole = (session.user as any)?.role || "student";

        let studentId = targetStudentId;
        if (!studentId || currentUserRole === "student") {
            const studentRecord = await db.query.students.findFirst({
                where: eq(students.userId, currentUserId),
                columns: { id: true },
            });
            if (!studentRecord) return { success: false, error: "Student record not found" };
            if (currentUserRole === "student" || !studentId) {
                studentId = studentRecord.id;
            }
        }

        const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
        if (!student) return { success: false, error: "Student not found" };

        const [user] = student.userId 
            ? await db.select().from(users).where(eq(users.id, student.userId)).limit(1)
            : [null];

        const [programme] = student.programmeId
            ? await db.select().from(programmes).where(eq(programmes.id, student.programmeId)).limit(1)
            : [null];

        const deptId = student.deptId || programme?.departmentId;
        const [department] = deptId
            ? await db.select().from(departments).where(eq(departments.id, deptId)).limit(1)
            : [null];

        const [academicSession] = student.currentSessionId
            ? await db.select().from(academicSessions).where(eq(academicSessions.id, student.currentSessionId)).limit(1)
            : await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        const [matricRecord] = await db.select()
            .from(matriculationRegister)
            .where(eq(matriculationRegister.studentId, student.id))
            .orderBy(desc(matriculationRegister.signedAt))
            .limit(1);

        return {
            success: true,
            data: {
                student,
                user,
                programme,
                department,
                session: academicSession,
                matricRecord: matricRecord || null,
            }
        };
    } catch (e: any) {
        console.error("Error fetching matriculation oath data:", e);
        return { success: false, error: e.message || "Failed to load oath data" };
    }
}

export async function getStudentMedicalFormData(targetStudentId?: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const currentUserId = parseInt(session.user.id);
        const currentUserRole = (session.user as any)?.role || "student";

        let studentId = targetStudentId;
        if (!studentId || currentUserRole === "student") {
            const studentRecord = await db.query.students.findFirst({
                where: eq(students.userId, currentUserId),
                columns: { id: true },
            });
            if (!studentRecord) return { success: false, error: "Student record not found" };
            if (currentUserRole === "student" || !studentId) {
                studentId = studentRecord.id;
            }
        }

        const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
        if (!student) return { success: false, error: "Student not found" };

        const [user] = student.userId 
            ? await db.select().from(users).where(eq(users.id, student.userId)).limit(1)
            : [null];

        const [programme] = student.programmeId
            ? await db.select().from(programmes).where(eq(programmes.id, student.programmeId)).limit(1)
            : [null];

        const deptId = student.deptId || programme?.departmentId;
        const [department] = deptId
            ? await db.select().from(departments).where(eq(departments.id, deptId)).limit(1)
            : [null];

        const [academicSession] = student.currentSessionId
            ? await db.select().from(academicSessions).where(eq(academicSessions.id, student.currentSessionId)).limit(1)
            : await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        const [medicalRecord] = await db.select()
            .from(studentMedicalRecords)
            .where(eq(studentMedicalRecords.studentId, student.id))
            .limit(1);

        return {
            success: true,
            data: {
                student,
                user,
                programme,
                department,
                session: academicSession,
                medicalRecord: medicalRecord || null,
            }
        };
    } catch (e: any) {
        console.error("Error fetching medical form data:", e);
        return { success: false, error: e.message || "Failed to load medical form data" };
    }
}
