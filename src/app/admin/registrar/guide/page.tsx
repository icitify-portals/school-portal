import Link from "next/link";
import { Award, ShieldAlert, GraduationCap, Gavel, Users, FileText, CheckCircle2, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default function RegistrarGuidePage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-12 pb-20 selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="bg-slate-950 p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Award className="w-48 h-48 text-indigo-300" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">
                            Registrar Module Guide
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl relative z-10">
                            A comprehensive manual for managing graduations, student clearance, Senate conduct cases, grievances, and alumni records.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Notice */}
                        <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200 flex gap-4">
                            <ShieldAlert className="w-8 h-8 text-rose-500 shrink-0" />
                            <div>
                                <h3 className="font-bold text-rose-900 mb-1">High-Level Administrative Authority</h3>
                                <p className="text-rose-800/80 font-medium text-sm leading-relaxed">
                                    The Registrar Module governs the legal and official academic standing of students. Actions taken here—such as rustication, expulsion, or graduation approvals—permanently alter student records and access rights.
                                </p>
                            </div>
                        </div>

                        {/* Step 1 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">1</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Graduation & Final Clearance</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Manage the final exit procedures for students who have completed their academic requirements.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Navigate to <strong>Graduation & Clearance</strong>.</li>
                                    <li>Review pending clearance requests from final-year students.</li>
                                    <li>Verify that all academic (CGPA &gt;= 1.0), library, and bursary debts have been settled.</li>
                                    <li>Approve the clearance to generate their final statement of result.</li>
                                </ul>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <GraduationCap className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">Once a student is officially cleared, the system will automatically queue them for the <strong>Alumni Transition</strong> phase.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">2</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Senate & Disciplinary Conduct</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Record and enforce disciplinary actions decided by the Senate or Student Disciplinary Committee (SDC).
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Navigate to <strong>Senate & Conduct</strong>.</li>
                                    <li>Select the student in question using their Matriculation Number.</li>
                                    <li>Log the disciplinary case (e.g. Examination Malpractice, Gross Misconduct).</li>
                                    <li>Apply the penalty: <strong>Warning</strong>, <strong>Rustication</strong> (temporary suspension), or <strong>Expulsion</strong>.</li>
                                </ul>
                                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
                                    <Gavel className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-rose-800">Applying Rustication or Expulsion will immediately lock the student's portal, preventing them from registering for courses or making payments.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">3</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Grievances & Appeals</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Handle official petitions, result remark requests, and disciplinary appeals from students.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <History className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Reviewing Cases:</strong> You can assign grievances to specific committees for investigation and track the progress of the resolution.</p>
                                    </div>
                                    <div className="flex items-start gap-3 mt-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Resolution:</strong> Once the Senate approves a remark or pardons a rusticated student, update the status here to automatically restore their portal access.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">4</div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Alumni Transition</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Officially convert graduated students into Alumni.
                                </p>
                                <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <Users className="w-6 h-6 text-indigo-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 mb-1">Batch Conversion</h4>
                                        <p className="text-xs text-slate-500">Convert entire cohorts of cleared final-year students into the Alumni database. This changes their portal dashboard.</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <FileText className="w-6 h-6 text-emerald-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 mb-1">Certificate Issuance</h4>
                                        <p className="text-xs text-slate-500">Log when physical certificates are collected by Alumni to maintain a permanent digital record of issuance.</p>
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
