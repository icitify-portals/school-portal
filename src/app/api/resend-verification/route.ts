import { db } from "@/db/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/mail";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);

        if (!user) {
            return NextResponse.json({ message: "No account found with that email" }, { status: 404 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ message: "Email is already verified. You can log in." }, { status: 400 });
        }

        // Delete old tokens for this user
        await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));

        // Generate new token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.insert(emailVerificationTokens).values({
            userId: user.id,
            token,
            expiresAt,
        });

        // Send email (best-effort)
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.fssibadan.edu.ng'}/verify-email?token=${token}`;
        const emailHtml = `
            <h2>Email Verification — Federal School of Statistics, Ibadan</h2>
            <p>Dear ${user.name},</p>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verificationLink}" style="background-color:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">Verify Email</a>
            <p style="margin-top:20px;">This link will expire in 24 hours.</p>
            <p>If you did not create an account, you can safely ignore this email.</p>
        `;

        try {
            await sendEmail(normalizedEmail, 'Verify your Email - FSS Ibadan', emailHtml);
        } catch (emailErr) {
            console.error("Resend verification email failed:", emailErr);
        }

        return NextResponse.json({ message: "Verification link sent. Please check your inbox." });
    } catch (error: any) {
        console.error("Resend verification error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
