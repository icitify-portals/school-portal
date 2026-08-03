import { createConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function migrate() {
    console.log("Starting legacy applicant migration...");

    // Connect to both databases
    const oldDb = await createConnection('mysql://root:@127.0.0.1:3306/oldfsstable');
    const newDb = await createConnection(process.env.DATABASE_URL || 'mysql://portal_user:PASSWORD_HERE@127.0.0.1:3307/school_portal');

    try {
        // 1. Fetch the legacy applicants (excluding 2025/2026 session)
        const [legacyPayments] = await oldDb.execute(`
            SELECT fullname, email, jamb_reg, amount, reference, payment_date, status, session
            FROM adm_payment 
            WHERE amount IN ('20500', '10500', 20500, 10500)
            AND status = 'successful'
            AND session != '2025/2026'
        `);

        console.log(`Found ${(legacyPayments as any[]).length} legacy records to migrate.`);

        // 2. Fetch the active admission template ID from the new DB
        // We assume there's at least one active template
        const [templates] = await newDb.execute(`
            SELECT id FROM admission_form_templates 
            WHERE is_active = 1
            ORDER BY id DESC LIMIT 1
        `);
        const templateId = (templates as any[])[0]?.id || 1; // fallback to 1 if none found

        const defaultPassword = await bcrypt.hash('password123', 10);

        let successCount = 0;

        for (const record of (legacyPayments as any[])) {
            const { fullname, email, reference, session } = record;
            
            // Clean names
            const nameParts = fullname.trim().split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';
            
            // Check if user already exists in the new DB
            const [existingUsers] = await newDb.execute(`
                SELECT id FROM users WHERE email = ?
            `, [email]);

            let userId;
            
            if ((existingUsers as any[]).length > 0) {
                userId = (existingUsers as any[])[0].id;
                console.log(`User ${email} already exists (ID: ${userId})`);
            } else {
                // Insert into users
                const [userResult] = await newDb.execute(`
                    INSERT INTO users (name, first_name, surname, email, password, role, status)
                    VALUES (?, ?, ?, ?, ?, 'applicant', 'active')
                `, [fullname.trim(), firstName, surname, email, defaultPassword]);
                
                userId = (userResult as any).insertId;
                console.log(`Created new user ${email} (ID: ${userId})`);
            }

            // Check if application already exists
            const [existingApps] = await newDb.execute(`
                SELECT id FROM admission_applications_v2 WHERE applicant_id = ?
            `, [userId]);

            if ((existingApps as any[]).length > 0) {
                console.log(`Application for user ${userId} already exists.`);
                continue;
            }

            // Create application
            const legacyNote = JSON.stringify({
                _legacyNote: "Migrated from Legacy Application",
                _legacySession: session
            });

            await newDb.execute(`
                INSERT INTO admission_applications_v2 
                (template_id, applicant_id, status, payment_status, payment_reference, data)
                VALUES (?, ?, 'paid', 'paid', ?, ?)
            `, [
                templateId, 
                userId, 
                'LEGACY_' + reference,
                legacyNote
            ]);

            console.log(`Migrated application for user ${email}`);
            successCount++;
        }

        console.log(`\nMigration completed! Successfully migrated ${successCount} applicants.`);

    } catch (err: any) {
        console.error("Migration failed:", err.message);
    } finally {
        await oldDb.end();
        await newDb.end();
    }
}

migrate();
