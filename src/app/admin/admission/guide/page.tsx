import Link from "next/link";
import {
    UserPlus,
    Settings,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Upload,
    Settings2,
    Trash2,
    Search,
    ArrowLeft,
    ShieldCheck,
    CreditCard,
    Receipt,
    Megaphone,
    Layers,
    UserCheck,
    PhoneCall,
    BookOpen
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdmissionGuidePage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pt-8 pb-20 selection:bg-emerald-500/30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                
                {/* Top Navigation */}
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href="/admin/admission"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-sm font-semibold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Admission Dashboard
                    </Link>
                </div>

                <div className="bg-[#1e293b] rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden">
                    
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 sm:p-12 relative overflow-hidden border-b border-white/10">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <UserCheck className="w-56 h-56 text-emerald-300" />
                        </div>
                        <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-xs uppercase tracking-wider font-semibold">
                            Admission Officer Operational Manual
                        </span>
                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3 mb-3 relative z-10">
                            Admission Officer Step-by-Step Guide
                        </h1>
                        <p className="text-slate-300 font-medium text-base sm:text-lg max-w-3xl relative z-10">
                            A complete manual for managing applications, enforcing separate fee payments, configuring admission templates, validating candidate credentials, and issuing communications.
                        </p>
                    </div>

                    <div className="p-6 sm:p-12 space-y-12">

                        {/* Security Notice */}
                        <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex gap-4">
                            <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-emerald-300 text-base mb-1">Officer Privileges & Policy Enforcement</h3>
                                <p className="text-emerald-200/80 font-medium text-xs sm:text-sm leading-relaxed">
                                    As an Admission Officer, you manage applicant records, payment validations, form templates, and direct communications. All action changes and record updates are recorded in the system audit logs.
                                </p>
                            </div>
                        </div>

                        {/* STEP 1: Application Tracking & Management (V2 Dashboard) */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-xl shrink-0">
                                    1
                                </div>
                                <div className="w-0.5 h-full bg-white/10 my-2"></div>
                            </div>
                            <div className="pb-4 flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                                    Monitoring Applications (V2 Dashboard)
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    Track, filter, and inspect submitted and draft applications using the centralized V2 dashboard (`/admin/admission/v2`).
                                </p>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-xs sm:text-sm text-slate-300 font-medium">
                                    <p>1. Navigate to <strong>Applications (V2)</strong> (`/admin/admission/v2`).</p>
                                    <p>2. Filter applications by <strong>Level</strong> (ND vs HND), <strong>Mode</strong> (Full-Time vs Part-Time), or <strong>Status</strong> (Submitted vs Pending).</p>
                                    <p>3. Search by Form Number, Name, Email, or JAMB Registration Number.</p>
                                    <p>4. Click on any applicant to review their complete profile, uploaded passport, O-Level sittings, and NIN verification details.</p>
                                    <p>5. Click <strong>Print Form</strong> to generate a standardized one-page summary for physical verification or filing.</p>
                                </div>
                            </div>
                        </div>

                        {/* STEP 2: Strict Application & Processing Fee Enforcement */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-xl shrink-0">
                                    2
                                </div>
                                <div className="w-0.5 h-full bg-white/10 my-2"></div>
                            </div>
                            <div className="pb-4 flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                                    Strict Application & Processing Fee Separation
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    Understand how the portal enforces separate fees before applicants are allowed to submit.
                                </p>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                        <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                                            <CreditCard className="w-4 h-4" /> Two-Stage Fee Verification
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Payment of the <strong>Application Fee</strong> alone only changes `paymentStatus` to `paid` (the application remains in `draft`).
                                        </p>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            The candidate MUST ALSO pay the <strong>Processing Fee</strong> (`processingFeeStatus === 'paid'`). The portal will not generate a Form Number or allow final submission until BOTH fees are confirmed `'paid'`.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                        <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
                                            <Receipt className="w-4 h-4" /> Payment Confirmations & Reversals
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Navigate to <strong>Admission Payments</strong> (`/admin/admission/payments`).
                                        </p>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Use <strong>Confirm Application / Processing Payment</strong> to manually clear bank drop issues, or use <strong>Reverse Payment</strong> if a duplicate receipt was applied accidentally.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 3: Form Builder, Templates & Requirements */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-xl shrink-0">
                                    3
                                </div>
                                <div className="w-0.5 h-full bg-white/10 my-2"></div>
                            </div>
                            <div className="pb-4 flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                                    Form Builder, Exercise Templates & Fee Setup
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    Configure admission exercise templates and compulsory form fields.
                                </p>

                                <div className="space-y-3">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                                            <Settings2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-0.5">Form Builder & Template Setup</h4>
                                            <p className="text-xs text-slate-400">
                                                Go to <strong>Form Builder</strong> (`/admin/admission/forms`). Edit admission exercise templates (e.g. *2026/2027 Application Exercise (ND)*) to specify Application Fee, Processing Fee, Acceptance Fee, and linked Bursary Fee Structures.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 shrink-0">
                                            <PhoneCall className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-0.5">Compulsory Contact & Phone Fields</h4>
                                            <p className="text-xs text-slate-400">
                                                The Biodata Phone Number, Next of Kin, and Sponsor phone fields are marked as compulsory (`is_required = 1`) across both ND and HND templates so no applicant can submit without reachable contact information.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-0.5">Programme Requirements</h4>
                                            <p className="text-xs text-slate-400">
                                                Under <strong>Programme Requirements</strong> (`/admin/admission/validation/requirements`), set mandatory O-Level subject prerequisites (e.g. English, Mathematics, Physics) per department before candidate screening.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 4: Candidate Validation, Screening & Bulk Cleanup */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-xl shrink-0">
                                    4
                                </div>
                                <div className="w-0.5 h-full bg-white/10 my-2"></div>
                            </div>
                            <div className="pb-4 flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                                    Screening, Candidate Validation & Bulk Cleanup
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    Screen candidates based on JAMB and O-level criteria, and maintain database cleanliness.
                                </p>
                                
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-xs sm:text-sm text-slate-300 font-medium">
                                    <p>1. Navigate to <strong>Screening & Scoring</strong> (`/admin/admission/screening`) to evaluate candidates against cut-off marks.</p>
                                    <p>2. Under <strong>Admission Payments</strong> (`/admin/admission/payments`), use table checkboxes to select abandoned draft entries or "Unnamed Candidate" records.</p>
                                    <p>3. Click <strong>Delete Selected</strong> to purge selected test/draft entries.</p>
                                </div>
                            </div>
                        </div>

                        {/* STEP 5: Officer Communications */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-xl shrink-0">
                                    5
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                                    Officer Communications & Direct Messaging
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    Send broadcasts or direct messages to candidates and colleagues.
                                </p>

                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs text-slate-300">
                                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                                        <Megaphone className="w-4 h-4" /> Communication Options
                                    </div>
                                    <p>• <strong>Broadcast Communications (`/admin/communications/broadcasts`):</strong> Send announcement alerts to all candidates or specific applicant groups.</p>
                                    <p>• <strong>Broadcast Center (`/admin/announcements`):</strong> Publish official news items on the portal bulletin.</p>
                                    <p>• <strong>Direct Messages (`/communications`):</strong> Message applicants individually to resolve application or document issues.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
