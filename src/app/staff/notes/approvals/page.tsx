import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { staffProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import SupervisorApprovals from "@/components/lms/SupervisorApprovals";

export default async function NoteApprovalsPage() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);
    const [staff] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
    
    if (!staff) return <div className="p-8">Staff profile not found.</div>;

    // In a real system, we'd check if they are actually a supervisor.
    // Here we'll pass their staff ID as supervisorId.

    return (
        <div className="min-h-screen bg-slate-50/30 pb-20">
            <SupervisorApprovals supervisorId={staff.id} />
        </div>
    );
}
