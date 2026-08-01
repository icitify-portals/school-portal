import { db } from './src/db/db';
import { paystackDeveloperFees } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { verifyDeveloperFee } from './src/actions/paystack-developer-subscription';

async function run() {
    const pendingFees = await db.select().from(paystackDeveloperFees).where(eq(paystackDeveloperFees.status, 'pending'));
    console.log(`Found ${pendingFees.length} pending transactions. Verifying...`);
    
    let verifiedCount = 0;
    
    for (const fee of pendingFees) {
        if (!fee.reference) continue;
        console.log(`Verifying ${fee.reference}...`);
        try {
            const result = await verifyDeveloperFee(fee.reference);
            if (result.success) {
                console.log(`✅ ${fee.reference} was successfully verified and updated to PAID.`);
                verifiedCount++;
            } else {
                console.log(`❌ ${fee.reference}: ${result.error}`);
            }
        } catch (e: any) {
            console.log(`⚠️ Error verifying ${fee.reference}: ${e.message}`);
        }
    }
    
    console.log(`\nFinished. ${verifiedCount} transactions were synced and updated.`);
    process.exit(0);
}

run();
