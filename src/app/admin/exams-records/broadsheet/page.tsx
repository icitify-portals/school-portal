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
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
          <div className="max-w-[1600px] w-full mx-auto space-y-8">
            <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="w-12 h-12 text-blue-400" />
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                Senate Broadsheet
                            </h1>
                        </div>
                        <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                            Compile and review comprehensive class results for official Senate approval.
                        </p>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex gap-3 items-center backdrop-blur-sm">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">{errorMsg}</span>
                </div>
            )}

            <div className="bg-white/60 backdrop-blur-3xl p-6 rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                <BroadsheetViewer 
                    groups={groups} 
                    sessions={sessions} 
                    initialData={broadsheetData} 
                    currentFilters={{ groupId, sessionId, semester }}
                />
            </div>
          </div>
        </div>
    );
}
