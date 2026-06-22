const mysql = require('mysql2/promise');

const templateHtml = `
<div class="letter-container" style="font-family: 'Georgia', serif; color: #1e293b; line-height: 1.6; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; max-width: 800px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
  <div class="letter-header" style="display: flex; align-items: center; border-bottom: 4px double #166534; padding-bottom: 20px; margin-bottom: 30px;">
    <div class="logo-box" style="width: 80px; height: 80px; background-color: #15803d; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-right: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <div class="logo-text" style="color: white; font-family: sans-serif; font-weight: 900; font-size: 24px; letter-spacing: -1px;">FSS</div>
    </div>
    <div class="header-text" style="flex: 1;">
      <h1 class="institution-name" style="font-size: 22px; font-weight: 900; color: #14532d; text-transform: uppercase; font-family: sans-serif; margin: 0; letter-spacing: -0.5px;">FEDERAL SCHOOL OF STATISTICS, IBADAN</h1>
      <p class="institution-sub" style="font-size: 11px; font-weight: bold; color: #475569; font-family: sans-serif; margin: 4px 0 0 0;">An Institution of the National Bureau of Statistics (NBS)</p>
      <p class="institution-sub" style="font-size: 9px; color: #64748b; font-family: sans-serif; margin: 2px 0 0 0;">PMB 5030, Ibadan, Oyo State, Nigeria | official website: www.fssibadan.edu.ng</p>
    </div>
  </div>
  
  <div style="display: flex; justify-content: space-between; font-size: 12px; font-family: sans-serif; color: #64748b; margin-bottom: 25px;">
    <div style="font-weight: bold;">Ref: FSS/ADM/{{admission_year}}/{{academic_number}}</div>
    <div>Date: {{date}}</div>
  </div>

  <div style="margin-bottom: 30px; font-size: 14px; font-family: sans-serif;">
    <p style="font-weight: 900; margin: 0; text-transform: uppercase; color: #0f172a; font-size: 16px;">{{candidate_name}}</p>
    <p style="margin: 4px 0 0 0; color: #15803d; font-style: italic; font-weight: bold; font-size: 12px; text-transform: uppercase; tracking-wider;">Admitted Candidate Offer</p>
  </div>

  <h2 class="letter-title" style="font-size: 20px; font-weight: 900; text-align: center; margin: 30px 0; color: #14532d; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; text-transform: uppercase; font-family: sans-serif; letter-spacing: 1px;">OFFER OF PROVISIONAL ADMISSION</h2>

  <p style="font-size: 15px; margin-bottom: 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
  
  <p style="font-size: 15px; text-align: justify; margin-bottom: 20px; text-indent: 40px;">
    Following your selection in the institutional entrance screening and verification process, we are pleased to inform you that you have been offered provisional admission into the Federal School of Statistics, Ibadan for the <strong>{{admission_year}} Academic Session</strong>.
  </p>

  <p style="font-size: 15px; text-align: justify; margin-bottom: 20px;">
    This offer of admission is subject to academic verification of your credentials and the fulfillment of all departmental registry guidelines. The formal details of your offer are structured below:
  </p>

  <table class="details-table" style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <th style="padding: 14px 20px; text-align: left; background-color: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; font-family: sans-serif; width: 35%; border-right: 1px solid #e2e8f0;">Programme</th>
      <td style="padding: 14px 20px; text-align: left; font-size: 14px; font-weight: bold; color: #1e293b;">{{programme_name}}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <th style="padding: 14px 20px; text-align: left; background-color: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; font-family: sans-serif; width: 35%; border-right: 1px solid #e2e8f0;">Mode of Entry</th>
      <td style="padding: 14px 20px; text-align: left; font-size: 14px; font-weight: bold; color: #1e293b;">{{mode_of_entry}}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <th style="padding: 14px 20px; text-align: left; background-color: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; font-family: sans-serif; width: 35%; border-right: 1px solid #e2e8f0;">Mode of Study</th>
      <td style="padding: 14px 20px; text-align: left; font-size: 14px; font-weight: bold; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">{{study_mode}}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <th style="padding: 14px 20px; text-align: left; background-color: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; font-family: sans-serif; width: 35%; border-right: 1px solid #e2e8f0;">JAMB Reg Number</th>
      <td style="padding: 14px 20px; text-align: left; font-size: 14px; font-weight: bold; color: #1e293b;">{{jamb_reg_no}}</td>
    </tr>
    <tr>
      <th style="padding: 14px 20px; text-align: left; background-color: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; font-family: sans-serif; width: 35%; border-right: 1px solid #e2e8f0;">Student Matric Number</th>
      <td style="padding: 14px 20px; text-align: left; font-size: 14px; font-weight: bold; color: #1e293b; font-family: monospace; letter-spacing: 1px;">{{academic_number}}</td>
    </tr>
  </table>

  <p style="font-size: 15px; text-align: justify; margin-bottom: 20px; text-indent: 40px;">
    To secure and confirm this offer of admission, you are expected to pay the required <strong>Acceptance Fee</strong>. Upon receipt and verification of this fee, your official student profile status will be updated to enrolled, and your automatic matriculation number will be formally registered in the institutional student database.
  </p>

  <p style="font-size: 15px; margin-bottom: 45px;">
    We congratulate you on your admission and wish you academic success at the Federal School of Statistics, Ibadan.
  </p>

  <div class="signature-section" style="margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end;">
    <div style="font-family: sans-serif;">
      <div class="signature-line" style="width: 220px; border-top: 1px solid #000000; margin-bottom: 8px;"></div>
      <p style="font-size: 12px; font-weight: 950; margin: 0; text-transform: uppercase; color: #0f172a;">The Registrar</p>
      <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0; font-weight: bold;">Federal School of Statistics, Ibadan</p>
    </div>
    <div class="stamp-box" style="border: 3px dashed rgba(21, 128, 61, 0.2); border-radius: 50%; width: 110px; height: 110px; display: flex; align-items: center; justify-content: center; transform: rotate(-10deg); box-shadow: inset 0 0 8px rgba(21,128,61,0.02);">
      <div class="stamp-text" style="font-size: 9px; font-weight: 900; text-align: center; color: rgba(21, 128, 61, 0.35); text-transform: uppercase; font-family: sans-serif; line-height: 1.2;">FSS IBADAN<br/>* REGISTRAR *<br/>OFFICIAL SEAL</div>
    </div>
  </div>
</div>
`;

