import { db } from "@/db/db";
import { idCards, users, students, staffProfiles, departments } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

export class IDCardService {
    /**
     * Generate a new ID card record for a user
     */
    static async issueIDCard(userId: number, userType: 'student' | 'staff') {
        try {
            // Check if user exists and is active
            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (!user) return { success: false, error: "User not found" };

            // Generate unique identifiers
            const issueId = `ID-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            const verificationCode = uuidv4();

            // Set expiry (e.g., 4 years for students, 2 years for staff)
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + (userType === 'student' ? 4 : 2));

            // Insert record
            await db.insert(idCards).values({
                userId,
                userType,
                issueId,
                verificationCode,
                expiresAt,
                status: 'active'
            });

            return { success: true, issueId, verificationCode };
        } catch (error) {
            console.error("Issue ID Card error:", error);
            return { success: false, error: "System failed to issue ID card" };
        }
    }

    /**
     * Get active ID card for a user
     */
    static async getActiveCard(userId: number) {
        try {
            const [card] = await db.select()
                .from(idCards)
                .where(and(
                    eq(idCards.userId, userId),
                    eq(idCards.status, 'active')
                ))
                .orderBy(desc(idCards.issuedAt))
                .limit(1);

            return card || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Generate QR Code Data URL for verification
     */
    static async generateVerificationQR(code: string) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const verifyUrl = `${baseUrl}/verify/id/${code}`;
        try {
            return await QRCode.toDataURL(verifyUrl, {
                margin: 2,
                color: {
                    dark: '#0f172a', // slate-900
                    light: '#ffffff'
                }
            });
        } catch (err) {
            console.error("QR Generation failed", err);
            return null;
        }
    }

    /**
     * Verify an ID card by its unique verification code
     */
    static async verifyIDCard(code: string) {
        try {
            const results = await db.select({
                card: idCards,
                user: users,
                student: students,
                staff: staffProfiles,
                dept: departments
            })
                .from(idCards)
                .innerJoin(users, eq(idCards.userId, users.id))
                .leftJoin(students, eq(users.id, students.userId))
                .leftJoin(staffProfiles, eq(users.id, staffProfiles.userId))
                .leftJoin(departments, sql`(${idCards.userType} = 'student' AND ${students.deptId} = ${departments.id}) OR (${idCards.userType} = 'staff' AND ${staffProfiles.departmentId} = ${departments.id})`)
                .where(eq(idCards.verificationCode, code))
                .limit(1);

            if (results.length === 0) return { success: false, error: "Invalid ID card signature" };

            const data = results[0];
            return {
                success: true,
                card: data.card,
                user: {
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role,
                    image: data.card.userType === 'student' ? data.student?.imageUrl : data.staff?.imageUrl,
                    identifier: data.card.userType === 'student' ? data.student?.matricNumber : data.staff?.staffId,
                    designation: data.card.userType === 'staff' ? data.staff?.designation : 'Student',
                    department: data.dept?.name || 'Academic Unit'
                }
            };
        } catch (error) {
            console.error("Verification error:", error);
            return { success: false, error: "Verification process failed" };
        }
    }

    /**
     * Get all issued ID cards (for Admin/ICT)
     */
    static async getAllIDCards(limit = 50, offset = 0) {
        try {
            const results = await db.select({
                card: idCards,
                user: users,
                student: students,
                staff: staffProfiles,
            })
                .from(idCards)
                .innerJoin(users, eq(idCards.userId, users.id))
                .leftJoin(students, eq(users.id, students.userId))
                .leftJoin(staffProfiles, eq(users.id, staffProfiles.userId))
                .orderBy(desc(idCards.issuedAt))
                .limit(limit)
                .offset(offset);

            return results.map(r => ({
                ...r.card,
                userName: r.user.name,
                identifier: r.card.userType === 'student' ? r.student?.matricNumber : r.staff?.staffId,
                status: r.card.status
            }));
        } catch (error) {
            console.error("Fetch all cards error:", error);
            return [];
        }
    }

    /**
     * Revoke an ID card
     */
    static async revokeCard(cardId: number) {
        try {
            await db.update(idCards)
                .set({ status: 'revoked' })
                .where(eq(idCards.id, cardId));
            return { success: true };
        } catch (error) {
            return { success: false, error: "Failed to revoke card" };
        }
    }
}
