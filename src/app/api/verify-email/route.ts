import { db } from "@/db/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ message: "Verification token is required" }, { status: 400 });
        }

        // Find token and ensure it has not expired
        const [verificationRecord] = await db
            .select()
            .from(emailVerificationTokens)
            .where(
                and(
                    eq(emailVerificationTokens.token, token),
                    gt(emailVerificationTokens.expiresAt, new Date())
                )
            )
            .limit(1);

        if (!verificationRecord) {
            return NextResponse.json(
                { message: "Invalid or expired verification token" },
                { status: 400 }
            );
        }

        // Update user
        await db.update(users)
            .set({ emailVerified: true })
            .where(eq(users.id, verificationRecord.userId));

        // Delete token to prevent reuse
        await db.delete(emailVerificationTokens)
            .where(eq(emailVerificationTokens.id, verificationRecord.id));

        return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });

    } catch (error: any) {
        console.error("Verification error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
