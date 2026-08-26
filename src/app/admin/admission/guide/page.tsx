import Link from "next/link";
import {
    UserPlus,
    AlertTriangle,
    CheckCircle2,
    FileText,
    Upload,
    Settings2,
    ArrowLeft,
    ShieldCheck,
    CreditCard,
    Receipt,
    Megaphone,
    UserCheck,
    BookOpen,
    Calculator,
    TrendingUp,
    UserX,
    GraduationCap,
    Ban,
    Lock,
    PlayCircle,
    ClipboardCheck
} from "lucide-react";

export const dynamic = "force-dynamic";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-6">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-xl shrink-0">
                    {n}
                </div>
                <div className="w-0.5 h-full bg-white/10 my-2"></div>
            </div>
            <div className="pb-4 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">{title}</h2>
                {children}
            </div>
        </div>
    );
}

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
                    <Link
                        href="/admin/admission/screening"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-colors"
                    >
                        <ClipboardCheck className="w-4 h-4" /> Open Screening Console
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
                            Post-UTME Screening &amp; Admission Guide
                        </h1>
                        <p className="text-slate-300 font-medium text-base sm:text-lg max-w-3xl relative z-10">
                            The complete step-by-step process from received applications to admission offers, fee payments and matriculation.
                            Selection uses ONE criterion only: the entrance examination result in Mathematics and English Language.
                        </p>
                    </div>

                    <div className="p-6 sm:p-12 space-y-12">

                        {/* The Rule */}
                        <div className="p-6 bg-teal-500/10 rounded-2xl border border-teal-500/20 flex gap-4">
                            <Calculator className="w-7 h-7 text-teal-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-teal-300 text-base mb-1">The Selection Rule</h3>
                                <p className="text-teal-200/80 font-medium text-xs sm:text-sm leading-relaxed mb-2">
                                    Screening % = (Mathematics + English) ÷ 200 × 100.
                                    An applicant is offered admission automatically when their percentage is at or above their
                                    exercise&apos;s cut-off AND they attended the examination.
                                </p>
                                <ul className="text-teal-200/70 text-xs space-y-1 font-medium">
                                    <li>• Each exercise keeps its <strong>own cut-off</strong> — ND and HND can differ (default 40%, changeable anytime).</li>
                                    <li>• Absent candidates are <strong>never</strong> offered, regardless of score.</li>
                                    <li>• Applicants who have paid their acceptance fee are permanently locked.</li>
                                </ul>
                            </div>
                        </div>

                        {/* STEP 1 */}
                        <Step n={1} title="Review Applications & Confirm Fees">
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Work from the Applications dashboard (`/admin/admission/v2`). This page is for reviewing, verifying
                                and managing applications — <strong className="text-white">admission decisions are NOT made here anymore</strong>.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                                        <FileText className="w-4 h-4" /> What you do here
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Filter by exercise / level / mode · inspect profiles, passports and documents · confirm or reverse
                                        Application &amp; Processing Fee payments (`/admin/admission/payments`) for bank-drop cases · export
                                        applicant files (PDF / ZIP).
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                                        <Ban className="w-4 h-4" /> What is disabled here
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Admit / Reject buttons have been removed — the system blocks any manual status change to
                                        admitted/rejected outside the Screening page. Once a candidate pays the acceptance fee,
                                        their record cannot be altered at all.
                                    </p>
                                </div>
                            </div>
                        </Step>

                        {/* STEP 2 */}
                        <Step n={2} title="Mark Examination Attendance (do this BEFORE uploading scores)">
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                For a physical exam, mark candidates against your attendance register. Attendance gates every
                                offer, so it must be settled first. Two places, same switch:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                                        <UserCheck className="w-4 h-4" /> Selective marking — V2 page
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Tick specific rows on `/admin/admission/v2` → <strong>Mark Present</strong> or{" "}
                                        <strong>Mark Absent</strong>. Use this for individual corrections (e.g. latecomers who sat
                                        the exam, or absentees after an All Present sweep).
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
                                        <UserX className="w-4 h-4" /> Sweeping — Screening page
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        On `/admin/admission/screening`, pick the exercise tab → <strong>All Present</strong> flips every
                                        pending candidate to present; <strong>Sweep Absents</strong> marks everyone still pending as absent
                                        once the exam window closes.
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                                <AlertTriangleIcon />
                                <p className="text-amber-200/80 text-xs font-medium leading-relaxed">
                                    <strong className="text-amber-300">Order matters:</strong> candidates whose attendance is still
                                    &quot;pending&quot; when scores are uploaded WILL be offered admission if they pass. Settle attendance first.
                                    If you get it wrong anyway, correct it and press Run Selection — offers re-evaluate automatically.
                                </p>
                            </div>
                        </Step>

                        {/* STEP 3 */}
                        <Step n={3} title="Upload Scores & Issue Offers Automatically">
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                All scoring happens on the <strong>Post-UTME Screening Console</strong> (`/admin/admission/screening`).
                            </p>

                            <div className="space-y-3">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                                        <Upload className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">Bulk Excel upload (recommended)</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Download the template → fill <strong>Form Number, Mathematics (0–100), English Language (0–100)</strong> →
                                            upload → review the validation preview (blank cells and duplicates are rejected) → submit.
                                            Every valid row saves instantly in one batch; the report shows how many offers were issued
                                            and lists any absentees who were scored but not offered.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 shrink-0">
                                        <ClipboardCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">Single entry &amp; corrections</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Click <strong>Score</strong> on any row to enter/correct one candidate. The panel shows the live
                                            total (/200), percentage and whether saving will produce an offer. Saving also triggers the
                                            congratulations email + notification immediately for new offers.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                                        <Megaphone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">What newly-admitted applicants receive</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            A congratulation email, an in-app portal notification and a WhatsApp message — sent exactly
                                            once per offer. Re-running the selection never re-sends them.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Step>

                        {/* STEP 4 */}
                        <Step n={4} title="Cut-offs & Run Selection">
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Cut-off marks are per exercise and can be moved up or down at any time — performance-based
                                admission without touching code.
                            </p>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-xs sm:text-sm text-slate-300 font-medium">
                                <p>1. Select an exercise tab on the Screening console → click the cut-off percentage under the tab → enter a new value → Save.</p>
                                <p>2. Press <strong>Run Selection</strong>: every scored applicant is re-evaluated against the current cut-off.</p>
                                <p>3. The report shows Newly Offered / Confirmed / Revoked / Fee-Protected / Absent-Blocked counts.</p>
                                <p>4. Lowered the cut-off? New offers go out automatically. Raised it? Offers below the line are revoked — except anyone who already paid, and anyone you decided manually (marked <em>manual</em>).</p>
                            </div>
                        </Step>

                        {/* STEP 5 */}
                        <Step n={5} title="What Admitted Applicants Experience Next">
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                You don&apos;t need to do anything after the offer — the applicant drives these steps themselves
                                from their own portal, and each gate is enforced by the system.
                            </p>
                            <div className="space-y-2">
                                {[
                                    { icon: GraduationCap, title: "1. Offer", body: "Their dashboard shows a green Congratulations banner; the status page shows 'Provisional Admission Offered' with their screening score once results are released." },
                                    { icon: CreditCard, title: "2. Acceptance + ID Card fee", body: "One checkout: Acceptance Fee (ND ₦25,000 / HND ₦35,000) + ID Card Fee (₦2,000). Verified through alatpay before anything unlocks." },
                                    { icon: FileText, title: "3. Admission Letter unlocks", body: "Download/print becomes available, plus the post-admission document uploads (birth certificate, O-Level, JAMB)." },
                                    { icon: Receipt, title: "4. School Fees", body: "Tuition checkout opens only after acceptance is confirmed." },
                                    { icon: CheckCircle2, title: "5. Matriculation", body: "School-fees confirmation automatically generates the Matric Number and converts the applicant into a student." },
                                ].map((s, i, arr) => (
                                    <div key={s.title} className={`p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3 ${i === arr.length - 1 ? '' : ''}`}>
                                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                                            <s.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{s.title}</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">{s.body}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Step>

                        {/* STEP 6 */}
                        <Step n={6} title="Messaging Groups & Housekeeping">
                            <div className="space-y-3">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                                        <Megaphone className="w-4 h-4" /> Message Present / Absent / Offered
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        The Screening console has one-click shortcuts that open the broadcast composer pre-filtered to
                                        exactly that group (respecting the active exercise tab). Always check the audience count before sending.
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
                                        <Settings2 className="w-4 h-4" /> Exercise configuration
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Form Builder (`/admin/admission/forms`) controls each exercise&apos;s fees (application, processing,
                                        acceptance, ID card), cut-off default, dates and linked bursary fee structures. Changes apply to
                                        new activity immediately.
                                    </p>
                                </div>
                            </div>
                        </Step>

                        {/* Guard Rails */}
                        <div className="p-6 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex gap-4">
                            <ShieldCheck className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-rose-300 text-base mb-1">Guard Rails Worth Knowing</h3>
                                <ul className="text-rose-200/80 text-xs space-y-1.5 font-medium">
                                    <li>• <Lock className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />Acceptance-fee payers are frozen: scores cannot be changed, offers cannot be revoked, statuses cannot be edited anywhere.</li>
                                    <li>• Manual admits/rejects (from the scoring panel) are preserved when Run Selection executes.</li>
                                    <li>• Every decision is stamped <code className="bg-white/10 px-1 rounded">auto</code> or <code className="bg-white/10 px-1 rounded">manual</code> so audits show exactly how each outcome was reached.</li>
                                    <li>• The old admit buttons on the Applications pages were removed deliberately — offers exist only where scores meet cut-offs.</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function AlertTriangleIcon() {
    return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
}
