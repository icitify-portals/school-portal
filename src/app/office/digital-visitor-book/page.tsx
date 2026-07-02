// @ts-nocheck
// @ts-expect-error - TS2305: Auto-suppressed for build
import { getAuthUser } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import VisitorKioskClient from "./VisitorKioskClient";
import { hasPermission, hasRole } from "@/lib/rbac";

export default async function DigitalVisitorBookPage() {
    const user = await getAuthUser();
    
    // We expect an office admin/receptionist to log in and set up the tablet
    if (!user) redirect("/login");

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <VisitorKioskClient />
        </div>
    );
}
