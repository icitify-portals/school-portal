"use server";

import { db } from "@/db/db";
import { directMessages, users, roles, userRoles } from "@/db/schema";
import { eq, and, or, desc, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { CommunicationService } from "@/services/CommunicationService";
import { revalidatePath } from "next/cache";

export async function getMessagingContext() {
    const session = await auth();
    const user = session?.user as any;
    if (!user) return null;

    const userId = parseInt(user.id);
    const inbox = await CommunicationService.getInbox(userId);

    // Fetch potential recipients based on rules
    // This is for the "Compose" dropdown
    const allUsersRaw = await db.select({
        user: users,
        role: roles
    })
        .from(users)
        .innerJoin(userRoles, eq(users.id, userRoles.userId))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(ne(users.id, userId));

    const allUsers = allUsersRaw.reduce((acc, curr) => {
        const existing = acc.find((u: any) => u.id === curr.user.id);
        if (existing) {
            existing.roles.push({ role: curr.role });
        } else {
            acc.push({
                ...curr.user,
                roles: [{ role: curr.role }]
            });
        }
        return acc;
    }, [] as any[]);

    // Filter recipients based on canMessage logic
    // Optimized: filter in memory for now, or we could refine the query
    const validRecipients = [];
    for (const u of allUsers) {
        try {
            const can = await CommunicationService.canMessage(userId, u.id);
            if (can) {
                validRecipients.push({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.roles.map((r: any) => r.role.name).join(", ")
                });
            }
        } catch (e) { }
    }

    return {
        userId,
        inbox,
        validRecipients
    };
}

export async function sendMessage(data: {
    recipientId: number;
    subject: string;
    content: string;
}) {
    try {
        const session = await auth();
        const user = session?.user as any;
        if (!user) return { success: false, error: "Unauthorized" };

        const senderId = parseInt(user.id);
        const res = await CommunicationService.sendMessage({
            senderId,
            ...data
        });

        revalidatePath("/communications");
        return res;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function markMessageRead(messageId: number) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        await db.update(directMessages)
            .set({ isRead: true })
            .where(eq(directMessages.id, messageId));

        revalidatePath("/communications");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
