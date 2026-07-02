import Link from "next/link";
import { ArrowLeft, UserPlus, CheckCircle2, AlertTriangle, FileText, Upload, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ApplicantsGuidePage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20 selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto px-4">
                <Link href="/" className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
                </Link>

                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="bg-slate-950 p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <UserPlus className="w-48 h-48" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">
                            Applicants Guide
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl relative z-10">
                            Everything you need to know about purchasing an application form, fulfilling admission requirements, and checking your admission status.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Notice */}
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex gap-4">
                            <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                            <div>
                                <h3 className="font-bold text-amber-900 mb-1">Important Notice</h3>
                                <p className="text-amber-800/80 font-medium text-sm leading-relaxed">
                                    Registration and account creation are restricted exclusively to the admission process. You cannot create an account on the login page. All new students must begin their journey through the Application Portal below.
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Begin Application</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Visit the admission portal to start your application. You will be required to provide basic information, including your full name, email, and phone number. An application ID will be generated for you.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">Ensure you use a valid email address as your admission status and portal credentials will be sent there.</p>
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Pay Application Fee</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Once your application profile is created, you must pay the non-refundable application fee. Payments are processed securely via the integrated payment gateway.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <CreditCard className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">Upon successful payment, your application form will be immediately unlocked for completion.</p>
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Complete & Upload Documents</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Fill out your academic history, personal details, and upload requested documents (e.g., O-Level results, Birth Certificate, Passport Photograph).
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <Upload className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">Check document size limits. Files must typically be in PDF or JPG format and below 2MB.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">4</div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Submit & Await Admission</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Review all your entries carefully before clicking submit. Once submitted, you cannot edit your form. You can log back in at any time to check your admission status.
                                </p>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-emerald-800">If admitted, your official matriculation number will be generated and you will be transitioned into a Student account automatically!</p>
                                </div>
                            </div>
                        </div>

                        {/* Features & Support */}
                        <div className="pt-12 border-t border-slate-100 mt-12">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8 text-center">Need Help?</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-8 rounded-3xl bg-indigo-50 border border-indigo-100">
                                    <h3 className="text-xl font-bold text-indigo-900 mb-3">Open a Support Ticket</h3>
                                    <p className="text-indigo-800/80 font-medium leading-relaxed text-sm mb-6">
                                        If you encounter any issues during your application, you can easily open a support ticket. Just click on the Help icon in your dashboard, describe your issue, and our IT or Admission team will resolve it swiftly.
                                    </p>
                                </div>
                                <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100">
                                    <h3 className="text-xl font-bold text-emerald-900 mb-3">Track Progress Live</h3>
                                    <p className="text-emerald-800/80 font-medium leading-relaxed text-sm mb-6">
                                        Your dashboard gives you real-time updates. No need to visit the school physically; every admission decision and payment receipt is delivered directly to your portal.
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
