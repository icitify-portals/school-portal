import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserTicketsAction } from "@/actions/support-tickets";
import SupportTicketsClient from "./SupportTicketsClient";

export const dynamic = "force-dynamic";

export default async function StudentSupportTicketsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const res = await getUserTicketsAction();
    const tickets = res.success ? res.data : [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Help & Support</h1>
                    <p className="text-slate-500 mt-1">Submit support requests and track active issues with portal administrators.</p>
                </div>
            </div>
            <SupportTicketsClient initialTickets={tickets as any} session={session} />
        </div>
    );
}
