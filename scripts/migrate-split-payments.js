import mysql from 'mysql2/promise';

async function run() {
    console.log("Starting migration for split payments from scripts/...");
    
    // We will connect to school_portal database
    const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");
    
    try {
        // 1. Create settlement_accounts table
        console.log("Creating settlement_accounts table...");
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS settlement_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                account_name VARCHAR(255) NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                bank_code VARCHAR(10) NOT NULL,
                account_number VARCHAR(15) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("settlement_accounts table verified/created successfully.");

        // 2. Create gateway_subaccounts table
        console.log("Creating gateway_subaccounts table...");
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS gateway_subaccounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                settlement_account_id INT,
                gateway_name ENUM('paystack', 'flutterwave', 'remita') NOT NULL,
                gateway_subaccount_code VARCHAR(100) NOT NULL,
                FOREIGN KEY (settlement_account_id) REFERENCES settlement_accounts(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("gateway_subaccounts table verified/created successfully.");

        // 3. Add settlement_account_id to fee_items if not exists
        console.log("Checking fee_items columns...");
        const [columns] = await connection.execute("SHOW COLUMNS FROM fee_items");
        const hasColumn = columns.some(col => col.Field === 'settlement_account_id');
        
        if (!hasColumn) {
            console.log("Adding settlement_account_id column to fee_items table...");
            await connection.execute(`
                ALTER TABLE fee_items 
                ADD COLUMN settlement_account_id INT,
                ADD CONSTRAINT fk_fee_items_settlement_account FOREIGN KEY (settlement_account_id) REFERENCES settlement_accounts(id) ON DELETE SET NULL;
            `);
            console.log("settlement_account_id column added to fee_items.");
        } else {
            console.log("settlement_account_id column already exists in fee_items.");
        }

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.end();
    }
}

run();