const templateCss = `
body {
  background-color: #f8fafc;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
@media print {
  body {
    background-color: #ffffff;
  }
  .letter-container {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    max-width: 100% !important;
  }
}
`;

async function run() {
    const targetDbs = ['school_portal', 'portal_ajat_academy', 'portal_citadel_uni'];

    for (const dbName of targetDbs) {
        try {
            const connection = await mysql.createConnection(`mysql://root:@localhost:3306/${dbName}`);
            console.log(`\n=== Database: ${dbName} ===`);

            // 1. Alter Table
            try {
                await connection.execute("ALTER TABLE students ADD COLUMN study_mode VARCHAR(50) DEFAULT 'Full-Time'");
                console.log("SUCCESS: Added study_mode column to students table.");
            } catch (err) {
                if (err.message.includes("Duplicate column name")) {
                    console.log("INFO: Column study_mode already exists in students table.");
                } else {
                    console.error("ERROR altering students table:", err.message);
                }
            }

            // 2. Seed Admission Letter Template
            try {
                // Delete any existing tertiary level admission letter template to avoid duplicates
                await connection.execute("DELETE FROM document_templates WHERE type = 'admission_letter' AND level = 'tertiary'");
                
                // Insert the new premium FSS template
                await connection.execute(`
                    INSERT INTO document_templates (name, type, level, template_html, template_css, is_active)
                    VALUES (?, 'admission_letter', 'tertiary', ?, ?, 1)
                `, ["FSS Ibadan Official Admission Letter", templateHtml, templateCss]);
                
                console.log("SUCCESS: Seeded FSS Ibadan Admission Letter template.");
            } catch (err) {
                console.error("ERROR seeding document templates:", err.message);
            }

            await connection.end();
        } catch (e) {
            console.error(`Failed to connect or process database ${dbName}:`, e.message);
        }
    }
}

run();
