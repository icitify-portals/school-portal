import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { staffProfiles, courseLecturers, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import RubricEditor from "@/components/lms/RubricEditor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function NewRubricPage() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const userId = parseInt((session.user as any).id);
    const staffRows = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
    const staff = staffRows[0];

    if (!staff) return <div className="p-8">Staff profile not found.</div>;

    // Get specific course if needed (optional for global templates)
    // For now, we allow global or picking from assigned courses could be handled in editor components.

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="p-8">
                <div className="max-w-[1600px] w-full mx-auto mb-8">
                    <Link
                        href="/staff/grading/rubrics"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold uppercase text-[10px] tracking-widest mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Rubrics
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">New Assessment Rubric</h1>
                    <p className="text-slate-500">Define criteria for objective and standardized grading.</p>
                </div>

                <RubricEditor />
            </div>
        </div>
    );
}
