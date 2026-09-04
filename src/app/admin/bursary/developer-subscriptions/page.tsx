import { getUnpaidSubscriptions } from "@/actions/developer-subscriptions";
import BursarSubscriptionTable from "./BursarSubscriptionTable";
import PaystackDbTable from "./PaystackDbTable";
import { db } from "@/db/db";
import { paystackDeveloperFees, admissionApplicationsV2, users } from "@/db/schema";
import { desc, eq, inArray, like } from "drizzle-orm";
import { TransactionsTable } from "@/app/admin/system/developer-fees/transactions/TransactionsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
export const dynamic = "force-dynamic";

export default async function DeveloperSubscriptionsBursaryPage() {
    const subscriptions = await getUnpaidSubscriptions();

    let enrichedFees: any[] = [];
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    if (PAYSTACK_SECRET) {
        try {
            const res = await fetch(`https://api.paystack.co/transaction?status=success&perPage=100`, {
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
                next: { revalidate: 60 }
            });
            const data = await res.json();
            if (data.status && data.data) {
                enrichedFees = data.data
                    .filter((tx: any) => tx.reference && tx.reference.startsWith('DEV-ADM-'))
                    .map((tx: any) => ({
                    id: tx.id,
                    reference: tx.reference,
                    type: tx.metadata?.type || 'Paystack Transaction',
                    identifier: tx.metadata?.identifier || tx.metadata?.["Application ID"] || '',
                    amount: tx.amount / 100,
                    status: 'paid', // filtered by success
                    createdAt: new Date(tx.created_at),
                    applicant: {
                        name: tx.customer?.first_name ? `${tx.customer.first_name} ${tx.customer.last_name || ''}` : tx.metadata?.payerName || tx.customer?.email || 'N/A',
                        email: tx.customer?.email || 'N/A'
                    }
                }));
            }
        } catch (e) {
            console.error("Failed to fetch paystack api", e);
        }
    }

    // Fallback to database if Paystack API fails or is unavailable
    if (enrichedFees.length === 0) {
        const fees = await db.select()
            .from(paystackDeveloperFees)
            .where(like(paystackDeveloperFees.reference, 'DEV-ADM-%'))
            .orderBy(desc(paystackDeveloperFees.createdAt));

        const appIdsToFetch = new Set<number>();
        for (const f of fees) {
            if (f.type === 'admission_form' && f.identifier) {
                const parsed = parseInt(f.identifier);
                if (!isNaN(parsed)) appIdsToFetch.add(parsed);
            }
        }

        const applicantMap = new Map<number, any>();
        if (appIdsToFetch.size > 0) {
            const apps = await db.select({
                id: admissionApplicationsV2.id,
                name: users.name,
                email: users.email
            })
            .from(admissionApplicationsV2)
            .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
            .where(inArray(admissionApplicationsV2.id, Array.from(appIdsToFetch)));

            apps.forEach(app => applicantMap.set(app.id, app));
        }

        enrichedFees = fees.map(f => {
            let applicant = null;
            if (f.type === 'admission_form' && f.identifier) {
                applicant = applicantMap.get(parseInt(f.identifier));
            }
            return {
                ...f,
                applicant
            };
        });
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Subscriptions & Paystack Payments</h1>
                <p className="text-muted-foreground mt-2">
                    Review outstanding platform subscription fees on behalf of enrolled students and track all successful payments made to Paystack till date.
                </p>
            </div>

            <Tabs defaultValue="unpaid" className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1 rounded-xl flex-wrap">
                    <TabsTrigger value="unpaid" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Outstanding (Bulk Settlement)
                    </TabsTrigger>
                    <TabsTrigger value="paid" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Paystack API History
                    </TabsTrigger>
                    <TabsTrigger value="db-paystack" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Paystack Local DB Transactions
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="unpaid" className="space-y-4">
                    <BursarSubscriptionTable initialData={subscriptions} />
                </TabsContent>

                <TabsContent value="paid" className="space-y-4">
                    <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <TransactionsTable transactions={enrichedFees} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="db-paystack" className="space-y-4">
                    <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <PaystackDbTable />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
