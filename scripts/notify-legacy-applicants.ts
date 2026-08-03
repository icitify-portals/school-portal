import { createConnection } from 'mysql2/promise';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || "YOUR_KEY_HERE";
const resend = new Resend(RESEND_API_KEY);

async function notify() {
    const oldDb = await createConnection('mysql://root:@127.0.0.1:3306/oldfsstable');
    const [legacyPayments] = await oldDb.execute(`
        SELECT fullname, email 
        FROM adm_payment 
        WHERE amount IN ('20500', '10500', 20500, 10500)
        AND status = 'successful'
        AND session != '2025/2026'
    `);

    for (const record of (legacyPayments as any[])) {
        const { fullname, email } = record;
        console.log(`Sending to ${email}...`);
        
        try {
            await resend.emails.send({
                from: 'FSS Ibadan Portal <info@notifications.fssibadan.edu.ng>',
                to: [email],
                cc: ['aa.adelopo2@gmail.com'],
                subject: 'Important: Your FSS Ibadan Application Has Been Migrated',
                html: `
                    <p>Dear ${fullname},</p>
                    <p>We are writing to inform you that the FSS Ibadan admission portal has been upgraded.</p>
                    <p>Your existing application and payment records for the 2026/2027 session have been securely migrated to the new system.</p>
                    <p>To continue your application, please log in at <a href="https://portal.fssibadan.edu.ng">https://portal.fssibadan.edu.ng</a> using the following credentials:</p>
                    <ul>
                        <li><strong>Email:</strong> ${email}</li>
                        <li><strong>Password:</strong> password123</li>
                    </ul>
                    <p><em>For security reasons, we strongly advise you to change your password immediately after logging in.</em></p>
                    <p>Thank you,<br/>FSS Ibadan Admissions</p>
                `
            });
            console.log(`Successfully sent to ${email}`);
        } catch (e) {
            console.error(`Failed to send to ${email}:`, e);
        }
        
        // Sleep to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
    }
    
    console.log("All emails sent!");
    process.exit(0);
}

notify().catch(console.error);
