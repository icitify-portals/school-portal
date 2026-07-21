import { getCrossTenantDeveloperRevenue } from "@/actions/developer-analytics";
import { db } from "@/db/db";
import { developerSubscriptionSettings } from "@/db/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, IndianRupee, Globe2, Activity } from "lucide-react";
import DeveloperFeeSettingsForm from "./DeveloperFeeSettingsForm";
import Link from "next/link";

export default async function DeveloperFeesPage() {
    const revenue = await getCrossTenantDeveloperRevenue();
    
    // Get current tenant settings
    const settings = await db.query.developerSubscriptionSettings.findFirst();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Master Overwatch: Developer Subscriptions</h1>
                    <p className="text-muted-foreground mt-2">
                        Track platform subscription revenue across all tenant databases and configure billing rules.
                    </p>
                </div>
                <Link 
                    href="/admin/system/developer-fees/transactions"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-900/90 h-10 px-4 py-2"
                >
                    View Transactions
                </Link>
            </div>

            {/* Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-sm font-medium">Total Global Revenue</CardTitle>
                        <Globe2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="text-2xl font-bold">₦{revenue.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Across all deployed portals</p>
                    </CardContent>
                </Card>
                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-sm font-medium">Outstanding Subscriptions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="text-2xl font-bold text-red-500">₦{revenue.totalUnpaid.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Pending bulk or individual payments</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tenant Breakdown */}
            <h2 className="text-xl font-semibold mt-8">Revenue by Tenant</h2>
            <div className="grid gap-4 md:grid-cols-3">
                {revenue.portals.map((p) => (
                    <Card key={p.name} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-500" />
                                {p.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className=" p-6">
                            <div className="flex justify-between items-center mt-4">
                                <span className="text-sm text-muted-foreground">Paid:</span>
                                <span className="font-bold text-green-600">₦{p.revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-muted-foreground">Unpaid:</span>
                                <span className="font-bold text-red-500">₦{p.unpaid.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Current Tenant Settings Form */}
            <h2 className="text-xl font-semibold mt-12">Current Tenant Rules ({process.env.NEXT_PUBLIC_TENANT_NAME || "FSS Portal"})</h2>
            <Card className="max-w-2xl border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle>Subscription Configuration</CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                    <DeveloperFeeSettingsForm initialData={settings} />
                </CardContent>
            </Card>
        </div>
    );
}
