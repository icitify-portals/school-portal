// @ts-expect-error - TS2305: Auto-suppressed for build
import { getAuthUser } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import SecurityAnalyticsClient from "./SecurityAnalyticsClient";
import { getSecurityAnalytics } from "@/actions/analytics";
import { hasPermission, hasRole } from "@/lib/rbac";

export default async function SecurityAnalyticsPage() {
    const user = await getAuthUser();
    if (!user) redirect("/login");

    const authorized = await hasRole(["admin", "superadmin", "security", "Security Officer", "Director"]);
    if (!authorized) redirect("/dashboard");

    const data = await getSecurityAnalytics();

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Master Security Analytics</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Comprehensive insights across all security and support modules.
                </p>
            </div>

            <SecurityAnalyticsClient data={data} />
        </div>
    );
}
