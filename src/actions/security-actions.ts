"use server";

import { AuthService } from "@/services/AuthService";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";

export async function generateOTPAction() {
    try {
        const userId = 1; // Current User Placeholder
        const result = await AuthService.generateOTP(userId);
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function verifyOTPAction(otpId: string, otpCode: string) {
    try {
        const result = await AuthService.verifyOTP(otpId, otpCode);
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function registerAsTeacherAction(userId: number, departmentId?: number, otpData?: { id: string, code: string }) {
    try {
        const isSuperAdmin = await hasRole("superadmin");
        const isItAdmin = await hasRole("it_admin");

        if (!isSuperAdmin && !isItAdmin) {
            throw new Error("Unauthorized: Role promotion requires IT Admin or Super Admin clearance.");
        }

        // 1. Enforcement: Super Admin skips OTP, others MUST provide it
        if (!isSuperAdmin) {
            if (!otpData) throw new Error("Security verification required: Please generate and provide a 7-digit OTP.");
            await AuthService.verifyOTP(otpData.id, otpData.code);
        }

        const result = await AuthService.registerAsTeacher(userId, departmentId);
        revalidatePath("/admin/users");
        return { success: true, ...result, bypassed: isSuperAdmin };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function registerAsStudentAction(userId: number, admissionNumber?: string, otpData?: { id: string, code: string }) {
    try {
        const isSuperAdmin = await hasRole("superadmin");
        const isItAdmin = await hasRole("it_admin");

        if (!isSuperAdmin && !isItAdmin) {
            throw new Error("Unauthorized");
        }

        // 1. Enforcement: Super Admin skips OTP
        if (!isSuperAdmin) {
            if (!otpData) throw new Error("Security verification required: Please generate and provide a 7-digit OTP.");
            await AuthService.verifyOTP(otpData.id, otpData.code);
        }

        const result = await AuthService.registerAsStudent(userId, admissionNumber);
        revalidatePath("/admin/users");
        return { success: true, ...result, bypassed: isSuperAdmin };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
