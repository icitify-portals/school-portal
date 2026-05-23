"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    History,
    CreditCard,
    Loader2,
    Search,
    Download,
    Undo2,
    FileText,
    ExternalLink,
    Printer,
    AlertCircle
} from "lucide-react";
import { getStudentLedger, processPayment, getStudentBills, getStudentFinancialSummary } from "@/actions/bursary";
import { getStudentByUserId } from "@/actions/students";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function StudentFinancePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [ledger, setLedger] = useState<any[]>([]);
    const [bills, setBills] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [payAmount, setPayAmount] = useState("");
    const [activeTab, setActiveTab] = useState<'ledger' | 'bills'>('ledger');

    useEffect(() => {
        if (session?.user) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        const userId = (session?.user as any)?.id;
        if (!userId) return;

        try {
            const studentData = await getStudentByUserId(parseInt(userId));
            if (!studentData) {
                setLoading(false);
                return;
            }
            setStudent(studentData);
            const studentId = studentData.id;

            const [ledgerData, billsData, summaryData] = await Promise.all([
                getStudentLedger(studentId),
                getStudentBills(studentId),
                getStudentFinancialSummary(studentId)
            ]);
            setLedger(ledgerData);
            setBills(billsData);
            setSummary(summaryData);
        } catch (error) {
            console.error("Failed to fetch financial data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;
        setIsPaying(true);
        const res = await processPayment({
            studentId: student.id,
            amount: payAmount,
            purpose: "Online Tuition Payment"
        });
        if (res.success) {
            setPayAmount("");
            fetchData();
        }
        setIsPaying(false);
    };

    const walletBalance = summary?.walletBalance?.toLocaleString() || "0.00";
    const totalOwed = summary?.outstandingBalance?.toLocaleString() || "0.00";
    const totalPaid = summary?.totalPaid?.toLocaleString() || "0.00";

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Overview</h2>
                    <p className="text-slate-500 mt-1">Manage your payments, wallet, and financial records</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="gap-2 h-11 px-6 rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50"
                        onClick={() => router.push("/student/finance/refund")}
                    >
                        <Undo2 className="w-4 h-4" />
                        Apply for Refund
                    </Button>
                    <Button variant="outline" className="gap-2 h-11 px-6 rounded-xl border-slate-200 text-slate-600">
                        <Download className="w-4 h-4" />
                        Download Ledger
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <CardContent className="p-8">
                        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">Wallet Balance</p>
                        <h3 className="text-4xl font-extrabold mb-8">₦{walletBalance}</h3>
                        <div className="flex gap-2">
                            <Button className="bg-white text-indigo-600 hover:bg-indigo-50 w-full font-bold h-11">
                                Top Up Wallet
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden border border-slate-100">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-3 text-red-600 bg-red-50 w-fit px-3 py-1 rounded-full text-[10px] font-bold mb-4 uppercase tracking-widest">
                            <ArrowDownCircle className="w-4 h-4" />
                            Outstanding Debt
                        </div>
                        <h3 className="text-4xl font-extrabold text-slate-900 mb-8">₦{totalOwed}</h3>
                        <Button className="bg-slate-900 text-white w-full font-bold h-11">
                            Pay Fees Now
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-slate-900 text-white">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-400" />
                            Quick Payment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePayment} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount to Pay</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-slate-800 border-none rounded-xl h-12 px-4 focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder:text-slate-600"
                                    placeholder="Enter amount (NGN)"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isPaying || !payAmount}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                            >
                                {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Payment"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden border border-slate-100">
                <CardHeader className="border-b border-slate-50 bg-white/50 backdrop-blur-sm sticky top-0 z-10 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-600" />
                        Transaction Ledger
                    </CardTitle>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 w-64"
                            placeholder="Filter transactions..."
                        />
                    </div>
                </CardHeader>

                <div className="bg-white border-b border-slate-100 flex justify-between items-center px-8">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('ledger')}
                            className={cn("py-4 text-xs font-bold uppercase tracking-widest border-b-2 px-4 transition-all", activeTab === 'ledger' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400")}
                        >
                            Transaction Ledger
                        </button>
                        <button
                            onClick={() => setActiveTab('bills')}
                            className={cn("py-4 text-xs font-bold uppercase tracking-widest border-b-2 px-4 transition-all", activeTab === 'bills' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400")}
                        >
                            My School Bills
                        </button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.print()}
                        className="text-[10px] font-bold uppercase tracking-widest gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Download PDF Statement
                    </Button>
                </div>

                {/* Print-only Header for Formal Statement */}
                <div className="hidden print:block print:p-8">
                    <div className="text-center mb-8 border-b-2 border-slate-900 pb-4">
                        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Official Financial Statement</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest mt-1" suppressHydrationWarning>Generated: {new Date().toLocaleDateString('en-US')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Student Details</h3>
                            <p className="font-bold text-slate-900 text-lg uppercase">{student?.firstName} {student?.lastName}</p>
                            <p className="font-mono text-slate-600 font-semibold">{student?.matricNumber}</p>
                            <p className="text-sm text-slate-500">{summary?.walletBalance ? `Current Balance: ₦${summary.walletBalance.toLocaleString()}` : ''}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Institution</h3>
                            <p className="font-bold text-slate-900 text-lg uppercase">Bursary Department</p>
                            <p className="text-slate-600">Office of the Bursar</p>
                            <p className="text-sm text-slate-500">certified true copy</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto print:border-none print:shadow-none bg-white">
                    {activeTab === 'ledger' ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Description</th>
                                    <th className="px-8 py-5">Debit</th>
                                    <th className="px-8 py-5">Credit</th>
                                    <th className="px-8 py-5">Balance</th>
                                    <th className="px-8 py-5">Reference</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                                        </td>
                                    </tr>
                                ) : ledger.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">No transactions found in your ledger.</td>
                                    </tr>
                                ) : (
                                    ledger.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5 text-sm text-slate-500">
                                                {new Date(entry.createdAt).toLocaleDateString('en-US')}
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-bold text-slate-700">{entry.description}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                {parseFloat(entry.debit) > 0 ? (
                                                    <span className="text-sm font-bold text-red-600">₦{parseFloat(entry.debit).toLocaleString()}</span>
                                                ) : "-"}
                                            </td>
                                            <td className="px-8 py-5">
                                                {parseFloat(entry.credit) > 0 ? (
                                                    <span className="text-sm font-bold text-green-600">₦{parseFloat(entry.credit).toLocaleString()}</span>
                                                ) : "-"}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-extrabold text-slate-900">
                                                ₦{parseFloat(entry.balance).toLocaleString()}
                                            </td>
                                            <td className="px-8 py-5 font-mono text-[10px] text-slate-400 group-hover:text-slate-600">
                                                #{entry.transactionId || "SYS-" + entry.id}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {parseFloat(entry.credit) > 0 && entry.transactionId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-3 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-[10px] gap-1.5 uppercase tracking-tighter"
                                                        onClick={() => window.open(`/finance/receipt/${entry.transactionId}`, '_blank')}
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        Receipt
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 space-y-6">
                            {bills.length === 0 ? (
                                <div className="py-20 text-center text-slate-400 italic">No bills generated for your account yet.</div>
                            ) : (
                                bills.map((bill) => (
                                    <div key={bill.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <FileText className="w-20 h-20" />
                                        </div>
                                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Bill Number</span>
                                                    <span className="text-sm font-mono font-bold text-slate-700">{bill.billNumber}</span>
                                                </div>
                                                <h4 className="text-xl font-extrabold text-slate-900">{bill.session?.name} School Fees</h4>
                                                <p className="text-xs text-slate-500 mt-1">Generated on {new Date(bill.createdAt).toLocaleDateString('en-US')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Amount</p>
                                                <h3 className="text-2xl font-black text-slate-900">₦{parseFloat(bill.totalAmount).toLocaleString()}</h3>
                                                <span className={cn("inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase mt-2",
                                                    bill.status === 'paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                                                    {bill.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-200 pt-4 mb-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {bill.items?.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-500">{item.feeItem?.name}</span>
                                                        <span className="font-bold text-slate-700">₦{parseFloat(item.amount).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {bill.note && (
                                            <div className="bg-white/50 p-4 rounded-xl border border-dashed border-indigo-200 mt-4">
                                                <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs">
                                                    <AlertCircle className="w-3 h-3" />
                                                    INSTITUTIONAL NOTE:
                                                </div>
                                                <p className="text-sm text-slate-600 italic leading-relaxed">{bill.note}</p>
                                            </div>
                                        )}

                                        <div className="mt-6 flex justify-end gap-3">
                                            <Button variant="outline" className="h-9 text-xs gap-2 rounded-lg">
                                                <Printer className="w-3 h-3" />
                                                Print Bill
                                            </Button>
                                            <Button className="h-9 text-xs bg-slate-900 rounded-lg">
                                                Pay This Bill
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
