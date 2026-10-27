"use server";

import { db } from "@/db/db";
import { users, passwordResetTokens, students } from "@/db/schema";
import { eq, and, or, like, ne, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { NotificationService } from "@/services/NotificationService";
import { sendEmail } from "@/lib/mail";
import { auth } from "@/auth";
import { validatePasswordStrength } from "@/lib/password-validator";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email || '';
    const [userPart, domain] = email.split('@');
    if (userPart.length <= 2) return `${userPart[0]}***@${domain}`;
    return `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`;
}

export async function getAuthUser() {
    try {
        const session = await auth();
        return session?.user || null;
    } catch (e) {
        return null;
    }
}

export async function forgotPassword(identifier: string) {
    try {
        const cleanInput = String(identifier ?? '').trim();
        if (!cleanInput) {
            return { success: false, error: "Please enter your email address, Matric Number, or Admission Number." };
        }

        let userRecord: any = null;
        let studentRecord: any = null;
        let targetEmail = "";

        const isEmail = cleanInput.includes('@');

        if (isEmail) {
            const cleanEmail = cleanInput.toLowerCase();
            const [foundUser] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
            if (foundUser) {
                userRecord = foundUser;
                targetEmail = foundUser.email;

                // Look for student record
                const [stu] = await db.select().from(students).where(eq(students.userId, foundUser.id)).limit(1);
                if (stu) {
                    studentRecord = stu;
                } else {
                    const [stuByEmail] = await db.select().from(students)
                        .where(or(
                            eq(students.guardianEmail, foundUser.email),
                            eq(students.kinEmail, foundUser.email)
                        ))
                        .limit(1);
                    if (stuByEmail) studentRecord = stuByEmail;
                }
            }
        }

        // If not found by email or input is not email, search by matric / admission number
        if (!userRecord) {
            const norm = cleanInput.toUpperCase().replace(/\s+/g, '');
            const slashNorm = norm.replace(/_/g, '/');
            const underNorm = norm.replace(/\//g, '_');

            const studentMatches = await db.select().from(students)
                .where(or(
                    eq(students.matricNumber, norm),
                    eq(students.matricNumber, slashNorm),
                    eq(students.matricNumber, underNorm),
                    eq(students.admissionNumber, norm),
                    eq(students.admissionNumber, slashNorm),
                    eq(students.admissionNumber, underNorm),
                    norm.length >= 4 ? like(students.matricNumber, `%${norm}%`) : sql`FALSE`,
                    norm.length >= 4 ? like(students.admissionNumber, `%${norm}%`) : sql`FALSE`
                ))
                .limit(1);

            if (studentMatches.length > 0) {
                studentRecord = studentMatches[0];
                if (studentRecord.userId) {
                    const [foundUser] = await db.select().from(users).where(eq(users.id, studentRecord.userId)).limit(1);
                    if (foundUser) {
                        userRecord = foundUser;
                    }
                }

                // If user not found by student.userId, search by matching name or matric email
                if (!userRecord) {
                    const strippedMatric = norm.replace(/[\/\_\s]/g, '').toLowerCase();
                    const [foundUser] = await db.select().from(users)
                        .where(or(
                            like(users.email, `%${strippedMatric}%`),
                            and(
                                eq(users.firstName, studentRecord.firstName || ''),
                                eq(users.surname, studentRecord.lastName || '')
                            )
                        ))
                        .limit(1);
                    if (foundUser) {
                        userRecord = foundUser;
                    }
                }
            }
        }

        if (!userRecord) {
            // Return generic message for security
            return {
                success: true,
                message: "If an account with that email or matric number exists, a reset link has been dispatched to the registered contact email."
            };
        }

        // Determine destination email address
        if (userRecord.email.endsWith('@student.fss.edu.ng')) {
            // Find companion personal user account with matching name if one exists
            const [personalUser] = await db.select().from(users)
                .where(and(
                    eq(users.name, userRecord.name),
                    ne(users.id, userRecord.id)
                ))
                .limit(1);

            if (personalUser && personalUser.email && !personalUser.email.endsWith('@student.fss.edu.ng')) {
                targetEmail = personalUser.email;
            } else if (studentRecord?.guardianEmail) {
                targetEmail = studentRecord.guardianEmail;
            } else if (studentRecord?.kinEmail) {
                targetEmail = studentRecord.kinEmail;
            } else {
                targetEmail = userRecord.email;
            }
        } else {
            targetEmail = userRecord.email;
        }

        // Generate token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

        // Clear existing tokens for this user
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userRecord.id));

        // Save new token
        await db.insert(passwordResetTokens).values({
            userId: userRecord.id,
            token,
            expiresAt
        });

        // Send Email
        const resetLink = `${APP_URL}/reset-password?token=${token}`;
        
        try {
            await sendEmail(
                targetEmail,
                "Password Reset Request",
                `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; border-top: 4px solid #4f46e5;">
                    <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Password Reset Request</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello ${userRecord.name || 'Student'},</p>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">We received a request to reset your FSS Portal password. Click the button below to choose a new password:</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 16px;">Reset My Password</a>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    <p style="color: #94a3b8; font-size: 12px;">FSS Portal Identity Services</p>
                </div>`
            );
        } catch (emailErr) {
            console.error("Password reset email send failed:", emailErr);
        }

        return {
            success: true,
            message: `A password reset link has been dispatched to ${maskEmail(targetEmail)}. Please check your inbox and spam folder.`
        };
    } catch (error: any) {
        console.error("Forgot Password Error:", error);
        return { success: false, error: "An unexpected error occurred. Please try again later." };
    }
}

