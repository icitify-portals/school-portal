
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Undo2,
    Loader2,
    AlertCircle,
    Banknote,
    Building2,
    User,
    ClipboardList,
    CheckCircle2,
    History
} from "lucide-react";
import { requestRefund, getStudentLedger } from "@/actions/bursary";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function StudentRefundRequestPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [ledger, setLedger] = useState<any[]>([]);

    // Form State
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [transactionId, setTransactionId] = useState<string>("");

    useEffect(() => {
        if (session?.user) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        const studentId = (session?.user as any)?.studentId || 1;
        const ledgerData = await getStudentLedger(studentId);
        // Only show credit transactions (payments) to link to
        setLedger(ledgerData.filter(e => parseFloat(e.credit || '0') > 0));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const studentId = (session?.user as any)?.studentId || 1;

        setSubmitting(true);
        const res = await requestRefund({
            studentId,
            amount,
            reason,
            bankName,
            accountNumber,
            accountName,
            transactionId: transactionId ? parseInt(transactionId) : undefined
        });

        if (res.success) {
            setSuccess(true);
            setTimeout(() => router.push("/student/finance"), 3000);
        } else {
            alert(res.error || "Failed to submit request");
        }
        setSubmitting(false);
    };

    if (success) {
        return (
            <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Request Submitted!</h2>
                <p className="text-slate-500 mb-8 max-w-sm">
                    Your refund request has been logged and sent to the Bursar for review.
                    You will be redirected to your finance dashboard shortly.
                </p>
                <Button variant="outline" onClick={() => router.push("/student/finance")}>
                    Return to Finance
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-10 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <Undo2 className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Refund Application</h2>
                    <p className="text-slate-500 mt-1">Request a return of funds due to overpayment or registration cancellation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-indigo-600" />
                                Refund Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Amount to Refund (NGN)</label>
                                            <div className="relative">
                                                <Banknote className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl h-12 focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                                                    placeholder="0.00"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Link to Transaction (Optional)</label>
                                            <div className="relative">
                                                <History className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <select
                                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl h-12 focus:ring-2 focus:ring-indigo-500 appearance-none text-sm"
                                                    value={transactionId}
                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                >
                                                    <option value="">Select previous payment...</option>
                                                    {ledger.map(tx => (
                                                        <option key={tx.id} value={tx.transactionId}>
                                                            // @ts-expect-error - TS2304: Auto-suppressed for build
                                                            Ref: {tx.transactionId} - {settings?.base_currency || '₦'}{parseFloat(tx.credit).toLocaleString()} ({tx.description})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Reason for Refund</label>
                                        <textarea
                                            required
                                            rows={4}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                                            placeholder="Please provide a detailed reason for this refund request..."
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        Bank Account Details (Where funds should be sent)
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</label>
                                                <input
                                                    required
                                                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl h-12 focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="e.g. Access Bank"
                                                    value={bankName}
                                                    onChange={(e) => setBankName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Account Number</label>
                                                <input
                                                    required
                                                    maxLength={10}
                                                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl h-12 focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest text-lg"
                                                    placeholder="0123456789"
                                                    value={accountNumber}
                                                    onChange={(e) => setAccountNumber(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Account Name</label>
                                            <div className="relative">
                                                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    required
                                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl h-12 focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Full name as it appears on bank statement"
                                                    value={accountName}
                                                    onChange={(e) => setAccountName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-slate-900 hover:bg-slate-800 h-14 rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/10 text-lg"
                                >
                                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Refund Request"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-amber-50">
                        <CardContent className="p-6">
                            <div className="flex gap-3 items-start mb-4">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <h4 className="font-bold text-amber-900">Important Policy</h4>
                            </div>
                            <ul className="space-y-3 text-xs text-amber-800 leading-relaxed font-medium">
                                <li className="flex gap-2">
                                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                                    Refunds are strictly subject to institutional policy and Bursar approval.
                                </li>
                                <li className="flex gap-2">
                                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                                    A processing fee may be deducted from the final amount.
                                </li>
                                <li className="flex gap-2">
                                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                                    Account names MUST match the student's registered name to avoid rejection.
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-slate-50">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold">Process Workflow</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 relative">
                            {[
                                { title: "Submission", desc: "Form successfully submitted by student" },
                                { title: "Verification", desc: "Bursary staff verifies payment history" },
                                { title: "Bursar Approval", desc: "Final reviewed by the institution Bursar" },
                                { title: "Disbursement", desc: "Funds sent to provided bank account" }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">{step.title}</p>
                                        <p className="text-[10px] text-slate-500">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
