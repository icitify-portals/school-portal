import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/api-auth";

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
        const { email, password, name } = body;

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

        // Insert user — role is always 'student' for public self-registration
        await db.insert(users).values({
            email: normalizedEmail,
            name: name.trim(),
            password: hashedPassword,
            role: "student", // SECURITY: never accept role from request body
            requiresPasswordChange: false,
        });

        return NextResponse.json(
            { message: "User registered successfully" },
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

