import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/api-auth";
import crypto from "crypto";
import { sendEmail } from "@/lib/mail";
import { emailVerificationTokens } from "@/db/schema";

export async function POST(req: Request) {
    try {
        // SECURITY FIX H-1a: Rate-limit registrations to prevent bulk account creation.
        // Rate limiting removed per user request
        // const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        // const ip = forwarded.split(',')[0].trim();
        // const rateCheck = await checkRateLimit(`register:${ip}`);
        // if (!rateCheck.allowed) {
        //     return NextResponse.json(
        //         { message: "Too many requests. Please try again later." },
        //         { status: 429, headers: { 'Retry-After': '60' } }
        //     );
        // }

        const body = await req.json();
        // SECURITY FIX H-1b: Destructure only the fields we trust from the request body.
        // 'role' is intentionally excluded — public registrations are always 'student'.
        const { email, password, name, surname, firstName, middleName } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // SECURITY FIX H-1c: Validate email format server-side.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Invalid email address" },
                { status: 400 }
            );
        }

        // Enforce minimum password length
        if (typeof password !== 'string' || password.length < 8) {
            return NextResponse.json(
                { message: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user — role is always 'applicant' for public self-registration
        const [insertResult] = await db.insert(users).values({
            email: normalizedEmail,
            name: name.trim(),
            surname: surname?.trim() || null,
            firstName: firstName?.trim() || null,
            middleName: middleName?.trim() || null,
            password: hashedPassword,
            role: "applicant", // SECURITY: never accept role from request body
            requiresPasswordChange: false,
            emailVerified: false,
        });

        const userId = insertResult.insertId;

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await db.insert(emailVerificationTokens).values({
            userId,
            token,
            expiresAt,
        });

        // Send email (best-effort — don't block registration if email fails)
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.fssibadan.edu.ng'}/verify-email?token=${token}`;
        const emailHtml = `
            <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
                <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center;">
                    <h1 style="color: #1a5b3a; margin-bottom: 24px; font-size: 28px; font-weight: 800; text-transform: uppercase;">Verify Your Email</h1>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                        Dear <strong>${name}</strong>,<br><br>
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
            console.error("Registration email send failed (non-blocking):", emailErr);
        }

        return NextResponse.json(
            { message: "Registration successful. Please check your email to verify your account." },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

