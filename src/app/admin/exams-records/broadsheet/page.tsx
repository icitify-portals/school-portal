import { db } from "@/db/db";
import { studentGroups, academicSessions } from "@/db/schema";
import { getBroadsheetAction } from "@/actions/broadsheet";
import { Target, AlertTriangle } from "lucide-react";
import { BroadsheetViewer } from "./broadsheet-viewer";

export const dynamic = "force-dynamic";

export default async function BroadsheetPage({
    searchParams
}: {
    searchParams: { group?: string, session?: string, semester?: string }
}) {
    // Fetch dropdown data
    const groups = await db.select().from(studentGroups);
    const sessions = await db.select().from(academicSessions).orderBy(academicSessions.id);

    // Parse search params
    const groupId = searchParams.group ? parseInt(searchParams.group) : undefined;
    const sessionId = searchParams.session ? parseInt(searchParams.session) : undefined;
    const semester = searchParams.semester ? parseInt(searchParams.semester) : undefined;

    let broadsheetData = null;
    let errorMsg = null;

    if (groupId && sessionId && semester) {
        const res = await getBroadsheetAction(groupId, sessionId, semester);
        if (res.success) {
            broadsheetData = res.data;
        } else {
            errorMsg = res.error;
        }
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Target className="w-8 h-8 text-indigo-600" />
                        Senate Broadsheet
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">
                        Compile and review comprehensive class results for official Senate approval.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex gap-3 items-center">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">{errorMsg}</span>
                </div>
            )}

            <BroadsheetViewer 
                groups={groups} 
                sessions={sessions} 
                initialData={broadsheetData} 
                currentFilters={{ groupId, sessionId, semester }}
            />
        </div>
    );
}
