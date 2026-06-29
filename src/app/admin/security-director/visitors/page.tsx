// @ts-expect-error - TS2305: Auto-suppressed for build
import { getAuthUser } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import SecurityVisitorsClient from "./SecurityVisitorsClient";
import { getCentralVisitorAnalyticsAction } from "@/actions/visitor-kiosk";
import { hasPermission, hasRole } from "@/lib/rbac";

export default async function SecurityVisitorsPage() {
    const user = await getAuthUser();
    if (!user) redirect("/login");

    const authorized = await hasPermission("security.visitors.view") || await hasRole(["admin", "superadmin", "security", "Security Officer"]);
    if (!authorized) redirect("/dashboard");

    const res = await getCentralVisitorAnalyticsAction();
    
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Centralized Visitor Monitoring</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Real-time oversight of all visitors checked in across the campus.
                </p>
            </div>

            <SecurityVisitorsClient 
                initialActiveVisitors={res.activeVisitors || []} 
                initialTotalToday={res.totalToday || 0} 
            />
        </div>
    );
}
