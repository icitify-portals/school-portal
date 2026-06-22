const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const dbs = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

async function check() {
  const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";
  const parsedUrl = new URL(baseUri);
  
  for (const dbName of dbs) {
    console.log(`\n=== Database: ${dbName} ===`);
    try {
      const conn = await mysql.createConnection({
        host: parsedUrl.hostname,
        port: parsedUrl.port || 3306,
        user: parsedUrl.username,
        password: parsedUrl.password,
        database: dbName
      });

      const [tables] = await conn.execute("SHOW TABLES LIKE 'settlement_accounts'");
      if (tables.length > 0) {
        console.log("settlement_accounts exists.");
        const [desc] = await conn.execute("DESCRIBE settlement_accounts");
        console.log("settlement_accounts schema:");
        console.table(desc);
      } else {
        console.log("settlement_accounts DOES NOT EXIST.");
      }

      const [rules] = await conn.execute("SHOW TABLES LIKE 'document_pricing_rules'");
      console.log("document_pricing_rules exists?", rules.length > 0);

      await conn.end();
    } catch (e) {
      console.error(e.message);
    }
  }
}

check();
