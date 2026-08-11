"use server";

import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { students, users, academicSessions } from "@/db/schema";
import { sendEmail } from "@/lib/mail";
import { checkDeveloperFeeStatus } from "./paystack-developer-subscription";

/**
 * Server action to send a comprehensive fee reminder email to a specific student.
 * It checks their processing fee status and reminds them of outstanding school fees.
 */
export async function sendFeeReminderEmail(studentId: number) {
    try {
        const studentRecord = await db.query.students.findFirst({
            where: eq(students.id, studentId),
            with: {
                user: true
            }
        });

        if (!studentRecord || !studentRecord.user?.email) {
            return { success: false, message: "Student or email not found" };
        }

        const activeSession = await db.query.academicSessions.findFirst({
            where: eq(academicSessions.isCurrent, true)
        });

        if (!activeSession) {
            return { success: false, message: "No active academic session" };
        }

        const isProcessingFeePaid = await checkDeveloperFeeStatus(
            studentRecord.id.toString(),
            'school_fees',
            activeSession.id
        );

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.fssibadan.edu.ng';
        const studentName = studentRecord.firstName || 'Student';
        const matricNo = studentRecord.matricNumber || 'Applicant';

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #0f172a; text-align: center;">Urgent Fee Reminder</h2>
                <p>Dear <strong>${studentName}</strong> (${matricNo}),</p>
                <p>We are writing to remind you about your pending financial obligations for the <strong>${activeSession.name}</strong> academic session.</p>
                
                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #1e40af;">1. School Fees</h3>
                    <p style="margin-bottom: 0;">Please ensure that your standard school fees and any outstanding legacy balances are settled via the Student Finance Portal to avoid academic disruptions.</p>
                </div>

                ${!isProcessingFeePaid ? `
                <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #991b1b;">2. Platform Processing Fee (₦3,000)</h3>
                    <p style="margin-bottom: 0;">Your platform processing fee for this session is currently <strong>UNPAID</strong>. Failure to pay this fee will result in portal access restrictions towards the examination period.</p>
                    <div style="text-align: center; margin-top: 15px;">
                        <a href="${appUrl}/student" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Pay Processing Fee Now</a>
                    </div>
                </div>
                ` : `
                <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #166534;">2. Platform Processing Fee</h3>
                    <p style="margin-bottom: 0;">Thank you! Your platform processing fee for this session is <strong>PAID</strong>.</p>
                </div>
                `}

                <p>If you have already made these payments, please ignore this email. You can check your dashboard at any time to confirm your payment status.</p>
                
                <p style="margin-bottom: 0;">Best regards,</p>
                <p style="margin-top: 5px; font-weight: bold;">FSS Ibadan Bursary Department</p>
            </div>
        `;

        await sendEmail(
            studentRecord.user.email,
            "Urgent: Fee Payment Reminder - FSS Ibadan",
            emailHtml
        );

        return { success: true, message: "Reminder email sent successfully" };
    } catch (error: any) {
        console.error("Error sending fee reminder email:", error);
        return { success: false, message: error.message || "Failed to send reminder" };
    }
}
