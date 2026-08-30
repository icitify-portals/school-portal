import Link from "next/link";
import { ArrowLeft, Landmark, CheckCircle2, AlertTriangle, FileText, CreditCard, RotateCcw, Link as LinkIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default function BursaryGuidePage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-12 pb-20 selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="bg-slate-950 p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Landmark className="w-48 h-48" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">
                            Bursary Module Guide
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl relative z-10">
                            A comprehensive manual for configuring settlement accounts, mapping payment gateways, allocating fees, and managing transactions.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Notice */}
                        <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-200 flex gap-4">
                            <AlertTriangle className="w-8 h-8 text-indigo-500 shrink-0" />
                            <div>
                                <h3 className="font-bold text-indigo-900 mb-1">Administrative Rights Required</h3>
                                <p className="text-indigo-800/80 font-medium text-sm leading-relaxed">
                                    Only staff members with the Bursar or Super Admin roles can access these configurations. Ensure you double-check all bank account numbers and business IDs before saving.
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Creating a Settlement Account</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-4">
                                    Before you can receive payments (like Application fees or Tuition), you must create a physical Settlement Bank Account in the system. This tells the system where the money should ultimately go.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Navigate to <strong>Bursary Settings</strong>.</li>
                                    <li>Scroll down to the <strong>Settlement Accounts Console</strong>.</li>
                                    <li>Fill in the Bank Name, CBN Code (e.g. 011 for First Bank), and the 10-digit NUBAN Account Number.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">2</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Mapping Payment Gateways (e.g. ALATPay)</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-4">
                                    Once the settlement account is created, you must map it to a payment gateway so that the gateway knows where to route the split funds.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Locate the settlement account card you just created.</li>
                                    <li>Click the <strong>Map Subaccount</strong> button on that card.</li>
                                    <li>Select your provider (e.g., ALATPay) and enter the Business ID and Public Key.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">3</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Fee Structures & Multi-Level Targeting</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-4">
                                    A Fee Structure defines the template of what students should pay. You can now use <strong>Multi-Level Targeting</strong> to assign a fee structure to multiple target groups simultaneously.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Structures:</strong> Go to 'Fee Structures', create a new structure, add your fee items and map each item to a Settlement Account.</p>
                                    </div>
                                    <div className="flex items-start gap-3 mt-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Targeting:</strong> You can target multiple levels (e.g., ND 1, HND 2), specific statuses (e.g., <code>nd_graduant</code>), or simply select <code>all</code> to blanket-apply it.</p>
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
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Generating Student Invoices (Bills)</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-4">
                                    <strong>Important:</strong> Students do not pay directly based on the fee structure template alone. You must generate personalized invoices (bills) for them first.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Navigate to <strong>School Bills</strong>.</li>
                                    <li>Select <strong>Batch Generation</strong> to run mass billing for a specific level, department, or the whole school.</li>
                                    <li>The system generates unique invoices representing the fee structure template applied to each specific student.</li>
                                    <li>Students will log in, see their invoice, and pay (via wallet or gateway).</li>
                                </ul>
                            </div>
                        </div>

                        {/* Practical Example */}
                        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl mt-8">
                            <div className="p-6 border-b border-white/10 bg-black/20 flex items-center gap-3">
                                <FileText className="w-6 h-6 text-indigo-400" />
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Typical Example Workflow</h3>
                            </div>
                            <div className="p-8 space-y-6 text-slate-300 text-sm leading-relaxed">
                                <p>Let's say a new academic session starts and you need to collect <strong>Tuition</strong> and <strong>SUG Dues</strong> for ND 1 and HND 1 Computer Science students.</p>
                                
                                <ol className="list-decimal list-inside space-y-4 marker:font-bold marker:text-indigo-400">
                                    <li><strong>Setup Accounts:</strong> Ensure you have two Settlement Accounts: "FSS Tuition Account" and "SUG Dues Account". Map them to your gateway (ALATPay).</li>
                                    <li><strong>Create Fee Structure:</strong> Create a new Fee Structure named "New Session Levies". Add two items: "Tuition" (₦50,000, mapped to Tuition Account) and "SUG Dues" (₦2,000, mapped to SUG Account).</li>
                                    <li><strong>Targeting:</strong> Assign the structure's target group to <code>1, 3</code> (ND 1 and HND 1) and link it to the Computer Science department. Approve it.</li>
                                    <li><strong>Billing:</strong> Go to the Bills page and generate batch bills for Computer Science, ND 1 & HND 1.</li>
                                    <li><strong>Payment:</strong> When Student A logs in, they see a bill for ₦52,000. They click pay. The ALATPay gateway splits the ₦52,000 in real-time — ₦50,000 drops into the Tuition account and ₦2,000 into the SUG account.</li>
                                </ol>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
