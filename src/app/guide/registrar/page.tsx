import Link from "next/link";
import { ArrowLeft, UserCog, CheckCircle2, AlertTriangle, Settings, RefreshCcw, Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default function RegistrarMatriculationGuidePage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20 selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto px-4">
                <Link href="/admin/registrar/matriculation" className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Matriculation
                </Link>

                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="bg-slate-950 p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <UserCog className="w-48 h-48" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">
                            Matriculation Number Allocation Guide
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl relative z-10">
                            A comprehensive technical overview for the Registrar on how the system dynamically allocates, formats, and secures matriculation numbers.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Notice */}
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex gap-4">
                            <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                            <div>
                                <h3 className="font-bold text-amber-900 mb-1">Thread-Safe Transactions</h3>
                                <p className="text-amber-800/80 font-medium text-sm leading-relaxed">
                                    The allocation system guarantees that no two students will ever receive the same serial number simultaneously. All assignments run through an isolated database transaction to ensure sequence integrity.
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Configuration & Formatting</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Before any numbers are allocated, the system reads from the <strong>Matriculation Settings</strong>. This allows the format (e.g., <code>{`{DEPT_CODE}/{YEAR}/{SERIAL}`}</code>) to be customized globally or specifically overridden for a single Department, Faculty, or Unit.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <Settings className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">The priority sequence for applying format rules is: <strong>Department &rarr; Faculty &rarr; Unit &rarr; Global Default</strong>.</p>
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Dynamic Pattern Replacements</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Once the format rule is selected, the generation algorithm automatically identifies the student's program and study mode to substitute prefixes (e.g., prepending <code>DPP/</code> for Part-Time or <code>HND/</code> for HND students). It replaces all template placeholders (like <code>{`{YEAR}`}</code> and <code>{`{DEPT_CODE}`}</code>) with actual data.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">3</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Serial Incrementation & Padding</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    The system opens a secure sequence locker in the database for the active year and setting. It queries the last issued serial, increments it by 1, and applies zero-padding according to the configuration (e.g., turning a <code>1</code> into <code>001</code>).
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <RefreshCcw className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">This happens seamlessly and instantly, even when allocating thousands of numbers in a batch run.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">4</div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Allocation & Auditing</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    The Registrar can choose to assign a number manually to an individual student, or use the <strong>Batch Allocation</strong> feature to process all un-matriculated students simultaneously. 
                                </p>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                                    <Database className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-emerald-800">Every single allocation is logged securely in the <code>Matriculation Audit Log</code>. If a student is reassigned a number, their previous matriculation numbers are archived to preserve historical record integrity.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
