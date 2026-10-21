import Link from "next/link";
import { 
    ArrowLeft, 
    Users, 
    LogIn, 
    CreditCard, 
    BookOpen, 
    Printer, 
    Search, 
    KeyRound, 
    FileText, 
    HeartPulse, 
    ShieldCheck, 
    ArrowRight 
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function ReturningStudentsGuidePage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20 selection:bg-emerald-500/30">
            <div className="max-w-4xl mx-auto px-4">
                <Link href="/" className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
                </Link>

                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="bg-slate-950 p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Users className="w-48 h-48" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">
                            Returning Students Guide
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl relative z-10">
                            Welcome back to the new session! Follow this step-by-step walkthrough to activate your account, set your password, complete your mandatory clearance, pay your fees, and register for courses.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Step 1 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">1</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-md border border-indigo-100">Recommended First Step</span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Find Your Account & Set Password to <code className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xl">welcome123</code></h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    If this is your first time logging into the new portal or you are experiencing login issues, use the public <strong>Student Directory & Account Lookup</strong> tool to verify your correct department and reset your password.
                                </p>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Go to the <Link href="/student-lookup" className="text-indigo-600 underline font-bold">Find Account & Password Reset page</Link>.
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Search using your <strong>Matriculation Number</strong>, <strong>Full Name / Surname</strong>, or <strong>Email Address</strong>.
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Verify your details on your profile card, then click <strong>"Set Password to welcome123"</strong>.
                                    </li>
                                </ul>
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <Search className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                        <p className="text-xs font-medium text-indigo-900 leading-relaxed">
                                            This immediately unlocks your account, clears any temporary lockouts, and prepares it for login.
                                        </p>
                                    </div>
                                    <Link href="/student-lookup" className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
                                        Open Account Lookup <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">2</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8 flex-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Sign In & Set Your Private Password</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Navigate to the Portal Login page and sign in using your credentials:
                                </p>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> <strong>Username:</strong> Your Matriculation Number (or Registered Email).
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> <strong>Password:</strong> <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">welcome123</code> (or your existing password).
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> <strong>Compulsory Password Change:</strong> On first sign-in, the system will prompt you to set your own private, secure password before entering your dashboard.
                                    </li>
                                </ul>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <KeyRound className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <p className="text-xs font-medium text-slate-600">
                                        Choose a password with at least 8 characters including letters and numbers to protect your academic records.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">3</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8 flex-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Update Bio-data Dossier & Health Form</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Institutional compliance requires all returning students to keep their student profile and medical history up to date:
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-1">
                                            <FileText className="w-4 h-4 text-indigo-600" /> Student Dossier
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Verify your Next of Kin, Guardian phone numbers, contact address, and upload your recent passport photograph.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-1">
                                            <HeartPulse className="w-4 h-4 text-rose-600" /> Health & Medical Form
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Submit your medical profile, blood group, genotype, allergies, and emergency doctor contact for clinic clearance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">4</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8 flex-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Pay Structured Session Fee Invoices</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    All students have rigid structured fee invoices generated for their academic level (Tuition, Development, SUG, Incidental fees, etc.):
                                </p>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Navigate to <strong>Finance / Bills</strong> in your dashboard.
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Select your pending invoice and pay online via the integrated <strong>Remita or Paystack gateway</strong> (ATM Card, Bank Transfer, or USSD).
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Once payment is confirmed, your <strong>Financial Lock</strong> will automatically be released.
                                    </li>
                                </ul>
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                                    <CreditCard className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs font-medium text-amber-900">
                                        <strong>Important:</strong> Course registration remains locked until mandatory session fee invoices are cleared.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">5</div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Course Registration & Slip Printing</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Once financial clearance is complete, proceed to register your courses:
                                </p>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Navigate to <strong>Course Registration</strong> in the student menu.
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Select your current semester, review the core and elective courses, and click submit.
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Print your <strong>Official Course Registration Form</strong> and <strong>Payment Receipts</strong> for signing by your Department Head / Course Adviser.
                                    </li>
                                </ul>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <Printer className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-xs font-medium text-slate-600">Keep these slips safe as they are mandatory for exam hall entry and departmental clearances.</p>
                                </div>
                            </div>
                        </div>

                        {/* Support & Assistance */}
                        <div className="pt-12 border-t border-slate-100 mt-12">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8 text-center">Need Additional Support?</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100">
                                    <h3 className="text-xl font-bold text-emerald-900 mb-3">Open a Support Ticket</h3>
                                    <p className="text-emerald-800/80 font-medium leading-relaxed text-sm mb-6">
                                        Having trouble paying a fee or registering a course? You can open an official support ticket directly from your student dashboard to resolve it quickly with IT or Bursary.
                                    </p>
                                </div>
                                <div className="p-8 rounded-3xl bg-indigo-50 border border-indigo-100">
                                    <h3 className="text-xl font-bold text-indigo-900 mb-3">Official Academic Registry</h3>
                                    <p className="text-indigo-800/80 font-medium leading-relaxed text-sm mb-6">
                                        View past semester results, track your cumulative grade point average (CGPA), and request official transcripts straight from the portal at any time.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
