import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";
const databases = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

async function run() {
  for (const dbName of databases) {
    console.log(`Migrating database: ${dbName}...`);
    try {
      const parsedUrl = new URL(baseUri);
      parsedUrl.pathname = `/${dbName}`;
      const connection = await mysql.createConnection(parsedUrl.toString());

      try {
        // Check if slot column already exists
        const [rows] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cms_menus' AND COLUMN_NAME = 'slot'`,
          [dbName]
        );

        if (rows.length === 0) {
          console.log(`Adding columns 'slot' and 'menu_style' to cms_menus table in ${dbName}...`);
          await connection.execute(`
            ALTER TABLE cms_menus 
            ADD COLUMN slot VARCHAR(50) NOT NULL DEFAULT 'primary',
            ADD COLUMN menu_style VARCHAR(50) NOT NULL DEFAULT 'dropdown'
          `);
          console.log(`Columns added successfully in ${dbName}!`);
        } else {
          console.log(`Columns 'slot' and 'menu_style' already exist in cms_menus table in ${dbName}. Skipping.`);
        }
      } catch (e) {
        console.error(`Error migrating cms_menus table in ${dbName}:`, e.message);
      } finally {
        await connection.end();
      }
    } catch (err) {
      console.error(`Failed to connect to database ${dbName}:`, err.message);
    }
  }
}

run();
