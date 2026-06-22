const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const dbs = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

async function seedDatabase(dbName, connection) {
  console.log(`\n--- Seeding database: ${dbName} ---`);

  // 1. Ensure a settlement account exists
  let settlementAccountId = null;
  const [accounts] = await connection.execute("SELECT id FROM settlement_accounts LIMIT 1");
  if (accounts.length > 0) {
    settlementAccountId = accounts[0].id;
    console.log(`Using existing settlement account ID: ${settlementAccountId}`);
  } else {
    const [insertAcc] = await connection.execute(
      `INSERT INTO settlement_accounts (account_name, bank_name, bank_code, account_number, is_active) 
       VALUES ('Main Registry Revenue Account', 'Zenith Bank', '057', '1012345678', true)`
    );
    settlementAccountId = insertAcc.insertId;
    console.log(`Inserted default settlement account ID: ${settlementAccountId}`);
  }

  // 2. Ensure gateway_subaccounts entry exists for Paystack if none
  const [subaccounts] = await connection.execute("SELECT id FROM gateway_subaccounts WHERE gateway_name = 'paystack' LIMIT 1");
  if (subaccounts.length === 0) {
    await connection.execute(
      `INSERT INTO gateway_subaccounts (settlement_account_id, gateway_name, gateway_subaccount_code) 
       VALUES (?, 'paystack', 'ACCT_mocksubaccount123')`,
      [settlementAccountId]
    );
    console.log("Inserted mock gateway subaccount for Paystack");
  }

  // 3. Seed Document Types
  const documentTypesList = [
    { name: "Official Academic Transcript", code: "TRANSCRIPT" },
    { name: "Statement of Result", code: "STATEMENT_OF_RESULT" },
    { name: "Degree/Diploma Certificate", code: "CERTIFICATE" }
  ];

  const docTypeIds = {};
  for (const docType of documentTypesList) {
    const [existing] = await connection.execute(
      "SELECT id FROM document_types WHERE code = ?",
      [docType.code]
    );

    if (existing.length > 0) {
      docTypeIds[docType.code] = existing[0].id;
      console.log(`Document type ${docType.code} already exists (ID: ${existing[0].id})`);
    } else {
      const [insertRes] = await connection.execute(
        "INSERT INTO document_types (name, code, is_active) VALUES (?, ?, true)",
        [docType.name, docType.code]
      );
      docTypeIds[docType.code] = insertRes.insertId;
      console.log(`Inserted document type ${docType.code} (ID: ${insertRes.insertId})`);
    }
  }

  // 4. Seed Document Forms for all graduate categories
  const defaultSchema = JSON.stringify({
    type: "object",
    properties: {
      reason: {
        type: "string",
        title: "Reason for Request",
        description: "E.g., employment, further studies, WES evaluation"
      },
      destinationInstitution: {
        type: "string",
        title: "Destination Institution / Organization",
        description: "Name of destination"
      },
      destinationEmail: {
        type: "string",
        title: "Destination Email Address (For Electronic Delivery)",
        description: "Required if choosing electronic delivery"
      },
      matricNumber: {
        type: "string",
        title: "Your Matriculation / Registration Number",
        description: "For double verification"
      }
    },
    required: ["reason", "destinationInstitution"]
  });

  const formsList = [
    {
      name: "Undergraduate Transcript Application Form",
      code: "TRANSCRIPT",
      category: "university_undergrad",
      instructions: "Apply for university undergraduate transcript. Electronic copies will be dispatched to the destination email, while physical copies will be shipped via courier."
    },
    {
      name: "Postgraduate Transcript Application Form",
      code: "TRANSCRIPT",
      category: "university_postgrad",
      instructions: "Apply for postgraduate transcript. Electronic copies will be dispatched to the destination email, while physical copies will be shipped via courier."
    },
    {
      name: "Ordinary National Diploma (OND) Transcript Form",
      code: "TRANSCRIPT",
      category: "polytechnic_ond",
      instructions: "Apply for OND transcript. Electronic copies will be dispatched to the destination email, while physical copies will be shipped via courier."
    },
    {
      name: "Higher National Diploma (HND) Transcript Form",
      code: "TRANSCRIPT",
      category: "polytechnic_hnd",
      instructions: "Apply for HND transcript. Electronic copies will be dispatched to the destination email, while physical copies will be shipped via courier."
    },
    {
      name: "Undergraduate Statement of Result Form",
      code: "STATEMENT_OF_RESULT",
      category: "university_undergrad",
      instructions: "Apply for statement of result. Usually processed within 3 working days."
    },
    {
      name: "OND Statement of Result Form",
      code: "STATEMENT_OF_RESULT",
      category: "polytechnic_ond",
      instructions: "Apply for ND statement of result."
    },
    {
      name: "HND Statement of Result Form",
      code: "STATEMENT_OF_RESULT",
      category: "polytechnic_hnd",
      instructions: "Apply for HND statement of result."
    },
    {
      name: "University Degree Certificate Form",
      code: "CERTIFICATE",
      category: "university_undergrad",
      instructions: "Apply for original degree certificate. Pick up or courier dispatch available."
    }
  ];

  for (const form of formsList) {
    const docTypeId = docTypeIds[form.code];
    if (!docTypeId) continue;

    const [existingForm] = await connection.execute(
      "SELECT id FROM document_forms WHERE name = ? AND graduate_category = ?",
      [form.name, form.category]
    );

    let formId = null;
    if (existingForm.length > 0) {
      formId = existingForm[0].id;
      console.log(`Form '${form.name}' already exists (ID: ${formId})`);
    } else {
      const [insertForm] = await connection.execute(
        `INSERT INTO document_forms (name, document_type_id, graduate_category, form_schema, instructions, is_active) 
         VALUES (?, ?, ?, ?, ?, true)`,
        [form.name, docTypeId, form.category, defaultSchema, form.instructions]
      );
      formId = insertForm.insertId;
      console.log(`Inserted form '${form.name}' (ID: ${formId})`);
    }

    // 5. Seed pricing rules for each form
    const pricingRules = [
      { method: "email", fee: 2000.00 },
      { method: "pickup", fee: 1000.00 },
      { method: "courier_local", fee: 5000.00 },
      { method: "courier_international", fee: 25000.00 }
    ];

    for (const rule of pricingRules) {
      const [existingRule] = await connection.execute(
        "SELECT id FROM document_pricing_rules WHERE form_id = ? AND delivery_method = ?",
        [formId, rule.method]
      );

      if (existingRule.length > 0) {
        // Update fee
        await connection.execute(
          "UPDATE document_pricing_rules SET fee_amount = ?, settlement_account_id = ? WHERE id = ?",
          [rule.fee.toFixed(2), settlementAccountId, existingRule[0].id]
        );
      } else {
        await connection.execute(
          `INSERT INTO document_pricing_rules (form_id, delivery_method, fee_amount, settlement_account_id) 
           VALUES (?, ?, ?, ?)`,
          [formId, rule.method, rule.fee.toFixed(2), settlementAccountId]
        );
      }
    }
    console.log(`Configured standard pricing rules for form ID ${formId}`);
  }
}

async function run() {
  const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";
  const parsedUrl = new URL(baseUri);
  
  for (const dbName of dbs) {
    try {
      const connection = await mysql.createConnection({
        host: parsedUrl.hostname,
        port: parsedUrl.port || 3306,
        user: parsedUrl.username,
        password: parsedUrl.password,
        database: dbName
      });

      await seedDatabase(dbName, connection);

      await connection.end();
      console.log(`Successfully completed seeding for ${dbName}`);
    } catch (err) {
      console.error(`Failed to seed database ${dbName}:`, err.message);
    }
  }
}

run();
