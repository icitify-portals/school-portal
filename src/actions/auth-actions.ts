"use server";

import { db } from "@/db/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { NotificationService } from "@/services/NotificationService";
import { sendEmail } from "@/lib/mail";
import { auth } from "@/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function getAuthUser() {
    try {
        const session = await auth();
        return session?.user || null;
    } catch (e) {
        return null;
    }
}

export async function forgotPassword(email: string) {
    try {
        const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
        if (!user) {
            // For security, don't reveal if user exists
            return { success: true, message: "If an account with that email exists, we have sent a reset link." };
        }

        // Generate token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

        // Clear existing tokens for this user
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

        // Save new token
        await db.insert(passwordResetTokens).values({
            userId: user.id,
            token,
            expiresAt
        });

        // Send Email
        const resetLink = `${APP_URL}/reset-password?token=${token}`;
        
        await sendEmail(
            user.email,
            "Password Reset Request",
            `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; border-top: 4px solid #4f46e5;">
                <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Password Reset</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello ${user.name},</p>
                <p style="color: #475569; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to proceed:</p>
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 16px;">Reset My Password</a>
                </div>
                <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="color: #94a3b8; font-size: 12px;">FSS Portal Identity Services</p>
            </div>`
        );

        return { success: true, message: "If an account with that email exists, we have sent a reset link." };
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return { success: false, error: "An unexpected error occurred. Please try again later." };
    }
}

export async function resetPasswordWithToken(token: string, password: string) {
    try {
        // Find valid token
        const [tokenRecord] = await db.select()
            .from(passwordResetTokens)
            .where(and(
                eq(passwordResetTokens.token, token),
                gt(passwordResetTokens.expiresAt, new Date())
            ))
            .limit(1);

        if (!tokenRecord) {
            return { success: false, error: "Invalid or expired reset token." };
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update user
        await db.update(users).set({
            password: passwordHash,
            failedLoginAttempts: 0,
            lockoutUntil: null
        }).where(eq(users.id, tokenRecord.userId));

        // Delete token
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenRecord.id));

        return { success: true, message: "Your password has been reset successfully. You can now log in." };
    } catch (error) {
        console.error("Reset Password Error:", error);
        return { success: false, error: "An unexpected error occurred. Please try again later." };
    }
}

export async function changePasswordForced(password: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const userId = parseInt(session.user.id);
        const passwordHash = await bcrypt.hash(password, 10);

        await db.update(users).set({
            password: passwordHash,
            requiresPasswordChange: false
        }).where(eq(users.id, userId));

        return { success: true, message: 'Password changed successfully.' };
    } catch (error) {
        console.error('Forced Change Password Error:', error);
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
}
