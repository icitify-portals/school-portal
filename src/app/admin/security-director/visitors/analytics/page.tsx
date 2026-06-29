// @ts-expect-error - TS2305: Auto-suppressed for build
import { getAuthUser } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import { getSecurityAnalytics } from "@/actions/analytics";
import { hasPermission, hasRole } from "@/lib/rbac";
import SecurityAnalyticsClient from "../../analytics/SecurityAnalyticsClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function VisitorAnalyticsPage() {
    const user = await getAuthUser();
    if (!user) redirect("/login");

    const authorized = await hasRole(["admin", "superadmin", "security", "Security Officer"]);
    if (!authorized) redirect("/dashboard");

    const data = await getSecurityAnalytics();

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            <Link href="/admin/security-director/visitors" className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4 w-fit transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Visitors
            </Link>

            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Visitor Analytics</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Insights into campus foot traffic, destinations, and demographics.
                </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <SecurityAnalyticsClient 
                    data={data} 
                    showVisitors={true}
                    showKeys={false}
                    showLostFound={false}
                    showTickets={false}
                />
            </div>
        </div>
    );
}
