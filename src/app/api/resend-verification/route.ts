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
            <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
                <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center;">
                    <h1 style="color: #1a5b3a; margin-bottom: 24px; font-size: 28px; font-weight: 800; text-transform: uppercase;">Verify Your Email</h1>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                        Dear <strong>${user.name}</strong>,<br><br>
                        Welcome to the Federal School of Statistics, Ibadan Applicant Portal. To complete your registration and begin your application process, please verify your email address by clicking the button below.
                    </p>
                    <a href="${verificationLink}" style="display: inline-block; background-color: #1a5b3a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; letter-spacing: 1px; margin-bottom: 24px; text-transform: uppercase;">
                        Verify Email Address
                    </a>
                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${verificationLink}" style="color: #1a5b3a; word-break: break-all;">${verificationLink}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
                    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
                        This verification link will expire in 24 hours. If you did not request this registration, please ignore this email.
                    </p>
                </div>
            </div>
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
