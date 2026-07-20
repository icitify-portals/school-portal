import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { paystackDeveloperFees, admissionApplicationsV2, admissionFormTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Verify webhook signature
        const signature = request.headers.get('x-paystack-signature');
        if (PAYSTACK_SECRET && signature) {
            const crypto = await import('crypto');
            const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(JSON.stringify(body)).digest('hex');
            if (hash !== signature) {
                return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
            }
        }

        const event = body.event;
        const data = body.data;

        if (event === 'charge.success' && data?.reference) {
            const reference = data.reference;

            // Find the pending developer fee record
            const [feeRecord] = await db.select().from(paystackDeveloperFees)
                .where(eq(paystackDeveloperFees.reference, reference))
                .limit(1);

            if (feeRecord && feeRecord.status !== 'paid') {
                // Update the fee record
                await db.update(paystackDeveloperFees)
                    .set({ status: 'paid', paidAt: new Date() })
                    .where(eq(paystackDeveloperFees.reference, reference));

                // If this is an admission processing fee, update the application
                if (feeRecord.type === 'admission_form') {
                    const applicationId = parseInt(feeRecord.identifier);
                    if (!isNaN(applicationId)) {
                        await db.update(admissionApplicationsV2)
                            .set({ processingFeeStatus: 'paid', processingFeeReference: reference })
                            .where(eq(admissionApplicationsV2.id, applicationId));

                        // Fetch applicant name
                        const { users } = await import('@/db/schema');
                        const [app] = await db.select().from(admissionApplicationsV2).where(eq(admissionApplicationsV2.id, applicationId)).limit(1);
                        let payerName = "Applicant";
                        if (app && app.applicantId) {
                            const [user] = await db.select().from(users).where(eq(users.id, app.applicantId)).limit(1);
                            if (user) payerName = `${user.firstName} ${user.surname}`;
                        }

                        // Send Receipt
                        const { NotificationService } = await import('@/services/NotificationService');
                        await NotificationService.sendPaymentReceiptEmail(feeRecord.email, {
                            reference: reference,
                            date: new Date().toLocaleDateString(),
                            amount: Number(feeRecord.amount),
                            purpose: "Admission Application Form Fee",
                            payerName: payerName,
                            payerEmail: feeRecord.email,
                            type: 'admission',
                            additionalInfo: {
                                "Application ID": feeRecord.identifier
                            }
                        });
                    }
                }

                console.log(`Paystack webhook: fee ${reference} confirmed as paid`);
            }
        }

        return NextResponse.json({ message: 'Webhook received' });
    } catch (error) {
        console.error('Paystack webhook error:', error);
        return NextResponse.json({ message: 'Error processing webhook' }, { status: 500 });
    }
}
