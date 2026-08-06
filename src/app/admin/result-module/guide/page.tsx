import Link from "next/link";
import { BookOpen, AlertTriangle, FileText, Upload, Calculator, FileCheck, Search, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ResultModuleGuidePage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-12 pb-20 selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="bg-slate-950 p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <BookOpen className="w-48 h-48 text-indigo-300" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">
                            Result Module Guide
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl relative z-10">
                            A comprehensive manual for result processing, grading scales, GPA calculation, and transcript generation.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Notice */}
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex gap-4">
                            <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                            <div>
                                <h3 className="font-bold text-amber-900 mb-1">Academic Integrity & Data Protection</h3>
                                <p className="text-amber-800/80 font-medium text-sm leading-relaxed">
                                    Only authorised Examination Officers, HODs, and Senate Members can upload or approve results. All result mutations (edits, deletions) are permanently logged in the audit trail.
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Configuring Grading Scales</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Before processing any results, ensure the grading scale is correctly defined for the academic session and programme level.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Navigate to <strong>Grading Scales</strong>.</li>
                                    <li>Define the grade boundaries (e.g. 70-100 = A, 60-69 = B).</li>
                                    <li>Assign the equivalent grade points (e.g. A = 5.0, B = 4.0).</li>
                                </ul>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <Calculator className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">The engine uses these scales automatically when computing Semester GPA and Cumulative CGPA.</p>
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Uploading Course Results</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Course Lecturers or Exam Officers can upload results in batches for specific courses.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Navigate to <strong>Result Module - Courses</strong>.</li>
                                    <li>Select the specific Course and Academic Session.</li>
                                    <li>You can either input scores manually into the grid, or <strong>Upload a CSV/Excel template</strong>.</li>
                                    <li>Input the Continuous Assessment (CA) and Examination scores; the system will automatically calculate the Total and Grade.</li>
                                </ul>
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                                    <Upload className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-indigo-800">Ensure your CSV format matches the standard template (Matric Number, CA Score, Exam Score) to prevent upload errors.</p>
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Batch Processing & Senate Approval</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    After raw scores are uploaded, results must go through the approval workflow before students can see them.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <Users className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Level 1 (HOD):</strong> Reviews the uploaded course results for anomalies and endorses them.</p>
                                    </div>
                                    <div className="flex items-start gap-3 mt-2">
                                        <FileCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Level 2 (Senate):</strong> Grants final approval. Once approved, the results are officially locked and published to the student portal.</p>
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Student Transcripts & Queries</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    You can view the comprehensive academic history of any student or manage transcript requests.
                                </p>
                                <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <Search className="w-6 h-6 text-indigo-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 mb-1">Student Results</h4>
                                        <p className="text-xs text-slate-500">Navigate to <strong>Result Module - Students</strong> to search for a matric number and view their full CGPA progression and outstanding courses.</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <FileText className="w-6 h-6 text-emerald-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 mb-1">Transcript Requests</h4>
                                        <p className="text-xs text-slate-500">Navigate to <strong>Transcript Requests</strong> to process, generate, and dispatch official electronic or physical transcripts for alumni.</p>
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
