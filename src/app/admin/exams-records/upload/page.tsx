import { db } from "@/db/db";
import { courses, academicSessions } from "@/db/schema";
import { UploadCloud } from "lucide-react";
import { ResultUploader } from "./result-uploader";

export const dynamic = "force-dynamic";

export default async function BulkUploadPage() {
    const courseList = await db.select().from(courses);
    const sessionsList = await db.select().from(academicSessions).orderBy(academicSessions.id);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <UploadCloud className="w-8 h-8 text-emerald-600" />
                        Bulk Result Upload
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">
                        Upload continuous assessment (CA) and Exam scores via CSV format for batch processing.
                    </p>
                </div>
            </div>

            <ResultUploader courses={courseList} sessions={sessionsList} />
        </div>
    );
}