export async function resetPasswordWithToken(token: string, password: string) {
    try {
        const cleanToken = String(token ?? '').trim();
        const cleanPassword = String(password ?? '').trim();

        if (!cleanToken) {
            return { success: false, error: "Reset token is missing or invalid. Please request a new link." };
        }

        // Validate password strength & rules
        const validation = validatePasswordStrength(cleanPassword);
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.firstError || "Password does not meet the security requirements."
            };
        }

        // Find token record
        const [tokenRecord] = await db.select()
            .from(passwordResetTokens)
            .where(eq(passwordResetTokens.token, cleanToken))
            .limit(1);

        if (!tokenRecord) {
            return {
                success: false,
                error: "This password reset link is invalid or has already been used. Please request a new link."
            };
        }

        // Check if token has expired
        const now = new Date();
        const expiresAt = new Date(tokenRecord.expiresAt);
        if (expiresAt.getTime() <= now.getTime()) {
            await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenRecord.id));
            return {
                success: false,
                error: "This password reset link has expired. Reset links are valid for 1 hour. Please request a new link."
            };
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(cleanPassword, 10);

        // Update user, unlock account, and reset failed attempts
        await db.update(users).set({
            password: passwordHash,
            requiresPasswordChange: false,
            failedLoginAttempts: 0,
            lockoutUntil: null
        }).where(eq(users.id, tokenRecord.userId));

        // DUAL-ACCOUNT SYNCHRONIZATION:
        // Find if this user is linked to a student record or has companion user accounts
        try {
            const [primaryUser] = await db.select().from(users).where(eq(users.id, tokenRecord.userId)).limit(1);
            if (primaryUser) {
                let [student] = await db.select().from(students).where(eq(students.userId, primaryUser.id)).limit(1);

                if (!student) {
                    const [stuByEmail] = await db.select().from(students)
                        .where(or(
                            eq(students.guardianEmail, primaryUser.email),
                            eq(students.kinEmail, primaryUser.email)
                        ))
                        .limit(1);
                    if (stuByEmail) student = stuByEmail;
                }

                if (student) {
                    const companionUsers = await db.select().from(users)
                        .where(and(
                            ne(users.id, primaryUser.id),
                            or(
                                eq(users.name, primaryUser.name),
                                student.matricNumber ? like(users.email, `%${student.matricNumber.replace(/[\/\_\s]/g, '').toLowerCase()}%`) : sql`FALSE`,
                                student.admissionNumber ? like(users.email, `%${student.admissionNumber.replace(/[\/\_\s]/g, '').toLowerCase()}%`) : sql`FALSE`
                            )
                        ));

                    for (const comp of companionUsers) {
                        await db.update(users).set({
                            password: passwordHash,
                            requiresPasswordChange: false,
                            failedLoginAttempts: 0,
                            lockoutUntil: null
                        }).where(eq(users.id, comp.id));
                    }

                    if (!student.userId || student.userId !== primaryUser.id) {
                        await db.update(students).set({ userId: primaryUser.id }).where(eq(students.id, student.id));
                    }
                }
            }
        } catch (syncErr) {
            console.error("Twin account password sync error (non-blocking):", syncErr);
        }

        // Delete used token
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenRecord.id));

        return {
            success: true,
            message: "Your password has been reset successfully. You can now log in with your new password."
        };
    } catch (error: any) {
        console.error("Reset Password Error:", error);
        return {
            success: false,
            error: error?.message || "An unexpected error occurred while resetting your password. Please try again."
        };
    }
}

export async function changePasswordForced(password: string, dob?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized. Please log in first.' };

        const userId = parseInt(session.user.id);
        const cleanPassword = String(password ?? '').trim();

        // Validate password strength & rules
        const validation = validatePasswordStrength(cleanPassword);
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.firstError || "Password does not meet the security requirements."
            };
        }
        
        // If user is a student, check for DOB
        const [userRecord] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (userRecord && userRecord.role === 'student') {
            const [studentRecord] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
            
            if (studentRecord) {
                if (!studentRecord.dob && !dob) {
                    return { success: false, error: 'Date of Birth is required for first-time setup.', requireDob: true };
                }
                
                if (!studentRecord.dob && dob) {
                    await db.update(students).set({ dob }).where(eq(students.userId, userId));
                }
            }
        }

        const passwordHash = await bcrypt.hash(cleanPassword, 10);

        await db.update(users).set({
            password: passwordHash,
            requiresPasswordChange: false,
            failedLoginAttempts: 0,
            lockoutUntil: null
        }).where(eq(users.id, userId));

        // Sync companion accounts if any
        try {
            if (userRecord) {
                const [stu] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
                if (stu) {
                    const companionUsers = await db.select().from(users)
                        .where(and(
                            ne(users.id, userId),
                            or(
                                eq(users.name, userRecord.name),
                                stu.matricNumber ? like(users.email, `%${stu.matricNumber.replace(/[\/\_\s]/g, '').toLowerCase()}%`) : sql`FALSE`,
                                stu.admissionNumber ? like(users.email, `%${stu.admissionNumber.replace(/[\/\_\s]/g, '').toLowerCase()}%`) : sql`FALSE`
                            )
                        ));

                    for (const comp of companionUsers) {
                        await db.update(users).set({
                            password: passwordHash,
                            requiresPasswordChange: false,
                            failedLoginAttempts: 0,
                            lockoutUntil: null
                        }).where(eq(users.id, comp.id));
                    }
                }
            }
        } catch (syncErr) {
            console.error("Twin account password sync in changePasswordForced error:", syncErr);
        }

        return { 
            success: true, 
            message: 'Password updated successfully.',
            email: userRecord?.email || session?.user?.email 
        };
    } catch (error: any) {
        console.error('Forced Change Password Error:', error);
        return {
            success: false,
            error: error?.message || 'An unexpected error occurred while changing your password. Please try again.'
        };
    }
}
