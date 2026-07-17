import { sendWhatsAppMessage } from "@/lib/twilio";
import { sendEmail } from "@/lib/mail";
import { config } from "@/lib/config";
import { db } from "@/db/db";
import { users, notifications, students } from "@/db/schema";
import { eq } from "drizzle-orm";

import { sendPushToUser } from "@/actions/push";

const ADMISSION_FROM = 'FSS Ibadan Admissions <info@notifications.fssibadan.edu.ng>';

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
                    <p style="font-size: 12px; color: #9ca3af;">This is an automated alert from your FSS Portal.</p>
                </div>`,
                config.mail.from
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
     * Send notification by email address directly (no userId required).
     * Used for public admission flows where the applicant may not have a user account yet.
     */
    static async notifyByEmail(email: string, payload: {
        title: string;
        message: string;
        type?: NotificationType;
        channels?: ('email' | 'inapp')[];
        userId?: number;
    }) {
        const results: Record<string, any> = {};
        const channels = payload.channels || ['email'];

        if (channels.includes('email')) {
            results.email = await sendEmail(
                email,
                payload.title,
                `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f8fafc; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                        <h1 style="color: white; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px;">${payload.title}</h1>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
                        <p style="font-size: 14px; color: #374151; line-height: 1.6;">${payload.message}</p>
                    </div>
                    <div style="text-align: center; padding: 15px; font-size: 11px; color: #9ca3af;">
                        This is an automated message from FSS Ibadan Admission Portal. Please do not reply directly to this email.
                    </div>
                </div>`,
                ADMISSION_FROM
            );
        }

        if (channels.includes('inapp') && payload.userId) {
            results.notification = await this.createNotification({
                userId: payload.userId,
                title: payload.title,
                message: payload.message.replace(/<[^>]*>/g, '').substring(0, 500),
                type: payload.type || 'info',
                channel: 'both',
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
        const body = `📚 FSS Portal Alert: Your session for ${courseCode} starts at ${sessionTime}. Don't forget to mark your attendance!`;
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
        return await sendEmail(email, subject, message, config.mail.from);
    }

    /**
     * Admission Application Submitted - HTML Email
     */
    static async sendApplicationSubmitted(userId: number, data: {
        applicantName: string;
        applicationNumber?: string;
        templateName: string;
    }) {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user?.email) return { error: "User email not found" };

        return await this.sendApplicationSubmittedByEmail(user.email, data);
    }

    /**
     * Admission Application Submitted - Email by address (for public form submissions)
     */
    static async sendApplicationSubmittedByEmail(email: string, data: {
        applicantName: string;
        formNumber?: string;
        applicationNumber?: string;
        templateName: string;
        userId?: number;
    }) {
        const subject = `Application Submitted - ${data.templateName}`;
        const htmlMessage = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #f8fafc; border-radius: 10px;">
                <div style="background: linear-gradient(135deg, #1a5b3a 0%, #0d7a4a 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Application Received</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Dear <strong>${data.applicantName}</strong>,</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;">Your application for <strong>${data.templateName}</strong> has been successfully submitted.</p>
                    ${data.formNumber ? `<p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;"><strong>Form Number:</strong> <span style="font-family: monospace; font-size: 16px; color: #4f46e5;">${data.formNumber}</span></p>` : ''}
                    ${data.applicationNumber ? `<p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;"><strong>Application Number:</strong> ${data.applicationNumber}</p>` : ''}
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 20px;">We will review your application and notify you of the outcome. You can track your application status through the applicant portal.</p>
                    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #1a5b3a;">
                        <p style="margin: 0; font-size: 13px; color: #166534;"><strong>What's Next?</strong><br/>Our admissions team will review your application. You will receive an email once a decision has been made. Please keep your form number safe for reference.</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
                    This is an automated message from the Admission Portal. Please do not reply directly to this email.
                </div>
            </div>
        `;
        
        const emailResult = await sendEmail(email, subject, htmlMessage, ADMISSION_FROM);
        
        let notificationResult = null;
        if (data.userId) {
            notificationResult = await this.createNotification({
                userId: data.userId,
                title: "Application Submitted",
                message: `Your application for ${data.templateName} has been submitted successfully. ${data.formNumber ? `Form Number: ${data.formNumber}` : ''}`,
                type: "success",
                channel: "both"
            });
        }
        
        return { email: emailResult, notification: notificationResult };
    }

    /**
     * Admission Accepted - HTML Email
     */
    static async sendAdmissionAccepted(userId: number, data: {
        applicantName: string;
        matricNumber: string;
        templateName: string;
    }) {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user?.email) return { error: "User email not found" };

        return await this.sendAdmissionAcceptedByEmail(user.email, { ...data, userId });
    }

    /**
     * Admission Accepted - Email by address
     */
    static async sendAdmissionAcceptedByEmail(email: string, data: {
        applicantName: string;
        matricNumber: string;
        templateName: string;
        userId?: number;
    }) {
        const subject = `Congratulations! Admission Accepted - ${data.templateName}`;
        const htmlMessage = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #f8fafc; border-radius: 10px;">
                <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Admission Accepted!</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Dear <strong>${data.applicantName}</strong>,</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;">Congratulations! We are delighted to inform you that your application for <strong>${data.templateName}</strong> has been <strong style="color: #059669;">ACCEPTED</strong>.</p>
                    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">Your Matriculation Number</p>
                        <p style="margin: 0; font-size: 28px; font-weight: 800; color: #059669;">${data.matricNumber}</p>
                    </div>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;">Please proceed to the student portal to complete your registration and generate your student ID.</p>
                    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <p style="margin: 0; font-size: 13px; color: #1e40af;"><strong>Next Steps:</strong><br/>1. Log in to the Student Portal<br/>2. Complete your registration<br/>3. Pay acceptance fee (if applicable)<br/>4. Generate your student ID card</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
                    This is an automated message from the Admission Portal. Please do not reply directly to this email.
                </div>
            </div>
        `;
        
        const emailResult = await sendEmail(email, subject, htmlMessage, ADMISSION_FROM);
        
        let notificationResult = null;
        if (data.userId) {
            notificationResult = await this.createNotification({
                userId: data.userId,
                title: "Admission Accepted!",
                message: `Congratulations! Your admission has been accepted. Matric Number: ${data.matricNumber}`,
                type: "success",
                channel: "both"
            });
        }
        
        return { email: emailResult, notification: notificationResult };
    }

    /**
     * Admission Rejected - HTML Email
     */
    static async sendAdmissionRejected(userId: number, data: {
        applicantName: string;
        templateName: string;
        reason?: string;
    }) {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user?.email) return { error: "User email not found" };

        return await this.sendAdmissionRejectedByEmail(user.email, { ...data, userId });
    }

    /**
     * Admission Rejected - Email by address
     */
    static async sendAdmissionRejectedByEmail(email: string, data: {
        applicantName: string;
        templateName: string;
        reason?: string;
        userId?: number;
    }) {
        const subject = `Application Update - ${data.templateName}`;
        const htmlMessage = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #f8fafc; border-radius: 10px;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Application Update</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Dear <strong>${data.applicantName}</strong>,</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;">Thank you for your interest in <strong>${data.templateName}</strong>. After careful review, we regret to inform you that your application has not been successful at this time.</p>
                    ${data.reason ? `<p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
                    <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
                        <p style="margin: 0; font-size: 13px; color: #991b1b;"><strong>Note:</strong> This decision is final for this application cycle. You may apply again in future admission periods.</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
                    This is an automated message from the Admission Portal. Please do not reply directly to this email.
                </div>
            </div>
        `;
        
        const emailResult = await sendEmail(email, subject, htmlMessage, ADMISSION_FROM);
        
        let notificationResult = null;
        if (data.userId) {
            notificationResult = await this.createNotification({
                userId: data.userId,
                title: "Application Update",
                message: `Your application for ${data.templateName} was not successful.`,
                type: "info",
                channel: "both"
            });
        }
        
        return { email: emailResult, notification: notificationResult };
    }

    /**
     * Payment Confirmed - HTML Email (application fee, acceptance fee, edit fine)
     */
    static async sendPaymentConfirmed(email: string, data: {
        applicantName: string;
        formNumber?: string;
        paymentType: string;
        templateName: string;
        reference: string;
        userId?: number;
    }) {
        const subject = `Payment Confirmed - ${data.templateName}`;
        const htmlMessage = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #f8fafc; border-radius: 10px;">
                <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Payment Confirmed</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Dear <strong>${data.applicantName}</strong>,</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;">Your <strong>${data.paymentType}</strong> payment for <strong>${data.templateName}</strong> has been confirmed successfully.</p>
                    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 13px; color: #1e40af;"><strong>Payment Details:</strong><br/>Type: ${data.paymentType}<br/>Reference: ${data.reference}</p>
                    </div>
                    ${data.formNumber ? `<p style="font-size: 13px; color: #6b7280; margin-bottom: 10px;">Form Number: <strong>${data.formNumber}</strong></p>` : ''}
                    <p style="font-size: 14px; color: #4b5563;">Your application will now proceed to the next stage. You will be notified of any updates.</p>
                </div>
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
                    This is an automated message from the Admission Portal. Please do not reply directly to this email.
                </div>
            </div>
        `;
        
        const emailResult = await sendEmail(email, subject, htmlMessage, ADMISSION_FROM);
        
        let notificationResult = null;
        if (data.userId) {
            notificationResult = await this.createNotification({
                userId: data.userId,
                title: "Payment Confirmed",
                message: `Your ${data.paymentType} payment for ${data.templateName} has been confirmed. Reference: ${data.reference}`,
                type: "success",
                channel: "both"
            });
        }
        
        return { email: emailResult, notification: notificationResult };
    }

    /**
     * Edit Window Opened - HTML Email
     */
    static async sendEditWindowOpened(email: string, data: {
        applicantName: string;
        templateName: string;
        expiresAt: Date;
        userId?: number;
    }) {
        const expires = data.expiresAt.toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" });
        const subject = `Edit Window Opened - ${data.templateName}`;
        const htmlMessage = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #f8fafc; border-radius: 10px;">
                <div style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Edit Window Opened</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Dear <strong>${data.applicantName}</strong>,</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;">Your edit window for <strong>${data.templateName}</strong> has been opened. You can now make changes to your application.</p>
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #d97706;">
                        <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>Important:</strong> Your edit window expires on <strong>${expires}</strong>. Any changes must be made before this deadline.</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
                    This is an automated message from the Admission Portal. Please do not reply directly to this email.
                </div>
            </div>
        `;
        
        const emailResult = await sendEmail(email, subject, htmlMessage, ADMISSION_FROM);
        
        let notificationResult = null;
        if (data.userId) {
            notificationResult = await this.createNotification({
                userId: data.userId,
                title: "Edit Window Opened",
                message: `Your edit window for ${data.templateName} is now open. Expires: ${expires}`,
                type: "warning",
                channel: "both"
            });
        }
        
        return { email: emailResult, notification: notificationResult };
    }

    /**
     * Application Under Review - HTML Email
     */
    static async sendApplicationUnderReview(email: string, data: {
        applicantName: string;
        formNumber?: string;
        templateName: string;
        userId?: number;
    }) {
        const subject = `Application Under Review - ${data.templateName}`;
        const htmlMessage = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #f8fafc; border-radius: 10px;">
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Application Under Review</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Dear <strong>${data.applicantName}</strong>,</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;">Your application for <strong>${data.templateName}</strong> is now being reviewed by our admissions team.</p>
                    ${data.formNumber ? `<p style="font-size: 13px; color: #6b7280; margin-bottom: 15px;">Form Number: <strong>${data.formNumber}</strong></p>` : ''}
                    <div style="background: #f5f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #7c3aed;">
                        <p style="margin: 0; font-size: 13px; color: #5b21b6;"><strong>What to expect:</strong><br/>We are carefully reviewing your application and supporting documents. You will receive an email once a decision has been made.</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
                    This is an automated message from the Admission Portal. Please do not reply directly to this email.
                </div>
            </div>
        `;
        
        const emailResult = await sendEmail(email, subject, htmlMessage, ADMISSION_FROM);
        
        let notificationResult = null;
        if (data.userId) {
            notificationResult = await this.createNotification({
                userId: data.userId,
                title: "Application Under Review",
                message: `Your application for ${data.templateName} is now being reviewed.`,
                type: "info",
                channel: "both"
            });
        }
        
        return { email: emailResult, notification: notificationResult };
    }
}
