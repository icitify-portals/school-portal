import { db } from '../../src/db';
import { sql } from 'drizzle-orm';

async function createSystemSettingsTable() {
    console.log('Creating system_settings table...');

    try {
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value TEXT,
        description TEXT,
        is_sensitive BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ system_settings table created successfully!');

        // Seed default module settings
        const defaultSettings = [
            { key: 'module.live_classes', value: 'true', description: 'Enable Live Classes module' },
            { key: 'module.hostels', value: 'true', description: 'Enable Hostels module' },
            { key: 'module.results', value: 'true', description: 'Enable Results module' },
            { key: 'module.admission', value: 'true', description: 'Enable Admission module' },
            { key: 'module.finance', value: 'true', description: 'Enable Finance module' },
            { key: 'module.hr', value: 'true', description: 'Enable HR module' },
            { key: 'module.library', value: 'true', description: 'Enable Library module' },
        ];

        for (const setting of defaultSettings) {
            await db.execute(sql`
        INSERT IGNORE INTO system_settings (setting_key, setting_value, description)
        VALUES (${setting.key}, ${setting.value}, ${setting.description})
      `);
        }
        console.log('✅ Default module settings seeded successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
    process.exit(0);
}

createSystemSettingsTable();
