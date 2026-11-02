"use server";

import { db } from "@/db/db";
import { students, users, departments, programmes, studentMedicalRecords } from "@/db/schema";
import { eq, and, like, or, sql, desc, notLike } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function ensureHealthAccess() {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");
    const user = await db.query.users.findFirst({
        where: eq(users.id, Number(session.user.id)),
        columns: { role: true }
    });
    if (!user || !["admin", "superadmin", "healthadmin", "ict_manager", "registrar", "medical_officer"].includes(user.role || "")) {
        throw new Error("Access denied. Medical Officer or Health Admin role required.");
    }
}

export async function getMedicalRecords(filters?: {
    departmentId?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) {
    try {
        await ensureHealthAccess();

        const limit = filters?.limit || 20;
        const page = filters?.page || 1;
        const offset = (page - 1) * limit;

        // Build base conditions: active students only, exclude retired duplicates
        const conditions: any[] = [
            sql`${students.deletedAt} IS NULL`,
            notLike(students.matricNumber, "%.retired.%")
        ];

        if (filters?.departmentId) {
            conditions.push(eq(students.deptId, filters.departmentId));
        }

        if (filters?.status === 'submitted') {
            conditions.push(sql`${students.medicalFormSubmittedAt} IS NOT NULL`);
        } else if (filters?.status === 'pending') {
            conditions.push(sql`${students.medicalFormSubmittedAt} IS NULL`);
        } else if (filters?.status === 'cleared') {
            conditions.push(eq(students.healthStatus, 'cleared'));
        }

        if (filters?.search) {
            const clean = filters.search.trim();
            const q = `%${clean}%`;
            conditions.push(
                or(
                    like(users.name, q),
                    like(students.firstName, q),
                    like(students.lastName, q),
                    like(students.matricNumber, q),
                    like(students.admissionNumber, q),
                    like(students.jambNumber, q)
                )
            );
        }

        const whereClause = and(...conditions);

        const rows = await db.select({
            studentId: students.id,
            studentName: users.name,
            firstName: students.firstName,
            lastName: students.lastName,
            otherNames: students.otherNames,
            matricNumber: students.matricNumber,
            admissionNumber: students.admissionNumber,
            jambNumber: students.jambNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            studyMode: students.studyMode,
            gender: students.gender,
            dob: students.dob,
            deptId: students.deptId,
            deptName: departments.name,
            programmeId: students.programmeId,
            programmeName: programmes.name,
            imageUrl: students.imageUrl,
            healthStatus: students.healthStatus,
            healthNotes: students.healthNotes,
            medicalFormSubmittedAt: students.medicalFormSubmittedAt,
            bloodGroup: students.bloodGroup,
            genotype: students.genotype,
            kinName: students.kinName,
            kinPhone: students.kinPhone,
            kinAddress: students.kinAddress,
            // Medical Record fields
            height: studentMedicalRecords.height,
            weight: studentMedicalRecords.weight,
            bloodPressure: studentMedicalRecords.bloodPressure,
            commonIllness: studentMedicalRecords.commonIllness,
            illnessFrequency: studentMedicalRecords.illnessFrequency,
            lastOccurrence: studentMedicalRecords.lastOccurrence,
            illnessDescription: studentMedicalRecords.illnessDescription,
            allergies: studentMedicalRecords.allergies,
            medicalHistory: studentMedicalRecords.medicalHistory,
            currentMedications: studentMedicalRecords.currentMedications,
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .leftJoin(programmes, eq(students.programmeId, programmes.id))
        .leftJoin(studentMedicalRecords, eq(studentMedicalRecords.studentId, students.id))
        .where(whereClause)
        .orderBy(desc(students.medicalFormSubmittedAt), users.name)
        .limit(limit)
        .offset(offset);

        // Get total count
        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(whereClause);

        return { success: true, data: rows, total: Number(count) };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [], total: 0 };
    }
}

export async function searchStudentMedicalByOfficer(query: string) {
    try {
        await ensureHealthAccess();
        const clean = query.trim();
        if (!clean) return { success: true, data: [] };

        const q = `%${clean}%`;
        const rows = await db.select({
            studentId: students.id,
            studentName: users.name,
            firstName: students.firstName,
            lastName: students.lastName,
            otherNames: students.otherNames,
            matricNumber: students.matricNumber,
            admissionNumber: students.admissionNumber,
            jambNumber: students.jambNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            studyMode: students.studyMode,
            gender: students.gender,
            dob: students.dob,
            deptId: students.deptId,
            deptName: departments.name,
            programmeId: students.programmeId,
            programmeName: programmes.name,
            imageUrl: students.imageUrl,
            healthStatus: students.healthStatus,
            healthNotes: students.healthNotes,
            medicalFormSubmittedAt: students.medicalFormSubmittedAt,
            bloodGroup: students.bloodGroup,
            genotype: students.genotype,
            kinName: students.kinName,
            kinPhone: students.kinPhone,
            kinAddress: students.kinAddress,
            // Medical Record fields
            height: studentMedicalRecords.height,
            weight: studentMedicalRecords.weight,
            bloodPressure: studentMedicalRecords.bloodPressure,
            commonIllness: studentMedicalRecords.commonIllness,
            illnessFrequency: studentMedicalRecords.illnessFrequency,
            lastOccurrence: studentMedicalRecords.lastOccurrence,
            illnessDescription: studentMedicalRecords.illnessDescription,
            allergies: studentMedicalRecords.allergies,
            medicalHistory: studentMedicalRecords.medicalHistory,
            currentMedications: studentMedicalRecords.currentMedications,
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .leftJoin(programmes, eq(students.programmeId, programmes.id))
        .leftJoin(studentMedicalRecords, eq(studentMedicalRecords.studentId, students.id))
        .where(
            and(
                sql`${students.deletedAt} IS NULL`,
                notLike(students.matricNumber, "%.retired.%"),
                or(
                    eq(students.matricNumber, clean),
                    eq(students.admissionNumber, clean),
                    eq(students.jambNumber, clean),
                    like(users.name, q),
                    like(students.firstName, q),
                    like(students.lastName, q),
                    like(students.matricNumber, q),
                    like(students.admissionNumber, q)
                )
            )
        )
        .orderBy(desc(students.medicalFormSubmittedAt), users.name)
        .limit(10);

        return { success: true, data: rows };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [] };
    }
}

export async function updateStudentMedicalByOfficer(data: {
    studentId: number;
    height: string;
    weight: string;
    bloodPressure: string;
    bloodGroup?: string;
    genotype?: string;
    healthStatus?: 'cleared' | 'flagged' | 'pending';
    healthNotes?: string;
    commonIllness?: string;
    illnessFrequency?: string;
    lastOccurrence?: string;
    illnessDescription?: string;
    allergies?: string;
    medicalHistory?: string;
    currentMedications?: string;
    kinName?: string;
    kinPhone?: string;
    kinAddress?: string;
}) {
    try {
        await ensureHealthAccess();

        const studentId = Number(data.studentId);
        if (!studentId || isNaN(studentId)) {
            return { success: false, error: "Invalid student identifier provided." };
        }

        const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
        if (!student) {
            return { success: false, error: "Student record not found in system." };
        }

        // 1. Update students table
        const studentUpdates: Record<string, any> = {
            healthStatus: data.healthStatus || 'cleared',
            healthNotes: data.healthNotes !== undefined ? data.healthNotes.trim() : student.healthNotes,
            medicalFormSubmittedAt: student.medicalFormSubmittedAt || new Date(),
        };

        if (data.bloodGroup) studentUpdates.bloodGroup = data.bloodGroup.trim();
        if (data.genotype) studentUpdates.genotype = data.genotype.trim();
        if (data.kinName) studentUpdates.kinName = data.kinName.trim();
        if (data.kinPhone) studentUpdates.kinPhone = data.kinPhone.trim();
        if (data.kinAddress) studentUpdates.kinAddress = data.kinAddress.trim();

        await db.update(students).set(studentUpdates).where(eq(students.id, studentId));

        // 2. Upsert student_medical_records
        const [existingMedical] = await db.select()
            .from(studentMedicalRecords)
            .where(eq(studentMedicalRecords.studentId, studentId))
            .limit(1);

        const medicalPayload: Record<string, any> = {
            height: data.height ? data.height.trim() : (existingMedical?.height || "Pending Clinic Measurement"),
            weight: data.weight ? data.weight.trim() : (existingMedical?.weight || "Pending Clinic Measurement"),
            bloodPressure: data.bloodPressure ? data.bloodPressure.trim() : (existingMedical?.bloodPressure || "Pending Clinic Measurement"),
        };

        if (data.commonIllness !== undefined) medicalPayload.commonIllness = data.commonIllness.trim();
        if (data.illnessFrequency !== undefined) medicalPayload.illnessFrequency = data.illnessFrequency.trim();
        if (data.lastOccurrence !== undefined) medicalPayload.lastOccurrence = data.lastOccurrence.trim();
        if (data.illnessDescription !== undefined) medicalPayload.illnessDescription = data.illnessDescription.trim();
        if (data.allergies !== undefined) medicalPayload.allergies = data.allergies.trim();
        if (data.medicalHistory !== undefined) medicalPayload.medicalHistory = data.medicalHistory.trim();
        if (data.currentMedications !== undefined) medicalPayload.currentMedications = data.currentMedications.trim();

        if (existingMedical) {
            await db.update(studentMedicalRecords).set(medicalPayload).where(eq(studentMedicalRecords.id, existingMedical.id));
        } else {
            await db.insert(studentMedicalRecords).values({
                studentId,
                ...medicalPayload,
            });
        }

        revalidatePath("/admin/health/medical-records");
        revalidatePath(`/admin/students/${studentId}/medical`);
        revalidatePath("/student/medical");

        return {
            success: true,
            message: "Student clinical measurements and health records updated successfully."
        };
    } catch (error: any) {
        console.error("Error updating student medical record by officer:", error);
        return { success: false, error: error.message || "Failed to update medical record." };
    }
}

export async function getMedicalRecordStats() {
    try {
        await ensureHealthAccess();

        const [stats] = await db.select({
            total: sql<number>`count(*)`,
            submitted: sql<number>`sum(${students.medicalFormSubmittedAt} IS NOT NULL)`,
            cleared: sql<number>`sum(${students.healthStatus} = 'cleared')`,
            pending: sql<number>`sum(${students.healthStatus} = 'pending')`,
        })
        .from(students)
        .where(
            and(
                sql`${students.deletedAt} IS NULL`,
                notLike(students.matricNumber, "%.retired.%")
            )
        );

        return { success: true, data: stats };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
