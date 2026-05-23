import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function migrate() {
    if (!connectionString) {
        console.error("DATABASE_URL not found");
        return;
    }

    const connection = await mysql.createConnection(connectionString);
    console.log("Connected to MySQL...");

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        const statements = [
            `CREATE TABLE IF NOT EXISTS \`bursary_settings\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`key\` varchar(100) NOT NULL,
                \`value\` text NOT NULL,
                \`description\` text,
                CONSTRAINT \`bursary_settings_id\` PRIMARY KEY(\`id\`),
                CONSTRAINT \`bursary_settings_key_unique\` UNIQUE(\`key\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`chart_of_accounts\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`code\` varchar(20) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`category\` enum('asset','liability','equity','revenue','expense') NOT NULL,
                \`description\` text,
                \`parent_account_id\` int,
                \`is_active\` boolean DEFAULT true,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`chart_of_accounts_id\` PRIMARY KEY(\`id\`),
                CONSTRAINT \`chart_of_accounts_code_unique\` UNIQUE(\`code\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`vendors\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`contact_person\` varchar(255),
                \`email\` varchar(255),
                \`phone\` varchar(20),
                \`address\` text,
                \`tax_id\` varchar(50),
                \`bank_name\` varchar(255),
                \`account_number\` varchar(20),
                \`category\` varchar(100),
                \`is_active\` boolean DEFAULT true,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`vendors_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`fixed_assets\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`purchase_date\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`purchase_price\` decimal(12,2) NOT NULL,
                \`salvage_value\` decimal(12,2) DEFAULT '0.00',
                \`useful_life_years\` int NOT NULL,
                \`depreciation_method\` enum('straight_line','double_declining') DEFAULT 'straight_line',
                \`gl_account_id\` int,
                \`dep_account_id\` int,
                \`accum_dep_account_id\` int,
                \`status\` enum('active','disposed','fully_depreciated') DEFAULT 'active',
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`fixed_assets_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`budgets\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`department_id\` int NOT NULL,
                \`academic_year\` varchar(20) NOT NULL,
                \`category\` enum('operating','capital','personnel','research') DEFAULT 'operating',
                \`amount\` decimal(12,2) NOT NULL,
                \`status\` enum('draft','active','closed') DEFAULT 'active',
                \`notes\` text,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT \`budgets_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`general_ledger\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`transaction_date\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`account_id\` int NOT NULL,
                \`description\` text NOT NULL,
                \`debit\` decimal(12,2) DEFAULT '0.00',
                \`credit\` decimal(12,2) DEFAULT '0.00',
                \`reference\` varchar(100),
                \`batch_id\` varchar(100) NOT NULL,
                \`recorded_by\` int NOT NULL,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`general_ledger_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`depreciation_logs\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`asset_id\` int NOT NULL,
                \`amount\` decimal(12,2) NOT NULL,
                \`period\` varchar(20) NOT NULL,
                \`recorded_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`depreciation_logs_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`expenditure_requests\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`requested_by\` int NOT NULL,
                \`department_id\` int,
                \`faculty_id\` int,
                \`title\` varchar(255) NOT NULL,
                \`purpose\` text NOT NULL,
                \`amount\` decimal(12,2) NOT NULL,
                \`due_date\` timestamp NULL,
                \`attachment_path\` varchar(255),
                \`vendor_id\` int,
                \`po_number\` varchar(50),
                \`status\` enum('pending','approved','disbursed','rejected') DEFAULT 'pending',
                \`approved_by\` int,
                \`approved_at\` timestamp NULL,
                \`disbursed_at\` timestamp NULL,
                \`gl_account_id\` int,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`expenditure_requests_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`student_ledger\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`student_id\` int NOT NULL,
                \`transaction_id\` int,
                \`description\` varchar(255) NOT NULL,
                \`debit\` decimal(12,2) DEFAULT '0.00',
                \`credit\` decimal(12,2) DEFAULT '0.00',
                \`balance\` decimal(12,2) NOT NULL,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`student_ledger_id\` PRIMARY KEY(\`id\`)
            );`
        ];

        for (const sql of statements) {
            console.log(`Executing statement...`);
            await connection.query(sql);
        }

        console.log("Migration successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        await connection.end();
    }
}

migrate();
