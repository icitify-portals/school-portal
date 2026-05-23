"use server";

import { db } from "@/db/db";
import { 
    gamificationStats, 
    xpTransactions, 
    issuedBadges, 
    badges, 
    students, 
    users 
} from "@/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";

export async function getGamificationOverview() {
    try {
        // 1. Total XP Distributed
        const [xpSum] = await db.select({ total: sql<number>`SUM(amount)` }).from(xpTransactions);
        
        // 2. Active Students (Students with any XP transaction)
        const [activeCount] = await db.select({ count: sql<number>`COUNT(DISTINCT student_id)` }).from(xpTransactions);

        // 3. Total Badges Issued
        const [badgeCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(issuedBadges);

        // 4. EduCoin Economy Size
        const [coinSum] = await db.select({ total: sql<number>`SUM(edu_coins)` }).from(gamificationStats);

        return {
            totalXp: xpSum?.total || 0,
            activeStudents: activeCount?.count || 0,
            totalBadges: badgeCount?.count || 0,
            economySize: coinSum?.total || 0
        };
    } catch (error) {
        console.error("Overview error:", error);
        return null;
    }
}

export async function getXpVelocity() {
    try {
        // Daily XP distribution for the last 7 days
        const last7Days = await db.select({
            date: sql<string>`DATE(created_at)`,
            total: sql<number>`SUM(amount)`
        })
        .from(xpTransactions)
        .where(gte(xpTransactions.createdAt, sql`DATE_SUB(NOW(), INTERVAL 7 DAY)`))
        .groupBy(sql`DATE(created_at)`)
        .orderBy(sql`DATE(created_at)`);

        return last7Days;
    } catch (error) {
        console.error("Velocity error:", error);
        return [];
    }
}

export async function getBadgeDistribution() {
    try {
        const distribution = await db.select({
            name: badges.name,
            count: sql<number>`COUNT(*)`,
            rarity: badges.rarity
        })
        .from(issuedBadges)
        .innerJoin(badges, eq(issuedBadges.badgeId, badges.id))
        .groupBy(badges.id)
        .orderBy(desc(sql`COUNT(*)`));

        return distribution;
    } catch (error) {
        console.error("Badge distribution error:", error);
        return [];
    }
}

export async function getTopPerformers() {
    try {
        const top = await db.select({
            name: users.name,
            level: gamificationStats.level,
            totalXp: gamificationStats.totalXp,
            badges: sql<number>`(SELECT COUNT(*) FROM issued_badges WHERE issued_badges.student_id = ${students.id})`
        })
        .from(gamificationStats)
        .innerJoin(students, eq(gamificationStats.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .orderBy(desc(gamificationStats.totalXp))
        .limit(5);

        return top;
    } catch (error) {
        console.error("Top performers error:", error);
        return [];
    }
}
