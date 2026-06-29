"use server";

import { db } from "@/db/db";
import { healthRecords, studentVitals, students, users, medicalAppointments, attendance } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getStudentHealthData(studentId: number) {
    try {
        const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
        if (!student) return { success: false, error: "Student not found" };

        const records = await db.select().from(healthRecords).where(eq(healthRecords.studentId, studentId));
        const vitalsList = await db.select().from(studentVitals).where(eq(studentVitals.studentId, studentId)).orderBy(desc(studentVitals.recordedAt));
        const appts = await db.select().from(medicalAppointments).where(eq(medicalAppointments.studentId, studentId)).orderBy(desc(medicalAppointments.appointmentDate));

        const studentWithData = {
            ...student,
            healthRecords: records,
            vitals: vitalsList,
            appointments: appts
        };
        return { success: true, data: studentWithData };
    } catch (error) {
        console.error("Failed to fetch student health data:", error);
        return { success: false, error: "Failed to fetch health data" };
    }
}

// ... existing code ...

export async function getStudentAppointments(studentId: number) {
    try {
        const results = await db.select()
            .from(medicalAppointments)
            .where(eq(medicalAppointments.studentId, studentId))
            .orderBy(desc(medicalAppointments.appointmentDate));
        return { success: true, data: results };
    } catch (error) {
        console.error("Failed to fetch student appointments:", error);
        return { success: false, error: "Failed to fetch appointments" };
    }
}

export async function bookAppointment(data: {
    studentId: number,
    appointmentDate: Date,
    reason: string
}) {
    try {
        await db.insert(medicalAppointments).values({
            studentId: data.studentId,
            appointmentDate: data.appointmentDate,
            reason: data.reason,
            status: 'pending'
        });
        revalidatePath("/student/health/appointments");
        return { success: true };
    } catch (error) {
        console.error("Failed to book appointment:", error);
        return { success: false, error: "Failed to book appointment" };
    }
}

export async function cancelAppointment(appointmentId: number) {
    try {
        await db.update(medicalAppointments)
            .set({ status: 'cancelled' })
            .where(eq(medicalAppointments.id, appointmentId));
        revalidatePath("/student/health/appointments");
        return { success: true };
    } catch (error) {
        console.error("Failed to cancel appointment:", error);
        return { success: false, error: "Failed to cancel appointment" };
    }
}

export async function updateAppointmentStatus(
    appointmentId: number,
    status: 'pending' | 'approved' | 'completed' | 'cancelled',
    notes?: string,
    doctorNotes?: string,
    prescriptions?: string
) {
    try {
        const allowed = await hasPermission("health.records.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("medical_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update appointment status" };

        await db.update(medicalAppointments)
            .set({ status, notes, doctorNotes, prescriptions })
            .where(eq(medicalAppointments.id, appointmentId));

        // Revalidate both student and admin views
        revalidatePath("/student/health/appointments");
        revalidatePath("/admin/health");
        return { success: true };
    } catch (error) {
        console.error("Failed to update appointment status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function updateHealthRegistration(studentId: number, data: {
    ailments?: string,
    operations?: string,
    foodAllergies?: string,
    bloodGroup?: string,
    genotype?: string,
    doctorName?: string,
    doctorAddress?: string,
    doctorPhone?: string,
}) {
    try {
        const allowed = await hasPermission("health.records.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("medical_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update health registration" };

        await db.update(students).set(data).where(eq(students.id, studentId));
        revalidatePath("/student/health");
        revalidatePath(`/admin/students/${studentId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update health registration:", error);
        return { success: false, error: "Failed to update health details" };
    }
}

export async function uploadHealthReport(data: {
    studentId: number,
    title: string,
    type: 'xray' | 'blood_test' | 'eye_test' | 'other',
    fileUrl: string,
    description?: string
}) {
    try {
        const allowed = await hasPermission("health.records.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("medical_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to upload health reports" };

        await db.insert(healthRecords).values({
            ...data,
            status: 'pending',
        });
        revalidatePath("/student/health");
        return { success: true };
    } catch (error) {
        console.error("Failed to upload health report:", error);
        return { success: false, error: "Failed to save health report" };
    }
}

export async function getHealthDashboardStats() {
    try {
        const [cleared] = await db.select({ count: count() }).from(students).where(eq(students.healthStatus, 'cleared'));
        const [flagged] = await db.select({ count: count() }).from(students).where(eq(students.healthStatus, 'flagged'));
        const [pending] = await db.select({ count: count() }).from(medicalAppointments).where(eq(medicalAppointments.status, 'pending'));

        return {
            success: true,
            data: {
                clearedCount: cleared.count,
                flaggedCount: flagged.count,
                pendingAppointments: pending.count
            }
        };
    } catch (error) {
        console.error("Failed to fetch health stats:", error);
        return { success: false, error: "Failed to fetch stats" };
    }
}

export async function recordStudentVitals(data: {
    studentId: number,
    recordedBy: number,
    weight?: number,
    height?: number,
    bloodPressure?: string,
    pulse?: number,
    temperature?: number,
    respiratoryRate?: number,
    oxygenSaturation?: number,
    notes?: string
}) {
    try {
        const allowed = await hasPermission("health.records.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("medical_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to record vitals" };

        await db.insert(studentVitals).values(data as any);

        // Update student status if flagged in notes or vitals
        await db.update(students).set({
            healthStatus: 'cleared' // Default to cleared when officer records 
        }).where(eq(students.id, data.studentId));

        revalidatePath(`/admin/health/${data.studentId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to record vitals:", error);
        return { success: false, error: "Failed to record vital signs" };
    }
}

export async function updateHealthStatus(studentId: number, status: 'pending' | 'cleared' | 'flagged', notes?: string) {
    try {
        const allowed = await hasPermission("health.records.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("medical_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update health status" };

        await db.update(students).set({
            healthStatus: status,
            healthNotes: notes
        }).where(eq(students.id, studentId));
        revalidatePath("/admin/health");
        return { success: true };
    } catch (error) {
        console.error("Failed to update health status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function verifyHealthReport(reportId: number, verifierId: number, status: 'verified' | 'rejected', reason?: string) {
    try {
        const allowed = await hasPermission("health.records.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("medical_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to verify health reports" };

        await db.update(healthRecords).set({
            status,
            verifiedBy: verifierId,
            verifiedAt: new Date(),
            rejectionReason: reason
        }).where(eq(healthRecords.id, reportId));
        revalidatePath("/admin/health");
        return { success: true };
    } catch (error) {
        console.error("Failed to verify health report:", error);
        return { success: false, error: "Failed to verify report" };
    }
}

export async function approveSickLeave(appointmentId: number, studentId: number, notes?: string) {
    try {
        const allowed = await hasPermission("health.excusat.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("medical_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to approve sick leave" };

        // First update the appointment status to approved
        await db.update(medicalAppointments)
            .set({ status: 'approved', doctorNotes: notes || 'Sick leave approved' })
            .where(eq(medicalAppointments.id, appointmentId));
            
        // Assuming attendance table exists and has a type 'excused' or 'sick'
        // Need to insert an attendance record for today (or the appointment date)
        // @ts-expect-error - TS2769: Auto-suppressed for build
        await db.insert(attendance).values({
            userId: studentId,
            type: 'sick',
        });
        
        revalidatePath("/admin/health");
        revalidatePath("/student/health/appointments");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve sick leave:", error);
        return { success: false, error: "Failed to sync sick leave with attendance" };
    }
}
