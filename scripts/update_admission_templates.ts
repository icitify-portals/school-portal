import { db } from "../src/db/db";
import { documentTemplates } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    try {
        console.log("Updating admission letter templates...");

        const newHtml = `
<p>
    With reference to the Post UTME and your basic entering qualification into the Federal School of Statistics, Ibadan, it is my pleasure to offer you a provisional admission into the {{study_mode}} Programme for a National Diploma in {{department_name}} which has a minimum duration of two years.
</p>

<p>
    Please note the following conditions relating to this provisional offer:
</p>

<ol>
    <li>You are expected to commence the programme at the beginning of {{academic_session}} academic session of this institution on {{resumption_date}}.</li>
    <li>You are therefore required to indicate acceptance of this offer by paying the acceptance fee of {{acceptance_fee_words}} only (N{{acceptance_fee}}) into the college account within two weeks from the date of this letter. Failure to complete the acceptance process within this stipulated time will lead to forfeiture of this provisional offer of admission.</li>
    <li>Lecture commences for the fresh students on {{lecture_start_date}}.</li>
    <li>Full payment of all necessary fees must be made before four (4) weeks of resumption, after which a penalty of 20% of the balance will be charged.</li>
    <li>Only fully paid students are eligible to register for their courses.</li>
    <li>Please note that there is no hostel accommodation hence students are expected to make personal arrangement to live off campus.</li>
    <li>There will be weeding out of students with below average performance (i.e. having more than six carry-overs) after the first semester examination.</li>
    <li>Pregnancy is not allowed throughout the duration of the course except those who are officially married.</li>
    <li>Note that the offer may be revoked and your place given to someone else if the provisions of i - iv above are not fulfilled within the stipulated time.</li>
    <li>Further information is available at the college.</li>
</ol>

<p class="sign-off">
    Accept my congratulations.
</p>

<div>
    <p class="signature">Ag. Registrar</p>
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
