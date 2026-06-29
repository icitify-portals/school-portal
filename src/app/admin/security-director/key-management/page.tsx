// @ts-expect-error - TS2305: Auto-suppressed for build
import { getAuthUser } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import KeyManagementClient from "./KeyManagementClient";
import { getKeysAction } from "@/actions/security-keys";
import { hasPermission, hasRole } from "@/lib/rbac";

export default async function KeyManagementPage() {
    const user = await getAuthUser();
    if (!user) redirect("/login");

    const authorized = await hasPermission("security.keys.manage") || await hasRole(["admin", "superadmin", "security", "Security Officer"]);
    if (!authorized) redirect("/dashboard");

    const res = await getKeysAction();
    const keys = res.keys || [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Key Management System</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Issue and receive physical keys securely via barcode scanning.
                </p>
            </div>

            <KeyManagementClient initialKeys={keys} />
        </div>
    );
}
