import { db } from "../src/db/db";
import { documentTemplates } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    try {
        console.log("Updating admission letter templates...");

        const newHtml = `
<div style="font-family: 'Times New Roman', Times, serif; color: #000000; line-height: 1.6; padding: 40px; background-color: #ffffff; max-width: 800px; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 28px; font-weight: bold; text-transform: uppercase; margin: 0; color: #006600; letter-spacing: -0.5px;">FEDERAL SCHOOL OF STATISTICS</h1>
        <p style="font-size: 14px; font-weight: bold; font-style: italic; margin: 4px 0 0 0; color: #000000;">(National Bureau of Statistics)</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
        <!-- Left Info -->
        <div style="font-size: 13px; font-weight: bold; color: #000000; width: 33%; padding-top: 10px;">
            <p style="margin: 0 0 8px 0;">P. O. Box 20753, U. I. IBADAN</p>
            <p style="margin: 0 0 8px 0;">Email: <span style="font-weight: normal;">info@fssibadan.edu.ng</span></p>
            <p style="margin: 0;">Telephone: <span style="text-decoration: underline;">07036516563</span></p>
        </div>
        
        <!-- Center Logo -->
        <div style="width: 33%; display: flex; justify-content: center; margin-top: -16px;">
            <img src="/fss_logo.png" alt="School Logo" style="width: 96px; height: 112px; object-fit: contain;" />
        </div>
        
        <!-- Right Info -->
        <div style="font-size: 13px; font-weight: bold; color: #000000; width: 33%; text-align: right; padding-top: 16px;">
            <div style="margin-bottom: 12px;">
                <span style="margin-right: 8px;">Ref. No:</span>
                <span style="border-bottom: 1px solid #000; padding-bottom: 2px;">{{ref_no}}</span>
            </div>
            <div>
                <span style="margin-right: 8px;">Date:</span>
                <span style="border-bottom: 1px solid #000; padding-bottom: 2px;">{{date}}</span>
            </div>
        </div>
    </div>
    
    <!-- Applicant Info -->
    <div style="font-size: 14px; font-weight: bold; text-transform: uppercase; font-style: italic; color: #000000; margin-bottom: 32px;">
        <p style="margin: 0 0 8px 0;">NAME: <span style="font-weight: normal;">{{candidate_name}}</span></p>
        <p style="margin: 0 0 8px 0;">DEPARTMENT: <span style="font-weight: normal;">{{department_name}}</span></p>
        <p style="margin: 0;">MATRICULATION NUMBER: <span style="font-weight: normal;">{{academic_number}}</span></p>
    </div>
    
    <!-- Title -->
    <div style="text-align: center; font-weight: bold; font-style: italic; text-transform: uppercase; font-size: 18px; letter-spacing: 0.5px; color: #000000; margin-bottom: 24px; text-decoration: underline; text-underline-offset: 4px;">
        OFFER OF PROVISIONAL ADMISSION
    </div>

    <!-- Body -->
    <div style="font-size: 15px; color: #000000; font-style: italic; text-align: justify; line-height: 1.6;">
        <p style="margin-bottom: 16px;">
            With reference to the Post UTME and your basic entering qualification into the Federal School of Statistics, Ibadan, it is my pleasure to offer you a provisional admission into the {{study_mode}} Programme for a National Diploma in {{department_name}} which has a minimum duration of two years.
        </p>

        <p style="margin-bottom: 16px;">
            Please note the following conditions relating to this provisional offer:
        </p>

        <ol style="list-style-type: lower-roman; padding-left: 48px; margin-bottom: 24px; font-style: normal;">
            <li style="margin-bottom: 8px; padding-left: 8px;">You are expected to commence the programme at the beginning of {{academic_session}} academic session of this institution on {{resumption_date}}.</li>
            <li style="margin-bottom: 8px; padding-left: 8px;">You are therefore required to indicate acceptance of this offer by paying the acceptance fee of {{acceptance_fee_words}} only (N{{acceptance_fee}}) into the college account within two weeks from the date of this letter. Failure to complete the acceptance process within this stipulated time will lead to forfeiture of this provisional offer of admission.</li>
            <li style="margin-bottom: 8px; padding-left: 8px;">Lecture commences for the fresh students on {{lecture_start_date}}.</li>
            <li style="margin-bottom: 8px; padding-left: 8px;">Full payment of all necessary fees must be made before four (4) weeks of resumption, after which a penalty of 20% of the balance will be charged.</li>
            <li style="margin-bottom: 8px; padding-left: 8px;">Only fully paid students are eligible to register for their courses.</li>
            <li style="margin-bottom: 8px; padding-left: 8px;">Please note that there is no hostel accommodation hence students are expected to make personal arrangement to live off campus.</li>
            <li style="margin-bottom: 8px; padding-left: 8px;">There will be weeding out of students with below average performance (i.e. having more than six carry-overs) after the first semester examination.</li>
            <li style="margin-bottom: 8px; padding-left: 8px;">Pregnancy is not allowed throughout the duration of the course except those who are officially married.</li>
            <li style="margin-bottom: 8px; padding-left: 8px;">Note that the offer may be revoked and your place given to someone else if the provisions of i - iv above are not fulfilled within the stipulated time.</li>
            <li style="margin-bottom: 8px; padding-left: 8px;">Further information is available at the college.</li>
        </ol>

        <p style="margin-bottom: 56px; margin-top: 32px;">
            Accept my congratulations.
        </p>

        <div>
            <p style="font-weight: bold; margin: 0; font-style: normal;">Ag. Registrar</p>
        </div>
    </div>
</div>
`;

        await db.update(documentTemplates)
            .set({ templateHtml: newHtml })
            .where(eq(documentTemplates.type, "admission_letter"));

        console.log("Admission letter templates updated successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
