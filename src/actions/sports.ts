"use server";

import { db } from "@/db/db";
import { sportsTeams, sportsTeamMembers, sportsFixtures, sportsInventory, sportsMedia, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Team Management
 */
export async function getSportsTeams(unitId: number) {
    try {
        return await db.select({
            team: sportsTeams,
            coach: {
                name: users.name,
                email: users.email
            }
        })
        .from(sportsTeams)
        .leftJoin(users, eq(sportsTeams.coachId, users.id))
        .where(eq(sportsTeams.unitId, unitId))
        .orderBy(desc(sportsTeams.createdAt));
    } catch (error) {
        console.error("Failed to fetch sports teams:", error);
        return [];
    }
}

export async function createSportsTeam(data: any) {
    try {
        await db.insert(sportsTeams).values(data);
        revalidatePath("/admin/sports");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create team" };
    }
}

export async function updateSportsTeam(id: number, data: any) {
    try {
        await db.update(sportsTeams).set(data).where(eq(sportsTeams.id, id));
        revalidatePath("/admin/sports");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update team" };
    }
}

/**
 * Roster Management
 */
export async function getTeamRoster(teamId: number) {
    try {
        return await db.select({
            membership: sportsTeamMembers,
            student: {
                name: users.name,
                email: users.email,
                imageUrl: users.imageUrl
            }
        })
        .from(sportsTeamMembers)
        .innerJoin(users, eq(sportsTeamMembers.studentId, users.id))
        .where(eq(sportsTeamMembers.teamId, teamId));
    } catch (error) {
        console.error("Failed to fetch team roster:", error);
        return [];
    }
}

/**
 * Fixtures & Results
 */
export async function getSportsFixtures(unitId: number) {
    try {
        return await db.select({
            fixture: sportsFixtures,
            team: sportsTeams
        })
        .from(sportsFixtures)
        .innerJoin(sportsTeams, eq(sportsFixtures.teamId, sportsTeams.id))
        .where(eq(sportsFixtures.unitId, unitId))
        .orderBy(desc(sportsFixtures.scheduledAt));
    } catch (error) {
        console.error("Failed to fetch fixtures:", error);
        return [];
    }
}

export async function updateMatchResult(id: number, data: any) {
    try {
        await db.update(sportsFixtures)
            .set({ ...data, status: 'completed' })
            .where(eq(sportsFixtures.id, id));
        revalidatePath("/admin/sports");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update match result" };
    }
}

/**
 * Inventory Management
 */
export async function getSportsInventory(unitId: number) {
    try {
        return await db.query.sportsInventory.findMany({
            where: eq(sportsInventory.unitId, unitId)
        });
    } catch (error) {
        return [];
    }
}

/**
 * Media & CMS
 */
export async function getSportsMedia(unitId: number) {
    try {
        return await db.query.sportsMedia.findMany({
            where: eq(sportsMedia.unitId, unitId),
            orderBy: desc(sportsMedia.createdAt)
        });
    } catch (error) {
        return [];
    }
}

export async function addSportsMedia(data: any) {
    try {
        await db.insert(sportsMedia).values(data);
        revalidatePath("/admin/cms/sports");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to upload media" };
    }
}
