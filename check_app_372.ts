import { db } from './src/db';
import { admissionApplicationsV2 } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function checkApp() {
    try {
        const result = await db.select().from(admissionApplicationsV2).where(eq(admissionApplicationsV2.id, 372));
        if (result.length === 0) {
            console.log('App not found');
            process.exit(0);
        }
        
        const app = result[0];
        console.log('Template ID:', app.templateId);
        
        const appData = JSON.parse(app.data as string);
        console.log('Data keys:', Object.keys(appData));
        
        const photo = appData['Passport Photograph'] || appData['Passport Photo'] || appData['Passport'] || appData['Photo'];
        console.log('Photo exists?', !!photo);
        if (photo) {
            console.log('Photo starts with:', typeof photo === 'string' ? photo.substring(0, 50) : 'Not a string');
            console.log('Photo length:', photo.length);
        }
        
        const sig = appData['Signature'] || appData['Applicant Signature'] || appData['Student Signature'];
        console.log('Signature exists?', !!sig);
        if (sig) {
            console.log('Signature starts with:', typeof sig === 'string' ? sig.substring(0, 50) : 'Not a string');
            console.log('Signature length:', sig.length);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkApp();
