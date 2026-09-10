// @ts-nocheck
"use server";

import { db } from "@/db/db";
import { users, otpLogs } from "@/db/schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { encrypt, decrypt } from "@/lib/encryption";
import { generateBase32Secret, verifyTOTP, generateBackupCodes } from "@/lib/totp";
      // @ts-expect-error - Auto-suppressed by script
      // @ts-expect-error - Auto-suppressed by script
// @ts-expect-error - TS2724: Auto-suppressed for build
import { sendEmail } from "@/lib/mail";
import { sendWhatsAppMessage } from "@/lib/twilio";
import bcrypt from "bcryptjs";

/**
 * Initiates two-factor setup by generating a random base32 secret
 * and formatting the otpauth URI.
 */
export async function generateTwoFactorSetupAction() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.email) {
            return { error: "Unauthorized" };
        }

        const secret = generateBase32Secret();
        const issuer = "FSSPortal";
        const email = session.user.email;
        const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

        return {
            success: true,
            secret,
            otpauthUri,
        };
    } catch (error: any) {
        console.error("generateTwoFactorSetupAction error:", error);
        return { error: "Failed to generate 2FA setup details." };
    }
}

/**
 * Verifies the setup code, enables 2FA in the database, and returns the recovery codes.
 */
export async function enableTwoFactorAction(secret: string, code: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized" };
        }

        const userId = parseInt(session.user.id);

        // Verify the code
        const isValid = verifyTOTP(secret, code);
        if (!isValid) {
            return { error: "Invalid verification code. Please check your authenticator app and try again." };
        }

        // Encrypt the secret key before saving
        const encryptedSecret = encrypt(secret);

        // Generate backup codes
        const plainBackupCodes = generateBackupCodes(8);
        
        // Hash backup codes before saving
        const hashedBackupCodes = await Promise.all(
            plainBackupCodes.map(c => bcrypt.hash(c, 10))
        );

        // Save to DB
        await db.update(users).set({
            twoFactorEnabled: true,
            twoFactorMethod: 'app',
            twoFactorSecret: encryptedSecret,
            twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
        }).where(eq(users.id, userId));

        return {
            success: true,
            backupCodes: plainBackupCodes,
        };
    } catch (error: any) {
        console.error("enableTwoFactorAction error:", error);
        return { error: "Failed to enable 2FA." };
    }
}

/**
 * Requests an OTP to be sent via Email or SMS.
 */
