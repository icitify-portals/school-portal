import { getK12ReportData } from "@/actions/results";
import { getCurrentSession } from "@/actions/portal";
import { AlertCircle } from "lucide-react";
import ReportCardUI from "./ReportCardUI";

export default async function ChildReportCardPage({ params }: { params: { id: string } }) {
    const studentId = parseInt(params.id);
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
