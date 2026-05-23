import { db } from "@/db/db";
import { users, directMessages, userRoles, roles, students } from "@/db/schema";
import { eq, and, or, desc, inArray, sql } from "drizzle-orm";

export class CommunicationService {
    /**
     * Check if a user can message another user based on hierarchical rules.
     */
    static async canMessage(senderId: number, recipientId: number) {
        // 1. Fetch sender and recipient roles
        // 1. Fetch sender roles
        const senderRows = await db.select({
            user: users,
            roleMapping: userRoles,
            role: roles
        })
            .from(users)
            .leftJoin(userRoles, eq(users.id, userRoles.userId))
            .leftJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(users.id, senderId));

        // 2. Fetch recipient roles
        const recipientRows = await db.select({
            user: users,
            roleMapping: userRoles,
            role: roles
        })
            .from(users)
            .leftJoin(userRoles, eq(users.id, userRoles.userId))
            .leftJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(users.id, recipientId));

        if (senderRows.length === 0 || recipientRows.length === 0) return false;

        const sender = {
            ...senderRows[0].user,
            roles: senderRows.map(r => ({ role: r.role })).filter(r => r.role)
        };
        const recipient = {
            ...recipientRows[0].user,
            roles: recipientRows.map(r => ({ role: r.role })).filter(r => r.role)
        };

        if (!sender || !recipient) return false;

        const senderRoleNames = sender.roles.map(r => r.role?.name).filter((name): name is string => !!name);
        const recipientRoleNames = recipient.roles.map(r => r.role?.name).filter((name): name is string => !!name);

        // Rule 1: Administrator can message ANYONE
        if (senderRoleNames.includes("Administrator") || sender.role === 'admin') {
            return true;
        }

        // Rule 2: Other roles (Staff, Manager, etc.) 
        // Can message Students AND members of their OWN role
        const isSenderStaff = senderRoleNames.some(r => r !== "Student");
        if (isSenderStaff) {
            // Can message any student
            if (recipientRoleNames.includes("Student") || recipient.role === 'student') {
                return true;
            }

            // Can message members of the same role
            const commonRoles = senderRoleNames.filter(r => recipientRoleNames.includes(r));
            if (commonRoles.length > 0) {
                return true;
            }
        }

        // Rule 3: Students can only reply
        const [previousMessage] = await db.select().from(directMessages).where(and(
            eq(directMessages.senderId, recipientId),
            eq(directMessages.recipientId, senderId)
        )).limit(1);

        if (previousMessage) return true;

        return false;
    }

    /**
     * Send a message and trigger a notification.
     */
    static async sendMessage(data: {
        senderId: number;
        recipientId: number;
        subject: string;
        content: string;
    }) {
        const allowed = await this.canMessage(data.senderId, data.recipientId);
        if (!allowed) throw new Error("Permission denied: You cannot message this user.");

        const [newMessage] = await db.insert(directMessages).values({
            senderId: data.senderId,
            recipientId: data.recipientId,
            subject: data.subject,
            content: data.content,
        });

        // Trigger Notification for the recipient
        const { NotificationService } = await import("./NotificationService");
        await NotificationService.notifyUser(data.recipientId, {
            title: `New Message: ${data.subject}`,
            message: data.content.substring(0, 100) + (data.content.length > 100 ? "..." : ""),
            type: 'info',
            channels: ['toast', 'email', 'push']
        });

        return { success: true, messageId: newMessage.insertId };
    }

    /**
     * Get user's inbox with sender details.
     */
    static async getInbox(userId: number) {
        const inboxRaw = await db.select({
            msg: directMessages,
            sender: users
        })
            .from(directMessages)
            .leftJoin(users, eq(directMessages.senderId, users.id))
            .where(eq(directMessages.recipientId, userId))
            .orderBy(desc(directMessages.createdAt));

        return inboxRaw.map(r => ({
            ...r.msg,
            sender: r.sender
        }));
    }

    /**
     * Get unread message count.
     */
    static async getUnreadCount(userId: number) {
        const result = await db.execute(
            sql`SELECT COUNT(*) as count FROM direct_messages WHERE recipient_id = ${userId} AND is_read = 0`
        );
        return (result[0] as any)?.count || 0;
    }
}