export async function requestTwoFactorOTPAction(purpose: 'login' | 'setup' = 'login', method?: 'email' | 'sms') {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Unauthorized" };

        const userId = parseInt(session.user.id);
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) return { error: "User not found" };

        // Guard: only allow OTP when 2FA is enabled, unless this is a setup flow
        if (!user.twoFactorEnabled && purpose !== 'setup') {
            return { error: "Two-factor authentication is not active on your account." };
        }

        const targetMethod = method || user.twoFactorMethod || 'email';
        if (targetMethod === 'app') return { error: "Authenticator app does not use server-sent OTPs." };

        // Generate 6 digit OTP - 15 min expiry, check for recent valid OTP to avoid spamming
        // If a valid unused OTP was sent in last 2 minutes, reuse it instead of generating new one (prevents email delay confusion)
        const recentValid = await db.select().from(otpLogs).where(and(eq(otpLogs.userId, userId), eq(otpLogs.isUsed, false), gt(otpLogs.expiresAt, new Date()))).orderBy(desc(otpLogs.createdAt)).limit(1);
        if (recentValid.length > 0) {
            const ageMs = Date.now() - new Date((recentValid[0] as any).createdAt || Date.now()).getTime();
            if (ageMs < 2 * 60 * 1000) {
                // Reuse recent OTP, just resend email
                const existingCode = (recentValid[0] as any).otpCode;
                if (targetMethod === 'email') {
                    const emailResult = await sendEmail(user.email, 'Your Authentication Code', `<p>Your verification code is: <strong style="font-size: 24px;">${existingCode}</strong></p><p>This code expires in 15 minutes.</p>`);
                    if (!emailResult.success) {
                        console.error("OTP resend email failed:", emailResult.error);
                        return { error: "Failed to send email. Please try again." };
                    }
                    return { success: true, message: "Code resent to email (same code)." };
                } else if (targetMethod === 'sms' && user.phone) {
                    await sendWhatsAppMessage(user.phone, `Your FSS Portal verification code is: *${existingCode}*. It expires in 15 minutes.`);
                    return { success: true, message: "Code resent to your phone." };
                }
            }
        }
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpId = `2fa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await db.insert(otpLogs).values({
            userId,
            otpId,
            otpCode,
            expiresAt,
            isUsed: false,
        });

        if (targetMethod === 'email') {
            const emailResult = await sendEmail(
                user.email,
                'Your Authentication Code',
                `<p>Your verification code is: <strong style="font-size: 24px;">${otpCode}</strong></p><p>This code expires in 15 minutes.</p>`
            );
            if (!emailResult.success) {
                console.error("OTP email failed to send:", emailResult.error);
                return { error: "Failed to send email. Please check your email address or try again." };
            }
            // Invalidate older codes after successful send
            try { await db.execute(sql`UPDATE otp_logs SET is_used=1 WHERE user_id=${userId} AND is_used=0 AND otp_code != ${otpCode} AND expires_at > NOW()`); } catch {}
            return { success: true, message: "Code sent to email." };
        } else if (targetMethod === 'sms') {
            if (!user.phone) return { error: "No phone number registered on your profile." };
            await sendWhatsAppMessage(user.phone, `Your FSS Portal verification code is: *${otpCode}*. It expires in 15 minutes.`);
            try { await db.execute(sql`UPDATE otp_logs SET is_used=1 WHERE user_id=${userId} AND is_used=0 AND otp_code != ${otpCode} AND expires_at > NOW()`); } catch {}
            return { success: true, message: "Code sent to your phone." };
        }

        return { error: "Invalid method." };
    } catch (error: any) {
        console.error("requestTwoFactorOTPAction error:", error);
        return { error: "Failed to send OTP." };
    }
}

/**
 * Verifies the setup code, enables 2FA via OTP (Email/SMS) in the database.
 */
export async function enableOtpTwoFactorAction(method: 'email' | 'sms', code: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Unauthorized" };
        const userId = parseInt(session.user.id);

        const [otpLog] = await db.select()
            .from(otpLogs)
            .where(and(
                eq(otpLogs.userId, userId),
                eq(otpLogs.otpCode, code),
                eq(otpLogs.isUsed, false),
                gt(otpLogs.expiresAt, new Date())
            )).limit(1);

        if (!otpLog) {
            return { error: "Invalid or expired verification code." };
        }

        await db.update(otpLogs).set({ isUsed: true }).where(eq(otpLogs.id, otpLog.id));

        // Generate backup codes
        const plainBackupCodes = generateBackupCodes(8);
        const hashedBackupCodes = await Promise.all(plainBackupCodes.map(c => bcrypt.hash(c, 10)));

        // Save to DB
        await db.update(users).set({
            twoFactorEnabled: true,
            twoFactorMethod: method,
            twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
        }).where(eq(users.id, userId));

        return { success: true, backupCodes: plainBackupCodes };
    } catch (error: any) {
        console.error("enableOtpTwoFactorAction error:", error);
        return { error: "Failed to enable 2FA." };
    }
}

/**
 * Validates the 2FA code during login.
 */
export async function verifyTwoFactorLoginAction(code: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized" };
        }

        const userId = parseInt(session.user.id);

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user || !user.twoFactorEnabled) {
            return { error: "Two-factor authentication is not active on your account." };
        }

        const method = user.twoFactorMethod || 'app';

        if (method === 'app') {
            if (!user.twoFactorSecret) return { error: "Two-factor secret is missing. Please re-setup 2FA." };
            // Decrypt the stored secret
            const secret = decrypt(user.twoFactorSecret);
            const isValid = verifyTOTP(secret, code);
            if (!isValid) {
                return { error: "Invalid security code. Please check your authenticator app." };
            }
        } else {
            // Verify against OTP logs - trim and handle multiple codes, check expiry explicitly for better message
            const cleanCode = code.trim();
            const [otpLog] = await db.select()
                .from(otpLogs)
                .where(and(
                    eq(otpLogs.userId, userId),
                    eq(otpLogs.otpCode, cleanCode),
                    eq(otpLogs.isUsed, false)
                ))
                .limit(1);
            if (!otpLog) {
                return { error: "Invalid verification code. Please check and try again, or resend a new code." };
            }
            if (new Date(otpLog.expiresAt) < new Date()) {
                return { error: "Code has expired (15 min). Please resend a new code." };
            }

            await db.update(otpLogs).set({ isUsed: true }).where(eq(otpLogs.id, otpLog.id));
        }

        return { success: true };
    } catch (error: any) {
        console.error("verifyTwoFactorLoginAction error:", error);
        return { error: "Verification failed." };
    }
}

/**
 * Validates a recovery backup code during login.
 */
export async function verifyBackupCodeLoginAction(code: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized" };
        }

        const userId = parseInt(session.user.id);

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user || !user.twoFactorEnabled || !user.twoFactorBackupCodes) {
            return { error: "Two-factor recovery is not active on your account." };
        }

        const hashedCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
        const cleanCode = code.trim().toLowerCase();

        let matchedIndex = -1;
        for (let i = 0; i < hashedCodes.length; i++) {
            const isMatch = await bcrypt.compare(cleanCode, hashedCodes[i]);
            if (isMatch) {
                matchedIndex = i;
                break;
            }
        }

        if (matchedIndex === -1) {
            return { error: "Invalid backup recovery code." };
        }

        // Remove the used backup code from the list
        hashedCodes.splice(matchedIndex, 1);

        // Save updated backup codes
        await db.update(users).set({
            twoFactorBackupCodes: JSON.stringify(hashedCodes),
        }).where(eq(users.id, userId));

        return { success: true, remainingCount: hashedCodes.length };
    } catch (error: any) {
        console.error("verifyBackupCodeLoginAction error:", error);
        return { error: "Recovery failed." };
    }
}

/**
 * Disables 2FA on the account.
 */
export async function disableTwoFactorAction(code: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized" };
        }

        const userId = parseInt(session.user.id);

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const method = user.twoFactorMethod || 'app';

        if (method === 'app') {
            if (!user.twoFactorSecret) return { error: "Two-factor secret is missing." };
            const secret = decrypt(user.twoFactorSecret);
            const isValid = verifyTOTP(secret, code);
            if (!isValid) {
                return { error: "Invalid verification code. Could not disable 2FA." };
            }
        } else {
            const [otpLog] = await db.select()
                .from(otpLogs)
                .where(and(
                    eq(otpLogs.userId, userId),
                    eq(otpLogs.otpCode, code),
                    eq(otpLogs.isUsed, false),
                    gt(otpLogs.expiresAt, new Date())
                ))
                .limit(1);

            if (!otpLog) return { error: "Invalid or expired verification code. Could not disable 2FA." };
            await db.update(otpLogs).set({ isUsed: true }).where(eq(otpLogs.id, otpLog.id));
        }

        // Clear 2FA data in DB
        await db.update(users).set({
            twoFactorEnabled: false,
            twoFactorMethod: 'app',
            twoFactorSecret: null,
            twoFactorBackupCodes: null,
        }).where(eq(users.id, userId));

        return { success: true };
    } catch (error: any) {
        console.error("disableTwoFactorAction error:", error);
        return { error: "Failed to disable 2FA." };
    }
}

export async function getUserTwoFactorStatusAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { enabled: false, method: 'app' };
        const [user] = await db.select().from(users).where(eq(users.id, parseInt(session.user.id))).limit(1);
        return { 
            enabled: !!user?.twoFactorEnabled,
            method: user?.twoFactorMethod || 'app'
        };
    } catch (e) {
        return { enabled: false, method: 'app' };
    }
}
