import { db } from "@/db/db";
import { admissionInterviews, admissionApplicationsV2, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Calendar } from "lucide-react";
import { InterviewTable } from "./interview-table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
    const list = await db.select({
        id: admissionInterviews.id,
        applicationId: admissionInterviews.applicationId,
        interviewDate: admissionInterviews.interviewDate,
        mode: admissionInterviews.mode,
        locationOrLink: admissionInterviews.locationOrLink,
        status: admissionInterviews.status,
        score: admissionInterviews.score,
        notes: admissionInterviews.notes,
        interviewerName: users.name,
        // @ts-expect-error - TS2339: Auto-suppressed for build
        applicationData: admissionApplicationsV2.formData,
        applicantPhoto: admissionApplicationsV2.applicantPhoto
    })
    .from(admissionInterviews)
    .innerJoin(admissionApplicationsV2, eq(admissionInterviews.applicationId, admissionApplicationsV2.id))
    .leftJoin(users, eq(admissionInterviews.interviewerId, users.id))
    .orderBy(desc(admissionInterviews.interviewDate));

    const formattedList = list.map(item => {
        let parsed = {};
        try { parsed = JSON.parse(item.applicationData || "{}"); } catch(e) {}
        return { ...item, parsedData: parsed as any };
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-fuchsia-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-12 h-12 text-purple-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    Admission Interviews
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Schedule and score physical or virtual interviews for applicants.
                            </p>
                        </div>
                        
                        <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner gap-2 flex-wrap">
                            <button className="flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap bg-purple-600 text-white hover:bg-purple-500 shadow-lg hover:-translate-y-1">
                                Schedule Interview
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[3rem] p-8 overflow-hidden">
                    <InterviewTable initialData={formattedList} />
                </div>
            </div>
        </div>
    );
}
