"use server";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { encrypt, decrypt } from "@/lib/encryption";
import { generateBase32Secret, verifyTOTP, generateBackupCodes } from "@/lib/totp";
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
        const issuer = "SchoolPortal";
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
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return { error: "Two-factor authentication is not active on your account." };
        }

        // Decrypt the stored secret
        const secret = decrypt(user.twoFactorSecret);

        // Verify code
        const isValid = verifyTOTP(secret, code);
        if (!isValid) {
            return { error: "Invalid security code. Please check your authenticator app." };
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
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return { error: "Two-factor authentication is already disabled." };
        }

        // Decrypt and verify code
        const secret = decrypt(user.twoFactorSecret);
        const isValid = verifyTOTP(secret, code);
        if (!isValid) {
            return { error: "Invalid verification code. Could not disable 2FA." };
        }

        // Clear 2FA data in DB
        await db.update(users).set({
            twoFactorEnabled: false,
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
        if (!session?.user?.id) return { enabled: false };
        const [user] = await db.select().from(users).where(eq(users.id, parseInt(session.user.id))).limit(1);
        return { enabled: !!user?.twoFactorEnabled };
    } catch (e) {
        return { enabled: false };
    }
}
