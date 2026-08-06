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
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Before you can receive payments (like Application fees or Tuition), you must create a physical Settlement Bank Account in the system. This tells the system where the money should ultimately go.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Navigate to <strong>Bursary Settings</strong>.</li>
                                    <li>Scroll down to the <strong>Settlement Accounts Console</strong>.</li>
                                    <li>Fill in the Bank Name, CBN Code (e.g. 011 for First Bank), and the 10-digit NUBAN Account Number.</li>
                                    <li>Click "Add Settlement Account".</li>
                                </ul>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">You can create multiple settlement accounts (e.g., one for SUG dues, one for Tuition, one for Tech Studio).</p>
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Mapping Payment Gateways (e.g. ALATPay)</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Once the settlement account is created, you must map it to a payment gateway so that the gateway knows where to route the split funds.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Locate the settlement account card you just created.</li>
                                    <li>Click the <strong>Map Subaccount</strong> button on that card.</li>
                                    <li>Select your provider (e.g., ALATPay).</li>
                                    <li><strong>For ALATPay:</strong> Enter the provided Business ID (e.g., 254d0a99-...) and the Public Key.</li>
                                    <li>Click "Save Mapping".</li>
                                </ul>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                                    <LinkIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-emerald-800">The gateway mapping ensures that funds processed online are automatically split and settled into the correct physical bank account the next morning.</p>
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
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Creating Fee Structures & Allocations</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    A Fee Structure defines what a student needs to pay. You create the structure, add line items (like Tuition, ID Card, SUG Dues), and then <strong>allocate</strong> it to the relevant department or faculty.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Structures:</strong> Go to 'Fee Structures', create a new structure, add your fee items and map each item to a Settlement Account. Once done, mark it as Approved.</p>
                                    </div>
                                    <div className="flex items-start gap-3 mt-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Allocations:</strong> Go to 'Fee Allocations' to assign the Approved structure to a target (e.g., 100 Level Computer Science students). You can bulk-delete allocations if you make a mistake.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl shrink-0">4</div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Managing & Reversing Transactions</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    If an applicant pays twice, or a transaction is mistakenly marked as successful by an admin, you can reverse it.
                                </p>
                                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
                                    <RotateCcw className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-rose-800">
                                        Navigate to <strong>All Transactions</strong> or the specific Applicant's view. You will find a <strong>Reverse Transaction</strong> button. This will revert the payment status and immediately unlink the generated receipt.
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
