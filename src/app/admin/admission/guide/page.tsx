import Link from "next/link";
import { UserPlus, Settings, CheckCircle2, AlertTriangle, FileText, Upload, Settings2, Trash2, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdmissionGuidePage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-12 pb-20 selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="bg-slate-950 p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <UserPlus className="w-48 h-48 text-indigo-300" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">
                            Admission Module Guide
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl relative z-10">
                            A comprehensive manual for managing applications, validating admission payments, handling applicant queries, and resolving portal issues.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Notice */}
                        <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-200 flex gap-4">
                            <Settings className="w-8 h-8 text-indigo-500 shrink-0" />
                            <div>
                                <h3 className="font-bold text-indigo-900 mb-1">Administrative Privileges Required</h3>
                                <p className="text-indigo-800/80 font-medium text-sm leading-relaxed">
                                    The Admission Module requires Admission Officer, Registrar, or Super Admin privileges. Any data modification, such as payment reversals or bulk deletion, directly affects applicant portal access.
                                </p>
                            </div>
                        </div>

                        {/* Step 1 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">1</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Monitoring Applications (V2)</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Track, review, and print submitted admission applications using the centralized V2 dashboard.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Navigate to <strong>Applications (V2)</strong>.</li>
                                    <li>Use the search bar to find applicants by Form Number, Name, or Email.</li>
                                    <li>Click on any applicant to view their complete profile, O-level results, and uploaded documents.</li>
                                    <li>Click <strong>Print Form</strong> to generate a standardized one-page summary of their application.</li>
                                </ul>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <Search className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">The application grid automatically indicates whether an applicant has completed their form or if it is still pending submission.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">2</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Managing Admission Payments</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Resolve payment disputes, confirm successful transactions, and handle manual transaction reversals.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Manual Update:</strong> If an applicant paid via a gateway but their portal hasn't reflected it due to a network drop, you can verify their receipt and manually mark their transaction as successful on the Admission Payments page.</p>
                                    </div>
                                    <div className="flex items-start gap-3 mt-2">
                                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Reversing Transactions:</strong> If an applicant mistakenly paid twice, or you accidentally approved the wrong record, use the <strong>Reverse Transaction</strong> button. This will revert the applicant's status to pending and they will not be able to submit the form under that receipt.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">3</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Bulk Deletion & Cleanup</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Periodically clear out "Unnamed Candidate" entries or duplicated incomplete applications to maintain a clean database.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Navigate to <strong>Admission Payments</strong>.</li>
                                    <li>Use the checkboxes on the left side of the table to select multiple applications.</li>
                                    <li>Alternatively, use the master checkbox in the table header to select all entries on the current page.</li>
                                    <li>Click the red <strong>Delete Selected</strong> button at the top right of the table.</li>
                                </ul>
                                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
                                    <Trash2 className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-rose-800">Warning: Bulk deletion is permanent. Do not delete successful transactions or submitted applications unless absolutely necessary.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">4</div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Form Builder & Requirements</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Customize the application form fields and define strict admission requirements for different programmes.
                                </p>
                                <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <Settings2 className="w-6 h-6 text-indigo-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 mb-1">Form Builder</h4>
                                        <p className="text-xs text-slate-500">Toggle sections on or off (e.g. disabling UTME upload for postgraduate forms) using the dynamic form builder.</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <FileText className="w-6 h-6 text-emerald-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 mb-1">Programme Requirements</h4>
                                        <p className="text-xs text-slate-500">Define the mandatory O-level subjects (e.g. English, Math) required for specific departments before candidates can apply.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
