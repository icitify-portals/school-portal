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

        // Send email
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.fssibadan.edu.ng'}/verify-email?token=${token}`;
        const emailHtml = `
            <h2>Welcome to Federal School of Statistics, Ibadan</h2>
            <p>Dear ${name},</p>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
        `;
        
        await sendEmail(normalizedEmail, 'Verify your Email - FSS Ibadan', emailHtml);

        return NextResponse.json(
            { message: "User registered successfully. Please check your email to verify your account." },
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

