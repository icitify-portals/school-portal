import { db } from "../src/db/db";
import { admissionApplicationsV2 } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../src/lib/mail";

async function run() {
    console.log("Reassigning Application ID 179 to User ID 2896...");
    
    // Update Application
    await db.update(admissionApplicationsV2)
        .set({ applicantId: 2896 })
        .where(eq(admissionApplicationsV2.id, 179));
        
    console.log("Successfully reassigned the application.");
    
    const emailContent = `
        <h2>HND Application Merged to Original Account</h2>
        <p>Dear Pelumi Oyedeji,</p>
        <p>We noticed you created a new account to apply for HND. To ensure your records remain intact, we have successfully merged your HND Application into your original ND Student Profile.</p>
        <p>You no longer need to use the new applicant account. Please <strong>log in using your original ND student account</strong> (oyedejipelumi2022@gmail.com) and click on <strong>"Apply for HND"</strong> to complete your form.</p>
        <p>If you have any questions, please let us know.</p>
        <br/>
        <p>Best Regards,</p>
        <p>Admissions Office</p>
    `;
    
    // Send email to the student's original email
    try {
        await sendEmail("oyedejipelumi2022@gmail.com", "HND Application Merged", emailContent);
        console.log("Email sent to oyedejipelumi2022@gmail.com");
        
        // Send a copy to the admin
        const adminEmailContent = `
            <h2>Copy: HND Application Merged</h2>
            <p>This email was successfully sent to Pelumi Oyedeji (oyedejipelumi2022@gmail.com) regarding her HND application merge.</p>
            <hr />
            ${emailContent}
        `;
        await sendEmail("aa.adelopo2@gmail.com", "[COPY] HND Application Merged - Pelumi Oyedeji", adminEmailContent);
        console.log("Admin copy sent to aa.adelopo2@gmail.com");
    } catch (error) {
        console.error("Failed to send emails:", error);
    }
    
    process.exit(0);
}

run().catch(console.error);
