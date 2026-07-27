import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { admissionApplicationsV2 } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { NotificationService } from '@/services/NotificationService';

export async function GET(request: Request) {
    try {
        console.log("Fetching submitted applications...");
        
        // Fetch all submitted or paid applications
        const applications = await db.query.admissionApplicationsV2.findMany({
            where: inArray(admissionApplicationsV2.status, ['submitted', 'paid'])
        });

        console.log(`Found ${applications.length} submitted/paid applications.`);
        let notifiedCount = 0;

        for (const app of applications) {
            let hasOlevel = false;
            try {
                const olevelParsed = typeof app.olevelData === 'string' ? JSON.parse(app.olevelData) : app.olevelData;
                if (olevelParsed) {
                    if (Array.isArray(olevelParsed) && olevelParsed.length > 0) hasOlevel = true;
                    else if (olevelParsed.sittings && olevelParsed.sittings.length > 0) hasOlevel = true;
                    else if (olevelParsed.firstSitting || olevelParsed.secondSitting) hasOlevel = true;
                    else if (Object.keys(olevelParsed).length > 0) hasOlevel = true;
                }
            } catch(e) {}

            if (!hasOlevel) {
                // Applicant has no O-Level details
                let email = "";
                let applicantName = "Applicant";
                let userId = null;
                try {
                    const formData = typeof app.data === 'string' ? JSON.parse(app.data || '{}') : (app.data || {});
                    email = formData.email || "";
                    applicantName = formData.surname 
                        ? (formData.middleName 
                            ? `${formData.surname} ${formData.firstName} ${formData.middleName}`.trim()
                            : `${formData.surname} ${formData.firstName}`.trim())
                        : `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Applicant';
                } catch(e) {}

                if (email) {
                    console.log(`Sending email to ${email} (Form: ${app.formNumber || app.id})...`);
                    
                    try {
                        const subject = "Action Required: Complete Your O-Level Details";
                        const htmlMessage = `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                <h2 style="color: #004d40;">Missing O-Level Details</h2>
                                <p>Dear ${applicantName},</p>
                                <p>We noticed that you have submitted your admission application (Form Number: <strong>${app.formNumber || 'N/A'}</strong>), but your O-Level results have not been filled in.</p>
                                <p><strong>Providing your O-Level details is compulsory for your application to be processed.</strong></p>
                                <p>Please log in to your portal and update your O-Level details as soon as possible.</p>
                                <div style="margin: 30px 0;">
                                    <a href="https://portal.fssibadan.edu.ng/applicant/application/${app.id}" style="background-color: #004d40; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Update Application</a>
                                </div>
                                <p>If you have already filled this in, please ignore this email.</p>
                                <p>Best regards,<br>Federal School of Statistics, Ibadan</p>
                            </div>
                        `;
                        
                        const { sendEmail } = require('@/lib/mail');
                        await sendEmail(email, subject, htmlMessage, '"FSS Ibadan Admissions" <admissions@fssibadan.edu.ng>');
                        notifiedCount++;
                    } catch(e: any) {
                        console.error(`Failed to send to ${email}: ${e.message}`);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, notifiedCount });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
