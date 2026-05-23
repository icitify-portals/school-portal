import { sendWhatsAppMessage } from "@/lib/twilio";
import { sendEmail } from "@/lib/mail";
import { db } from "@/db/db";
import { users, notifications, students } from "@/db/schema";
import { eq } from "drizzle-orm";

import { sendPushToUser } from "@/actions/push";

export type NotificationChannel = 'whatsapp' | 'email' | 'toast' | 'internal' | 'push';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export class NotificationService {
    /**
     * Internal helper to save unread alerts for UI (Toasts)
     */
    static async createNotification(data: {
        userId: number;
        title: string;
        message: string;
        type?: NotificationType;
        channel?: 'toast' | 'email' | 'both';
        link?: string;
    }) {
        try {
            await db.insert(notifications).values({
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || 'info',
                channel: data.channel || 'both',
                link: data.link,
            });
            return { success: true };
        } catch (error) {
            console.error("Failed to save notification:", error);
            return { success: false, error };
        }
    }

    /**
     * Send a notification to a specific user across multiple channels.
     */
    static async notifyUser(userId: number, payload: {
        title: string;
        message: string;
        type?: NotificationType;
        channels?: NotificationChannel[];
    }) {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!user) return { error: "User not found" };

        const results: Record<string, any> = {};
        const channels = payload.channels || ['toast', 'email', 'push'];

        // 1. Database/Toast Notification
        if (channels.includes('toast')) {
            results.toast = await this.createNotification({
                userId,
                title: payload.title,
                message: payload.message,
                type: payload.type,
                channel: 'toast'
            });
        }

        // 2. Email Notification
        if (channels.includes('email') && user.email) {
            results.email = await sendEmail(
                user.email,
                payload.title,
                `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4f46e5;">${payload.title}</h2>
                    <p style="font-size: 16px; color: #374151;">${payload.message}</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #9ca3af;">This is an automated alert from your School Portal.</p>
                </div>`
            );
        }

        // 3. Push Notification
        if (channels.includes('push')) {
            results.push = await sendPushToUser(userId, {
                title: payload.title,
                body: payload.message,
                tag: payload.type || 'info'
            });
        }

        return results;
    }

    /**
     * Specifically for Financial Alerts
     */
    static async notifyTransaction(userId: number, data: {
        amount: string;
        purpose: string;
        type: 'credit' | 'debit';
        status: string;
    }) {
        const isCredit = data.type === 'credit';
        const title = isCredit ? "Payment Successful" : "Funds Disbursed";
        const message = isCredit
            ? `Your payment of ₦${parseFloat(data.amount).toLocaleString()} for "${data.purpose}" has been confirmed.`
            : `A disbursement of ₦${parseFloat(data.amount).toLocaleString()} for "${data.purpose}" has been processed.`;

        return await this.notifyUser(userId, {
            title,
            message,
            type: 'success',
            channels: ['toast', 'email', 'push']
        });
    }

    /**
     * Direct WhatsApp notification (useful for guests or specific phone numbers)
     */
    static async sendDirectWhatsApp(phone: string, message: string) {
        return await sendWhatsAppMessage(phone, message);
    }

    // Existing specialized alerts kept for compatibility
    static async sendAcademicAlert(phone: string, courseCode: string, sessionTime: string) {
        const body = `📚 School Portal Alert: Your session for ${courseCode} starts at ${sessionTime}. Don't forget to mark your attendance!`;
        return await this.sendDirectWhatsApp(phone, body);
    }

    static async sendFeeReminder(phone: string, amount: string, dueDate: string) {
        const body = `💳 Bursary Alert: A payment of ${amount} is due by ${dueDate}. You can pay via the student portal.`;
        return await this.sendDirectWhatsApp(phone, body);
    }

    static async sendResultAlert(phone: string, studentName: string, courseCode: string, semester: string) {
        const body = `🎓 Academic Alert: Hello ${studentName}, your result for ${courseCode} (${semester} Semester) has been published. Log in to the portal to view it.`;
        return await this.sendDirectWhatsApp(phone, body);
    }

    static async sendAdmissionUpdate(phone: string, studentName: string, status: string) {
        const body = `🏛 Admission Update: Hello ${studentName}, your admission status has been updated to "${status.toUpperCase()}". Check your portal for details.`;
        return await this.sendDirectWhatsApp(phone, body);
    }

    static async sendAttendanceGateAlert(email: string, data: {
        userName: string,
        type: 'in' | 'out',
        time: string,
        location: string
    }) {
        const subject = `Gate Attendance Alert: ${data.userName} has checked ${data.type.toUpperCase()}`;
        const message = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: ${data.type === 'in' ? '#10b981' : '#f59e0b'}; font-weight: 800; text-transform: uppercase;">
                    ${data.type === 'in' ? 'Check-In' : 'Check-Out'} Confirmed
                </h2>
                <p style="font-size: 16px; color: #374151;">
                    <strong>Name:</strong> ${data.userName}<br/>
                    <strong>Time:</strong> ${data.time}<br/>
                    <strong>Location:</strong> ${data.location}<br/>
                </p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #9ca3af;">This is an automated security alert from your School Management System.</p>
            </div>
        `;
        return await sendEmail(email, subject, message);
    }
}
