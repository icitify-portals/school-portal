import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, staffProfiles, hrMessageTemplates, hrScheduledMessages } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/mail';
import { sendWhatsAppMessage } from '@/lib/twilio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 1-12
        const currentDay = today.getDate(); // 1-31
        const dateString = today.toISOString().split('T')[0];

        // 1. Fetch Active Templates
        const templates = await db.query.hrMessageTemplates.findMany({
            where: eq(hrMessageTemplates.isActive, true)
        });
        const templateMap = templates.reduce((acc, t) => {
            acc[t.eventName] = t;
            return acc;
        }, {} as Record<string, any>);

        // 2. Process Birthdays
        const birthdayUsers = await db.query.users.findMany({
            where: and(
                eq(users.status, 'active'),
                sql`MONTH(date_of_birth) = ${currentMonth}`,
                sql`DAY(date_of_birth) = ${currentDay}`
            )
        });

        for (const user of birthdayUsers) {
            const template = user.role === 'staff' ? templateMap['birthday_staff'] : templateMap['birthday_student'];
            if (template) {
                const message = template.messageBody.replace(/\[Name\]/g, user.name);
                if (template.sendViaEmail && user.email) {
                    await sendEmail(user.email, template.subject, message);
                }
                if (template.sendViaWhatsapp && user.phone) {
                    await sendWhatsAppMessage(user.phone, message);
                }
            }
        }

        // 3. Process Work Anniversaries
        const anniversaryStaff = await db.query.staffProfiles.findMany({
            where: and(
                sql`MONTH(employment_date) = ${currentMonth}`,
                sql`DAY(employment_date) = ${currentDay}`
            ),
            with: { user: true }
        });

        const annivTemplate = templateMap['work_anniversary'];
        if (annivTemplate) {
            for (const staff of anniversaryStaff) {
                if (!staff.user || staff.user.status !== 'active') continue;
                
                const years = staff.employmentDate ? today.getFullYear() - new Date(staff.employmentDate).getFullYear() : 0;
                if (years > 0) {
                    let message = annivTemplate.messageBody.replace(/\[Name\]/g, staff.user.name);
                    message = message.replace(/\[YearsOfService\]/g, years.toString());
                    
                    if (annivTemplate.sendViaEmail && staff.user.email) {
                        await sendEmail(staff.user.email, annivTemplate.subject, message);
                    }
                    if (annivTemplate.sendViaWhatsapp && staff.user.phone) {
                        await sendWhatsAppMessage(staff.user.phone, message);
                    }
                }
            }
        }

        // 4. Process Scheduled Ad-hoc Messages
        const scheduled = await db.query.hrScheduledMessages.findMany({
            where: and(
                eq(hrScheduledMessages.scheduledDate, dateString as any),
                eq(hrScheduledMessages.status, 'pending')
            )
        });

        for (const msg of scheduled) {
            let targets: any[] = [];
            if (msg.targetAudience === 'all_staff') {
                targets = await db.query.users.findMany({ where: and(eq(users.role, 'staff'), eq(users.status, 'active')) });
            } else if (msg.targetAudience === 'all_students') {
                targets = await db.query.users.findMany({ where: and(eq(users.role, 'student'), eq(users.status, 'active')) });
            } else if (msg.targetAudience === 'all_users') {
                targets = await db.query.users.findMany({ where: eq(users.status, 'active') });
            } else if (msg.targetAudience === 'specific_user' && msg.targetUserId) {
                const u = await db.query.users.findFirst({ where: eq(users.id, msg.targetUserId) });
                if (u) targets = [u];
            }

            for (const t of targets) {
                const finalBody = msg.messageBody.replace(/\[Name\]/g, t.name);
                if (msg.sendViaEmail && t.email) {
                    await sendEmail(t.email, msg.subject, finalBody);
                }
                if (msg.sendViaWhatsapp && t.phone) {
                    await sendWhatsAppMessage(t.phone, finalBody);
                }
            }

            // Mark as sent
            await db.update(hrScheduledMessages)
                .set({ status: 'sent', sentAt: new Date() })
                .where(eq(hrScheduledMessages.id, msg.id));
        }

        return NextResponse.json({ success: true, message: 'HR Events processed successfully.' });
    } catch (error: any) {
        console.error('HR Cron Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
