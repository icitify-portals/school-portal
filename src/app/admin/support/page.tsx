import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission, hasRole } from "@/lib/rbac";
import { SupportTicketService } from "@/services/SupportTicketService";
import AdminSupportClient from "./AdminSupportClient";

export const dynamic = "force-dynamic";

export default async function AdminSupportInboxPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    // Verify support agent or IT Admin permissions
    const allowed = await hasPermission("support.tickets.view") || 
                    await hasRole("admin") || 
                    await hasRole("superadmin") || 
                    await hasRole("Support Agent") || 
                    await hasRole("Support Manager") ||
                    await hasRole("IT Admin");

    if (!allowed) {
        redirect("/");
    }

    // Load initial queue
    const tickets = await SupportTicketService.getHelpdeskTickets();
    const supportStaff = await SupportTicketService.getSupportStaff();
    const metrics = await SupportTicketService.getHelpdeskOverviewMetrics();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Helpdesk Support Console</h1>
                    <p className="text-slate-500 mt-1">Review active student issues, assign support agents, post replies, and update ticket states.</p>
                </div>
            </div>
            <AdminSupportClient 
                initialTickets={tickets as any} 
                supportStaff={supportStaff as any} 
                initialMetrics={metrics} 
                session={session} 
            />
        </div>
    );
}
