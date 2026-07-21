import { db } from "@/db/db";
import { paystackDeveloperFees, admissionApplicationsV2, users } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { TransactionsTable } from "./TransactionsTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function DeveloperFeeTransactionsPage() {
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
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4 mb-4">
                <Link href="/admin/system/developer-fees" className="text-slate-500 hover:text-slate-900 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Developer / Processing Fees</h1>
                    <p className="text-muted-foreground mt-2">
                        View and re-query Paystack subscription fees and processing payments.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <TransactionsTable transactions={enrichedFees} />
                </CardContent>
            </Card>
        </div>
    );
}
