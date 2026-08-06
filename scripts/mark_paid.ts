import { db } from "../src/db/db";
import { admissionApplicationsV2 } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Updating Fathia's payment status...");
    
    // Application ID 66 (Fathia)
    await db.update(admissionApplicationsV2)
        .set({ 
            paymentStatus: 'paid',
            processingFeeStatus: 'paid',
            paymentReference: 'PREVIOUSLY-PAID-' + Date.now(),
            processingFeeReference: 'PREVIOUSLY-PAID-DEV-' + Date.now()
        })
        .where(eq(admissionApplicationsV2.id, 66));
        
    console.log("Fathia's application is now fully marked as PAID.");
    
    // Let's also check Pelumi Oyedeji (Application ID 179) just in case she needs it too
    const pelumiApp = await db.select().from(admissionApplicationsV2).where(eq(admissionApplicationsV2.id, 179));
    if (pelumiApp[0] && (pelumiApp[0].paymentStatus !== 'paid' || pelumiApp[0].processingFeeStatus !== 'paid')) {
        console.log("Updating Pelumi's payment status as well...");
        await db.update(admissionApplicationsV2)
            .set({ 
                paymentStatus: 'paid',
                processingFeeStatus: 'paid',
                paymentReference: pelumiApp[0].paymentReference || 'PREVIOUSLY-PAID-' + Date.now(),
                processingFeeReference: pelumiApp[0].processingFeeReference || 'PREVIOUSLY-PAID-DEV-' + Date.now()
            })
            .where(eq(admissionApplicationsV2.id, 179));
        console.log("Pelumi's application is now fully marked as PAID.");
    }

    process.exit(0);
}

run().catch(console.error);
