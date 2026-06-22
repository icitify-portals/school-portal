const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const dbs = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

const sqls = [
  // 1. document_types
  `CREATE TABLE IF NOT EXISTS \`document_types\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`code\` varchar(50) NOT NULL,
    \`is_active\` boolean NOT NULL DEFAULT true,
    CONSTRAINT \`document_types_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`document_types_code_unique\` UNIQUE(\`code\`)
  );`,

  // 2. document_forms
  `CREATE TABLE IF NOT EXISTS \`document_forms\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`document_type_id\` int NOT NULL,
    \`graduate_category\` enum('university_undergrad','university_postgrad','polytechnic_ond','polytechnic_hnd') NOT NULL,
    \`form_schema\` text NOT NULL,
    \`instructions\` text,
    \`is_active\` boolean NOT NULL DEFAULT true,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \`document_forms_id\` PRIMARY KEY(\`id\`),
    FOREIGN KEY (\`document_type_id\`) REFERENCES \`document_types\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
  );`,

  // 3. document_pricing_rules
  `CREATE TABLE IF NOT EXISTS \`document_pricing_rules\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`form_id\` int NOT NULL,
    \`delivery_method\` enum('email','courier_local','courier_international','pickup') NOT NULL,
    \`fee_amount\` decimal(12,2) NOT NULL DEFAULT '0.00',
    \`settlement_account_id\` int NOT NULL,
    \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`document_pricing_rules_id\` PRIMARY KEY(\`id\`),
    FOREIGN KEY (\`form_id\`) REFERENCES \`document_forms\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (\`settlement_account_id\`) REFERENCES \`settlement_accounts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
  );`,

  // 4. graduate_profiles
  `CREATE TABLE IF NOT EXISTS \`graduate_profiles\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`user_id\` int NOT NULL,
    \`student_id\` int NOT NULL,
    \`graduate_category\` enum('university_undergrad','university_postgrad','polytechnic_ond','polytechnic_hnd') NOT NULL,
    \`programme_id\` int NOT NULL,
    \`graduation_year\` int NOT NULL,
    \`graduation_session_id\` int NOT NULL,
    \`cgpa\` decimal(4,2) NOT NULL,
    \`class_of_degree\` varchar(100) NOT NULL,
    \`total_semesters_spent\` int NOT NULL,
    \`is_cleared\` boolean NOT NULL DEFAULT false,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \`graduate_profiles_id\` PRIMARY KEY(\`id\`),
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (\`programme_id\`) REFERENCES \`programmes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (\`graduation_session_id\`) REFERENCES \`academic_sessions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
  );`,

  // 5. graduate_document_applications
  `CREATE TABLE IF NOT EXISTS \`graduate_document_applications\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`user_id\` int NOT NULL,
    \`graduate_profile_id\` int NOT NULL,
    \`form_id\` int NOT NULL,
    \`form_data\` text NOT NULL,
    \`delivery_method\` enum('email','courier_local','courier_international','pickup') NOT NULL,
    \`courier_address\` text,
    \`contact_email\` varchar(150) NOT NULL,
    \`contact_phone\` varchar(20),
    \`payment_status\` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
    \`transaction_id\` int,
    \`amount_paid\` decimal(12,2) DEFAULT '0.00',
    \`registry_status\` enum('pending','reviewing','processing','dispatched','completed','rejected') NOT NULL DEFAULT 'pending',
    \`rejection_reason\` text,
    \`registry_comments\` text,
    \`assigned_staff_id\` int,
    \`processed_file_url\` text,
    \`tracking_number\` varchar(100),
    \`dispatched_at\` timestamp NULL,
    \`completed_at\` timestamp NULL,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \`graduate_document_applications_id\` PRIMARY KEY(\`id\`),
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (\`graduate_profile_id\`) REFERENCES \`graduate_profiles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (\`form_id\`) REFERENCES \`document_forms\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (\`transaction_id\`) REFERENCES \`transactions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (\`assigned_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
  );`
];

async function run() {
  const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";
  const parsedUrl = new URL(baseUri);
  
  for (const dbName of dbs) {
    console.log(`\n=== Migrating database: ${dbName} ===`);
    try {
      const connection = await mysql.createConnection({
        host: parsedUrl.hostname,
        port: parsedUrl.port || 3306,
        user: parsedUrl.username,
        password: parsedUrl.password,
        database: dbName
      });

      for (let i = 0; i < sqls.length; i++) {
        try {
          await connection.execute(sqls[i]);
          console.log(`Query ${i + 1} succeeded.`);
        } catch (queryError) {
          console.error(`Query ${i + 1} failed:`, queryError.message);
        }
      }

      await connection.end();
      console.log(`Database ${dbName} successfully updated.`);
    } catch (dbError) {
      console.error(`Failed to connect/migrate database ${dbName}:`, dbError.message);
    }
  }
}

run();
