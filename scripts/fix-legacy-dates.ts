import { createConnection } from 'mysql2/promise';

async function fixDates() {
    const oldDb = await createConnection('mysql://root:@127.0.0.1:3306/oldfsstable');
    const newDb = await createConnection(process.env.DATABASE_URL || 'mysql://portal_user:PASSWORD_HERE@127.0.0.1:3307/school_portal');

    const [legacyPayments] = await oldDb.execute(`
        SELECT email, payment_date
        FROM adm_payment 
        WHERE amount IN ('20500', '10500', 20500, 10500)
        AND status = 'successful'
        AND session != '2025/2026'
    `);

    for (const record of (legacyPayments as any[])) {
        const { email, payment_date } = record;
        
        try {
            // Find user ID
            const [users] = await newDb.execute(`SELECT id FROM users WHERE email = ?`, [email]);
            if ((users as any[]).length === 0) continue;
            const userId = (users as any[])[0].id;

            // Update user creation date
            await newDb.execute(`UPDATE users SET created_at = ? WHERE id = ?`, [payment_date, userId]);

            // Update application applied_at date
            await newDb.execute(`UPDATE admission_applications_v2 SET applied_at = ? WHERE applicant_id = ?`, [payment_date, userId]);

            console.log(`Fixed dates for ${email} to ${payment_date}`);
        } catch (e) {
            console.error(`Failed to update dates for ${email}:`, e);
        }
    }
    
    console.log("Date fixing completed!");
    process.exit(0);
}

fixDates().catch(console.error);
