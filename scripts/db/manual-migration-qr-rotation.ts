import { db } from '../../src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('Adding QR rotation columns to lecture_sessions...');
    try {
        await db.execute(sql`
      ALTER TABLE lecture_sessions 
      ADD COLUMN previous_qr_token VARCHAR(255) DEFAULT NULL,
      ADD COLUMN qr_rotated_at TIMESTAMP NULL DEFAULT NULL
    `);
        console.log('✅ Columns added successfully!');
    } catch (e: any) {
        if (e.message?.includes('Duplicate column')) {
            console.log('Columns already exist, skipping.');
        } else {
            console.error('❌ Error:', e.message);
        }
    }
    process.exit(0);
}
migrate();
