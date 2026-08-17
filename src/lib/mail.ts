import { Resend } from 'resend';

const DEFAULT_FROM = 'FSS Ibadan Portal <info@notifications.fssibadan.edu.ng>';

export async function sendEmail(
    to: string, 
    subject: string, 
    html: string, 
    from?: string, 
    apiKey?: string,
    attachments?: { filename: string, content: Buffer | string }[]
) {
    let finalKey = apiKey || process.env.RESEND_API_KEY;

    if (!finalKey) {
        try {
            const { db } = await import('@/db/db');
            const { hrSettings } = await import('@/db/schema');
            const { eq } = await import('drizzle-orm');
            const [setting] = await db.select({ value: hrSettings.value })
                .from(hrSettings)
                .where(eq(hrSettings.settingKey, 'resend_api_key'))
                .limit(1);
            if (setting?.value) {
                finalKey = setting.value;
            }
        } catch (dbErr) {
            console.error("Failed to query resend_api_key from DB settings:", dbErr);
        }
    }

    if (!finalKey) {
        console.error("Email error: RESEND_API_KEY is not configured in .env or HR settings");
        return { success: false, error: "Email service not configured. Please add RESEND_API_KEY to your .env file or HR settings." };
    }

    const resend = new Resend(finalKey);

    try {
        const payload: any = {
            from: from || DEFAULT_FROM,
            to: [to],
            subject: subject,
            html: html,
        };

        if (attachments && attachments.length > 0) {
            payload.attachments = attachments;
        }

        const { data, error } = await resend.emails.send(payload);

        if (error) {
            console.error("Resend error:", error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Email send exception:", error);
        return { success: false, error };
    }
}
