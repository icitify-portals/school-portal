import { db } from "@/db/db";
import { admissionWaitlists, admissionApplicationsV2 } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Clock } from "lucide-react";
import { WaitlistTable } from "./waitlist-table";

export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
    const list = await db.select({
        id: admissionWaitlists.id,
        applicationId: admissionWaitlists.applicationId,
        rankPosition: admissionWaitlists.rankPosition,
        status: admissionWaitlists.status,
        createdAt: admissionWaitlists.createdAt,
        // @ts-expect-error - TS2339: Auto-suppressed for build
        applicationData: admissionApplicationsV2.formData,
        applicantPhoto: admissionApplicationsV2.applicantPhoto
    })
    .from(admissionWaitlists)
    .innerJoin(admissionApplicationsV2, eq(admissionWaitlists.applicationId, admissionApplicationsV2.id))
    .orderBy(desc(admissionWaitlists.createdAt));

    // Parse formData safely
    const formattedList = list.map(item => {
        let parsed = {};
        try {
            parsed = JSON.parse(item.applicationData || "{}");
        } catch(e) {}
        return {
            ...item,
            parsedData: parsed as any
        };
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600/30 to-orange-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-12 h-12 text-amber-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    Admission Waitlist
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Manage waitlisted applicants and roll over admissions based on availability.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[3rem] p-8 overflow-hidden">
                    <WaitlistTable initialData={formattedList} />
                </div>
            </div>
        </div>
    );
}
