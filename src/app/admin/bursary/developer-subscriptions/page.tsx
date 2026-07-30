import { getUnpaidSubscriptions } from "@/actions/developer-subscriptions";
import BursarSubscriptionTable from "./BursarSubscriptionTable";
import { db } from "@/db/db";
import { paystackDeveloperFees, admissionApplicationsV2, users } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { TransactionsTable } from "@/app/admin/system/developer-fees/transactions/TransactionsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
export const dynamic = "force-dynamic";

export default async function DeveloperSubscriptionsBursaryPage() {
    const subscriptions = await getUnpaidSubscriptions();

    // Fetch all developer fee transactions
    const fees = await db.select()
        .from(paystackDeveloperFees)
        .orderBy(desc(paystackDeveloperFees.createdAt));

    // Gather applicant IDs from admission_form fees
    const appIdsToFetch = new Set<number>();
    for (const f of fees) {
        if (f.type === 'admission_form' && f.identifier) {
            const parsed = parseInt(f.identifier);
            if (!isNaN(parsed)) {
                appIdsToFetch.add(parsed);
            }
        }
    }

    // Fetch applicant details
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

    // Attach applicant data
    const enrichedFees = fees.map(f => {
        let applicant = null;
        if (f.type === 'admission_form' && f.identifier) {
            applicant = applicantMap.get(parseInt(f.identifier));
        }
        return {
            ...f,
            applicant
        };
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Subscriptions & Fees</h1>
                <p className="text-muted-foreground mt-2">
                    Review outstanding platform subscription fees on behalf of enrolled students and track all paid Paystack processing fees.
                </p>
            </div>

            <Tabs defaultValue="unpaid" className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1 rounded-xl">
                    <TabsTrigger value="unpaid" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Outstanding (Bulk Settlement)
                    </TabsTrigger>
                    <TabsTrigger value="paid" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Paid Transactions History
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
            </Tabs>
        </div>
    );
}
