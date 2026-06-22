"use server";

import { sendEmail } from "@/lib/mail";
import config from "@/lib/config";

/**
 * Sends a journal email with OJS-style DMARC compliance checks.
 * If the 'from' address domain does not match our verified default sender domain,
 * we rewrite the From header to our verified address and inject Reply-To routing instructions.
 */
export async function sendJournalEmail(data: {
    to: string;
    subject: string;
    html: string;
    fromEmail: string;
    fromName?: string;
}) {
    try {
        const defaultFrom = config.mail.from || "noreply@schoolportal.com";
        const verifiedDomain = defaultFrom.split('@')[1]?.toLowerCase();
        const senderDomain = data.fromEmail.split('@')[1]?.toLowerCase();

        let finalFrom = `${data.fromName || "Journal System"} <${data.fromEmail}>`;
        let finalHtml = data.html;

        // Domain mismatch: External domain (e.g. gmail.com, yahoo.com) cannot send directly from our mail server
        if (senderDomain !== verifiedDomain) {
            // Rewrite the sender to avoid DMARC failures
            finalFrom = `${data.fromName || "Journal System"} via Portal <${defaultFrom}>`;

            // Append Reply-To warning and metadata block to guide recipients
            const replyNotice = `
                <div style="margin-top: 20px; padding: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; background-color: #f8fafc; font-family: sans-serif;">
                    <strong>DMARC Delivery Routing:</strong> This email was sent on behalf of 
                    <strong>${data.fromName || "User"}</strong> (<a href="mailto:${data.fromEmail}">${data.fromEmail}</a>). 
                    To reply to this message, please send your email directly to: 
                    <a href="mailto:${data.fromEmail}">${data.fromEmail}</a>.
                </div>
            `;
            finalHtml = `${data.html}\n${replyNotice}`;
        }

        return await sendEmail(data.to, data.subject, finalHtml, finalFrom);
    } catch (error) {
        console.error("DMARC transactional email failed:", error);
        return { success: false, error: "DMARC mailing exception" };
    }
}
