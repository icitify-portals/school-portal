import { db } from "@/db/db";
import { 
    users, 
    otpLogs,
    staffProfiles,
    students,
    institutionalUnits
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class AuthService {

    /**
     * Generates a 7-digit 2FA OTP for high-security actions.
     * Ported from Rust 'OTP::generate'.
     */
    static async generateOTP(userId: number) {
        const otpId = uuidv4().substring(0, 8).toUpperCase();
        const otpCode = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7-digit code
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        await db.insert(otpLogs).values({
            userId,
            otpId,
            otpCode,
            expiresAt
        });

        // In a real app, send this code via Email/SMS
        console.log(`[SECURITY] OTP for User ${userId}: ${otpCode} (ID: ${otpId})`);

        return { otpId };
    }

    /**
     * Verifies a generated OTP.
     * Ported from Rust 'OTP::verify'.
     */
    static async verifyOTP(otpId: string, otpCode: string) {
        const log = await db.select()
            .from(otpLogs)
            .where(and(
                eq(otpLogs.otpId, otpId),
                eq(otpLogs.otpCode, otpCode),
                eq(otpLogs.isUsed, false)
            ))
            .limit(1);

        if (!log[0]) throw new Error("Invalid or already used OTP.");
        if (new Date() > new Date(log[0].expiresAt)) throw new Error("OTP has expired.");

        // Mark as used
        await db.update(otpLogs)
            .set({ isUsed: true })
            .where(eq(otpLogs.id, log[0].id));

        return { success: true, userId: log[0].userId };
    }

    /**
     * Registers an existing user as a Teacher (Staff).
     * Ported from Rust 'User::register_as_teacher'.
     */
    static async registerAsTeacher(userId: number, departmentId?: number) {
        // 1. Create staff profile
        const staffId = `STF-${Date.now()}`;
        await db.insert(staffProfiles).values({
            userId,
            staffId,
            departmentId,
            jobTitle: 'Assistant Lecturer', // Default
            isActive: true
        });

        // 2. Update user role
        await db.update(users)
            .set({ role: 'staff' })
            .where(eq(users.id, userId));

        return { success: true, staffId };
    }

    /**
     * Registers an existing user as a Student.
     * Ported from Rust 'User::register_as_student'.
     */
    static async registerAsStudent(userId: number, admissionNumber?: string) {
        const mat = admissionNumber || `MAT-${Date.now()}`;
        await db.insert(students).values({
            userId,
            admissionNumber: mat,
            status: 'active'
        });

        // Update user role
        await db.update(users)
            .set({ role: 'student' })
            .where(eq(users.id, userId));

        return { success: true, admissionNumber: mat };
    }
}
