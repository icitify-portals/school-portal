import Link from "next/link";
import { ArrowLeft, Users, LogIn, Wallet, BookOpen, Printer } from "lucide-react";

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
                            Welcome back! Follow these steps to navigate the new student portal, pay your tuition fees via your wallet, and register for your courses.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Step 1 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">1</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Portal Login</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Login to your dashboard using your Matriculation Number. If this is your first time logging into the new portal, use your Matriculation Number as your password as well, after which you will be prompted to change it.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <LogIn className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">
                                        Having trouble? Use the 'Forgot Password' link to reset your credentials via your registered email address.
                                    </p>
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Fund Your Wallet & Pay Fees</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    The new portal utilizes a secure wallet system. To pay your school fees or any other structured invoice:
                                </p>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Navigate to 'Wallet' in your dashboard.
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Top up your balance via card or bank transfer.
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Go to 'Invoices' and select 'Pay from Wallet' to clear your session fees.
                                    </li>
                                </ul>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <Wallet className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">Please note that you will be financially locked from course registration until your session invoices are cleared.</p>
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Course Registration</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Once your fees are paid, navigate to the 'Course Registration' module. Select the appropriate semester, and add your core and elective courses.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <BookOpen className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">Make sure to confirm your course list with your Head of Department or Course Adviser before submitting.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">4</div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Print Necessary Slips</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    After completing payment and course registration, ensure you print out your Official Receipts and Course Registration Slip for signing.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <Printer className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">Keep these slips safe as they may be required for exams or clearances.</p>
                                </div>
                            </div>
                        </div>

                        {/* Features & Support */}
                        <div className="pt-12 border-t border-slate-100 mt-12">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8 text-center">Need Help?</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100">
                                    <h3 className="text-xl font-bold text-emerald-900 mb-3">Open a Support Ticket</h3>
                                    <p className="text-emerald-800/80 font-medium leading-relaxed text-sm mb-6">
                                        Having trouble paying a fee or registering a course? Don't stress. You can now open a support ticket directly from your dashboard! Describe your issue, and our support team will resolve it quickly without you needing to visit the administrative block.
                                    </p>
                                </div>
                                <div className="p-8 rounded-3xl bg-indigo-50 border border-indigo-100">
                                    <h3 className="text-xl font-bold text-indigo-900 mb-3">Digital Academic Registry</h3>
                                    <p className="text-indigo-800/80 font-medium leading-relaxed text-sm mb-6">
                                        Check your session results, track your CGPA, and request official transcripts straight from the portal. The new system is designed to give you complete digital access to your academic records.
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
