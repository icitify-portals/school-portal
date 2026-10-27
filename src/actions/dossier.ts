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
import { revalidatePath } from "next/cache";

export async function saveStudentDossierAction(formData: {
    firstName: string;
    lastName: string;
    otherNames?: string;
    gender: string;
    dob: string;
    phone: string;
    email: string;
    nin: string;
    jambNumber: string;
    stateOfOrigin: string;
    lga: string;
    guardianName: string;
    guardianOccupation: string;
    guardianPhone: string;
    guardianAddress: string;
    kinName: string;
    kinPhone: string;
    kinAddress: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const requiredChecks: { key: keyof typeof formData; label: string }[] = [
            { key: "firstName", label: "First Name" },
            { key: "lastName", label: "Surname / Last Name" },
            { key: "gender", label: "Gender" },
            { key: "dob", label: "Date of Birth" },
            { key: "phone", label: "Phone Number" },
            { key: "email", label: "Email Address" },
            { key: "nin", label: "National Identification Number (NIN)" },
            { key: "jambNumber", label: "JAMB / Admission Number" },
            { key: "stateOfOrigin", label: "State of Origin" },
            { key: "lga", label: "Local Government Area (LGA)" },
            { key: "guardianName", label: "Parent / Guardian Full Name" },
            { key: "guardianOccupation", label: "Guardian Occupation" },
            { key: "guardianPhone", label: "Guardian Phone Number" },
            { key: "guardianAddress", label: "Guardian Residential Address" },
            { key: "kinName", label: "Next of Kin Full Name" },
            { key: "kinPhone", label: "Next of Kin Phone Number" },
            { key: "kinAddress", label: "Next of Kin Address" },
        ];

        for (const item of requiredChecks) {
            const val = String(formData[item.key] ?? "").trim();
            if (!val) {
                return {
                    success: false,
                    error: `All dossier fields must be filled before submission. Missing: ${item.label}.`,
                };
            }
        }

        const userId = parseInt(session.user.id);
        const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
        if (!student) {
            return { success: false, error: "Student record not found." };
        }

        await db.update(students).set({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            otherNames: formData.otherNames?.trim() || null,
            gender: formData.gender.trim() as any,
            dob: formData.dob.trim(),
            phone: formData.phone.trim(),
            nin: formData.nin.trim(),
            jambNumber: formData.jambNumber.trim(),
            stateOfOrigin: formData.stateOfOrigin.trim(),
            lga: formData.lga.trim(),
            guardianName: formData.guardianName.trim(),
            guardianOccupation: formData.guardianOccupation.trim(),
            guardianPhone: formData.guardianPhone.trim(),
            guardianAddress: formData.guardianAddress.trim(),
            kinName: formData.kinName.trim(),
            kinPhone: formData.kinPhone.trim(),
            kinAddress: formData.kinAddress.trim(),
            profileCompleted: true,
        }).where(eq(students.id, student.id));

        await db.update(users).set({
            firstName: formData.firstName.trim(),
            surname: formData.lastName.trim(),
            name: `${formData.lastName.trim()} ${formData.firstName.trim()} ${formData.otherNames?.trim() || ""}`.replace(/\s+/g, " ").trim(),
            phone: formData.phone.trim(),
        }).where(eq(users.id, userId));

        revalidatePath("/student/dossier");
        revalidatePath("/profile");
        revalidatePath("/student");
        return { success: true, message: "Student Dossier updated successfully." };
    } catch (e: any) {
        console.error("saveStudentDossierAction error:", e);
        return { success: false, error: e.message || "Failed to update student dossier." };
    }
}

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
