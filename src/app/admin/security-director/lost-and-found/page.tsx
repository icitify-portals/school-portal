// @ts-expect-error - TS2305: Auto-suppressed for build
import { getAuthUser } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import SecurityLostFoundClient from "./SecurityLostFoundClient";
import { getLostAndFoundItemsAction } from "@/actions/security-lost-found";
import { hasPermission, hasRole } from "@/lib/rbac";

export default async function AdminLostAndFoundPage() {
    const user = await getAuthUser();
    if (!user) redirect("/login");

    const authorized = await hasPermission("security.lostfound.manage") || await hasRole(["admin", "superadmin", "security"]);
    if (!authorized) redirect("/dashboard");

    const res = await getLostAndFoundItemsAction();
    const items = res.items || [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Lost & Found Management</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Log found items, manage student reports, and process claims securely.
                </p>
            </div>

            <SecurityLostFoundClient initialItems={items} />
        </div>
    );
}
