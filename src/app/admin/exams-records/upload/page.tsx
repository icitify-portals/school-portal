import { db } from "@/db/db";
import { courses, academicSessions } from "@/db/schema";
import { UploadCloud } from "lucide-react";
import { ResultUploader } from "./result-uploader";

export const dynamic = "force-dynamic";

export default async function BulkUploadPage() {
    const courseList = await db.select().from(courses);
    const sessionsList = await db.select().from(academicSessions).orderBy(academicSessions.id);

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
          <div className="max-w-[1600px] w-full mx-auto space-y-8">
            <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <UploadCloud className="w-12 h-12 text-emerald-400" />
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                Bulk Result Upload
                            </h1>
                        </div>
                        <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                            Upload continuous assessment (CA) and Exam scores via CSV format for batch processing.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-3xl p-6 rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                <ResultUploader courses={courseList} sessions={sessionsList} />
            </div>
          </div>
        </div>
    );
}
