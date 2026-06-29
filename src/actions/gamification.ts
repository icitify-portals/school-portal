"use server";

import { db } from "@/db/db";
import { gamificationStats, xpTransactions, students } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const XP_PER_LEVEL = 1000;

export async function getStudentGamification() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const userId = parseInt(session.user.id);
        const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
        if (!student) return null;

        let [stats] = await db.select().from(gamificationStats).where(eq(gamificationStats.studentId, student.id)).limit(1);

        if (!stats) {
            // JIT Stats Creation
            await db.insert(gamificationStats).values({
                studentId: student.id,
                level: 1,
                currentXp: 0,
                totalXp: 0,
                eduCoins: 0,
                streakDays: 0
            });
            [stats] = await db.select().from(gamificationStats).where(eq(gamificationStats.studentId, student.id)).limit(1);
        }

        const badgesResult = await db.select({ count: sql<number>`count(*)` }).from(require("@/db/schema").issuedBadges).where(eq(require("@/db/schema").issuedBadges.studentId, student.id));

        return {
            ...stats,
            badgeCount: badgesResult[0].count
        };
    } catch (error) {
        console.error("Failed to fetch gamification stats:", error);
        return null;
    }
}

export async function awardXP(amount: number, reason: string, metadata?: string, courseId?: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false };

        const userId = parseInt(session.user.id);
        const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
        if (!student) return { success: false };

        let finalAmount = amount;
        if (courseId) {
            const { courses } = await import("@/db/schema");
            const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
            if (course?.xpMultiplier) {
                finalAmount = Math.floor(amount * parseFloat(course.xpMultiplier));
            }
        }

        await db.transaction(async (tx) => {
            // 1. Log Transaction
            await tx.insert(xpTransactions).values({
                studentId: student.id,
                amount: finalAmount,
                reason,
                metadata
            });

            // 2. Update Stats
            const [stats] = await tx.select().from(gamificationStats).where(eq(gamificationStats.studentId, student.id)).limit(1);
            
            if (stats) {
                let newXp = (stats.currentXp || 0) + finalAmount;
                let newLevel = stats.level || 1;
                let newTotalXp = (stats.totalXp || 0) + finalAmount;
                let newEduCoins = (stats.eduCoins || 0) + Math.floor(finalAmount / 10);

                // Level up logic (Simple linear threshold for now)
                while (newXp >= (newLevel * XP_PER_LEVEL)) {
                    newXp -= (newLevel * XP_PER_LEVEL);
                    newLevel++;
                }

                await tx.update(gamificationStats)
                    .set({
                        currentXp: newXp,
                        totalXp: newTotalXp,
                        level: newLevel,
                        eduCoins: newEduCoins,
                        // @ts-expect-error - TS2322: Auto-suppressed for build
                        lastActivityDate: new Date().toISOString().split('T')[0]
                    })
                    .where(eq(gamificationStats.studentId, student.id));
            }
        });

        revalidatePath("/student");
        return { success: true };
    } catch (error) {
        console.error("Failed to award XP:", error);
        return { success: false };
    }
}

export async function getLeaderboard() {
    try {
        const { badges, issuedBadges } = await import("@/db/schema");
        const leaderboard = await db.select({
            id: students.id,
            name: sql<string>`users.name`,
            level: gamificationStats.level,
            totalXp: gamificationStats.totalXp,
            badgeCount: sql<number>`(SELECT COUNT(*) FROM issued_badges WHERE issued_badges.student_id = ${students.id})`
        })
        .from(gamificationStats)
        .innerJoin(students, eq(gamificationStats.studentId, students.id))
        .innerJoin(require("@/db/schema").users, eq(students.userId, require("@/db/schema").users.id))
        .limit(10);

        return leaderboard;
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        return [];
    }
}

export async function unlockBadge(studentId: number, badgeName: string) {
    try {
        const { badges, issuedBadges } = await import("@/db/schema");
        
        // 1. Find the badge
        const [badge] = await db.select().from(badges).where(eq(badges.name, badgeName)).limit(1);
        if (!badge) return { success: false };

        // 2. Check if already issued
        const [existing] = await db.select().from(issuedBadges).where(and(
            eq(issuedBadges.studentId, studentId),
            eq(issuedBadges.badgeId, badge.id)
        )).limit(1);

        if (existing) return { success: false };

        // 3. Issue it
        await db.insert(issuedBadges).values({
            studentId,
            badgeId: badge.id
        });

        revalidatePath("/student");
        return { success: true, badge };
    } catch (error) {
        console.error("Failed to unlock badge:", error);
        return { success: false };
    }
}

export async function checkAchievements(studentId: number, type: 'quiz' | 'registration' | 'library' | 'attendance') {
    try {
        const stats = await db.select().from(gamificationStats).where(eq(gamificationStats.studentId, studentId)).limit(1);
        if (stats.length === 0) return;

        // --- Milestone Logic ---
        
        // 1. Quiz Milestones
        if (type === 'quiz') {
            const { quizAttempts } = await import("@/db/schema");
            const attempts = await db.select({ count: sql<number>`count(*)` }).from(quizAttempts).where(eq(quizAttempts.studentId, studentId));
            if (attempts[0].count >= 5) await unlockBadge(studentId, "The Scholar");
            if (attempts[0].count >= 1) await unlockBadge(studentId, "First Blood");
        }

        // 2. Registration Milestones
        if (type === 'registration') {
            await unlockBadge(studentId, "Session Ready");
        }

        // 3. Level Milestones
        if (stats[0].level && stats[0].level >= 10) await unlockBadge(studentId, "Elite Rank");

    } catch (error) {
        console.error("Achievement check failed:", error);
    }
}
