import Link from "next/link";
import {
    BookOpen,
    AlertTriangle,
    FileText,
    Upload,
    Calculator,
    FileCheck,
    Search,
    Users,
    ToggleRight,
    Edit3,
    Trash2,
    CheckCircle2,
    ArrowLeft,
    Eye,
    EyeOff
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function ResultModuleGuidePage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pt-8 pb-20 selection:bg-violet-500/30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                
                {/* Top Navigation */}
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href="/admin/result-module"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-sm font-semibold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Result Module
                    </Link>
                </div>

                <div className="bg-[#1e293b] rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden">
                    
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 p-8 sm:p-12 relative overflow-hidden border-b border-white/10">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <BookOpen className="w-56 h-56 text-violet-300" />
                        </div>
                        <span className="px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 font-mono text-xs uppercase tracking-wider font-semibold">
                            Record Officer Operational Manual
                        </span>
                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3 mb-3 relative z-10">
                            Result Officer Step-by-Step Guide
                        </h1>
                        <p className="text-slate-300 font-medium text-base sm:text-lg max-w-3xl relative z-10">
                            Complete guide for uploading student scores, correcting mistaken entries, clearing test batches, and controlling result display on the student dashboard.
                        </p>
                    </div>

                    <div className="p-6 sm:p-12 space-y-12">

                        {/* Security & Audit Alert */}
                        <div className="p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex gap-4">
                            <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-amber-300 text-base mb-1">Academic Integrity & Data Protection</h3>
                                <p className="text-amber-200/80 font-medium text-xs sm:text-sm leading-relaxed">
                                    All result score additions, modifications, and deletions are strictly monitored and logged. Results remain in <strong>Draft Mode (Hidden from Students)</strong> until you explicitly flip the <strong>Student Dashboard Display Switch</strong> to ON.
                                </p>
                            </div>
                        </div>

                        {/* STEP 1: Creating/Opening Batches */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-black text-xl shrink-0">
                                    1
                                </div>
                                <div className="w-0.5 h-full bg-white/10 my-2"></div>
                            </div>
                            <div className="pb-4 flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                                    Create or Open a Result Batch
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    Results are processed in structured batches grouped by Academic Session and Semester.
                                </p>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-xs sm:text-sm text-slate-300 font-medium">
                                    <p>1. Navigate to <strong>Result Processing (Batches)</strong> (`/admin/result-module`).</p>
                                    <p>2. Click <strong>"+ Create New Result Batch"</strong>.</p>
                                    <p>3. Select the <strong>Academic Session</strong> (e.g., 2025/2026), <strong>Semester</strong> (e.g., First Semester), and <strong>Grading Scale</strong>.</p>
                                    <p>4. Click <strong>Create Batch</strong> to open the workspace.</p>
                                </div>
                            </div>
                        </div>

                        {/* STEP 2: Uploading Scores */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-black text-xl shrink-0">
                                    2
                                </div>
                                <div className="w-0.5 h-full bg-white/10 my-2"></div>
                            </div>
                            <div className="pb-4 flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                                    Uploading Course Results (Bulk CSV or Single Entry)
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    You can upload results in bulk via CSV or enter individual student records manually.
                                </p>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                        <div className="flex items-center gap-2 text-violet-300 font-bold text-sm">
                                            <Upload className="w-4 h-4" /> Option A: Bulk CSV Upload
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            Click <strong>Download Template</strong> to get the standard CSV layout. Format:
                                        </p>
                                        <p className="text-[11px] font-mono bg-slate-900 p-2 rounded border border-white/10 text-emerald-400">
                                            matric_number, CSC101, MTH101<br />
                                            180404022, 75, 82<br />
                                            180404023, 60, 71
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Upload the CSV. Enable <em>"Auto-create missing courses"</em> if any course code is new, then click <strong>Upload CSV Results</strong>.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                        <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                                            <Users className="w-4 h-4" /> Option B: Single Student Entry
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            Use the <strong>Single Student</strong> tab to search for a student by name or matric number.
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Select course, enter the score (0–100) and credit units, then click <strong>Save Results</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 3: Modifying & Correcting Erroneous Records */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-black text-xl shrink-0">
                                    3
                                </div>
                                <div className="w-0.5 h-full bg-white/10 my-2"></div>
                            </div>
                            <div className="pb-4 flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                                    Modifying & Correcting Mistaken Records
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    If a score or credit unit was uploaded mistakenly, you can edit or delete specific entries directly from the batch table.
                                </p>

                                <div className="space-y-3">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300 shrink-0">
                                            <Edit3 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-0.5">Edit Score / Credit Units</h4>
                                            <p className="text-xs text-slate-400">
                                                Click the <strong>Pencil (Edit Icon)</strong> next to any course result row. Enter the corrected score or credit units and click <strong>Save Changes</strong>. The grade and semester GPA will update automatically.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-red-500/20 text-red-300 shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-0.5">Delete Erroneous Single Record</h4>
                                            <p className="text-xs text-slate-400">
                                                Click the <strong>Trash Icon</strong> next to a specific course entry to delete a single mistaken record.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-0.5">Clear All Test / Sample Records</h4>
                                            <p className="text-xs text-slate-400">
                                                Click the <strong>Clear All Results</strong> amber button at the top header to wipe out sample or test records from the batch in one step.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 4: Controlling Display on Student Portal (The Switch Button) */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-xl shrink-0">
                                    4
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                                    Display Results to Student Portal (Switch Button)
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    Control when students can view their GP/CGPA and grades using the interactive toggle switch.
                                </p>

                                <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/30 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Toggle Switch State</p>
                                            <p className="text-base font-bold text-white flex items-center gap-2 mt-1">
                                                <ToggleRight className="w-5 h-5 text-emerald-400" /> Student Dashboard Display Switch
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                                            <Eye className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-mono font-bold text-emerald-300">ON = VISIBLE TO STUDENTS</span>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                            <p className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                                                <EyeOff className="w-3.5 h-3.5" /> OFF (HIDDEN / DRAFT)
                                            </p>
                                            <p className="text-slate-400">
                                                Results are held in draft mode. Students <strong>cannot</strong> see their grades or transcripts while you are uploading and making corrections.
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                            <p className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                                                <Eye className="w-3.5 h-3.5" /> ON (VISIBLE / PUBLISHED)
                                            </p>
                                            <p className="text-slate-400">
                                                Finalized state. Dragging the switch to ON generates official transcripts and displays grades live on the student portal.
                                            </p>
                                        </div>
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
