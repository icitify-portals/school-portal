import { getScreeningApplicants } from "@/actions/admin-admission";
import { FileText } from "lucide-react";
import ScreeningConsole from "./ScreeningConsole";

export const dynamic = "force-dynamic";

export default async function AdminScreeningPage() {
    const { success, exercises, applicants, error } = await getScreeningApplicants();

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">

                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-600/30 to-cyan-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-12 h-12 text-teal-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    Post-UTME Screening
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Upload Mathematics and English Language entrance exam scores. Applicants at or above
                                their exercise&apos;s cut-off are automatically offered admission.
                            </p>
                        </div>
                    </div>
                </div>

                {success && exercises && applicants ? (
                    <ScreeningConsole exercises={exercises} applicants={applicants} />
                ) : (
                    <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold">
                        Error: {error || "Failed to load screening data"}
                    </div>
                )}

            </div>
        </div>
    );
}
