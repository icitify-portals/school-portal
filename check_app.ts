import { db } from './src/db/db.ts';
import { users, admissionApplicationsV2 } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function checkApp() {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.email, 'admin@icitifysolution.com')
        });

        if (!user) {
            console.log('User admin@icitifysolution.com not found');
            process.exit(0);
        }

        console.log('User:', { id: user.id, name: user.name, role: user.role });

        const apps = await db.select().from(admissionApplicationsV2).where(eq(admissionApplicationsV2.applicantId, user.id));
        
        console.log(`Found ${apps.length} applications.`);

        for (const app of apps) {
            console.log('----------------------------');
            console.log('App ID:', app.id);
            console.log('Template ID:', app.templateId);
            console.log('Status:', app.status);
            console.log('Payment Status:', app.paymentStatus);
            console.log('Processing Fee Status:', app.processingFeeStatus);
            console.log('NIN:', app.nin);
            console.log('Applied At:', app.appliedAt);
            console.log('Data length:', app.data ? app.data.length : 0);
            if (app.data) {
                try {
                    const parsedData = JSON.parse(app.data);
                    console.log('Data keys:', Object.keys(parsedData));
                } catch(e) {
                    console.log('Error parsing data:', e.message);
                }
            }
        }

    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

checkApp();
