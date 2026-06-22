import { getK12ReportData } from "@/actions/results";
import { getCurrentSession } from "@/actions/portal";
import { AlertCircle } from "lucide-react";
import ReportCardUI from "./ReportCardUI";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { students, institutionalUnits } from "@/db/schema";
import { redirect } from "next/navigation";

export default async function ChildReportCardPage({ params }: { params: { id: string } }) {
    const studentId = parseInt(params.id);
    
    // Academic tier guard: redirect tertiary students to transcript
    const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    if (student && student.unitId) {
        const [unit] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.id, student.unitId)).limit(1);
        if (unit && unit.academicTier !== 'k12') {
            redirect(`/parent/child/${studentId}/transcript`);
        }
    }

    const activeSession = await getCurrentSession();
    
    if (!activeSession) return <div>No active session</div>;

    const term = activeSession.currentSemester || "1";
    const data = await getK12ReportData(studentId, activeSession.id, term);

    if (!data) {
        return (
            <div className="p-20 text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-slate-200 mx-auto" />
                <h2 className="text-2xl font-black text-slate-900 uppercase italic">Report Card Unavailable</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                    The report card for this term has not been finalized yet. Please check back after the assessment period.
                </p>
            </div>
        );
    }

    return <ReportCardUI data={data} />;
}
