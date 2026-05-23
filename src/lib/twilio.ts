import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default Twilio Sandbox

/**
 * Utility to send WhatsApp messages using Twilio.
 * @param to - The recipient phone number (with country code, e.g., +234...)
 * @param body - The message content
 */
export async function sendWhatsAppMessage(to: string, body: string) {
    if (!accountSid || !authToken) {
        console.error("Twilio credentials missing. Skipping WhatsApp notification.");
        return { success: false, error: "Credentials missing" };
    }

    const client = twilio(accountSid, authToken);

    // Twilio WhatsApp numbers must be prefixed with 'whatsapp:'
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    try {
        const message = await client.messages.create({
            body,
            from: fromWhatsApp,
            to: formattedTo,
        });

        console.log(`WhatsApp message sent to ${to}. SID: ${message.sid}`);
        return { success: true, sid: message.sid };
    } catch (error: any) {
        console.error(`Failed to send WhatsApp message to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
}
