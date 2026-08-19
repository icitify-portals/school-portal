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

    // Fetch potential recipients directly from users table
    const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
    })
        .from(users)
        .where(ne(users.id, userId))
        .limit(500);

    const validRecipients = [];
    for (const u of allUsers) {
        try {
            const can = await CommunicationService.canMessage(userId, u.id);
            if (can) {
                const formattedRole = (u.role || 'User').replace(/_/g, ' ').toUpperCase();
                validRecipients.push({
                    id: u.id,
                    name: u.name || u.email || `User #${u.id}`,
                    email: u.email || '',
                    role: formattedRole
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
