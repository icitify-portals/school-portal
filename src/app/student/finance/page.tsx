"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Wallet,
    ArrowDownCircle,
    History,
    CreditCard,
    Loader2,
    Search,
    Download,
    Undo2,
    FileText,
    Printer,
    AlertCircle,
    CheckCircle2,
    X,
    Coins,
    Sparkles,
    ShieldAlert,
    BookOpen
} from "lucide-react";
import { 
    getStudentLedger, 
    getStudentBills, 
    getStudentFinancialSummary, 
    getBursarySettings,
    payBillWithWalletAction,
    initializeOnlineCheckoutAction,
    resolveOnlinePaymentAction
} from "@/actions/bursary";
import { getStudentByUserId } from "@/actions/students";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AcademicNomenclature } from "@/lib/nomenclature";
import { RemitaInlineCheckout } from "@/components/finance/RemitaInlineCheckout";


interface LedgerEntry {
    id: number;
    createdAt: string | Date;
    description: string;
    debit: string;
    credit: string;
    balance: string;
    transactionId?: number | string;
}

interface BillItem {
    id: number;
    feeItem?: { name: string };
    amount: string;
}

interface Bill {
    id: number;
    billNumber: string;
    totalAmount: string;
    amountPaid?: string;
    status: 'pending' | 'partially_paid' | 'paid';
    note?: string;
    partPaymentAllowed?: boolean;
    partPaymentMinPercent?: number;
    createdAt: string | Date;
    session?: { name: string; currentSemester?: string; id?: number };
    sessionId?: number;
    items?: BillItem[];
}

interface FinancialSummary {
    walletBalance: number;
    outstandingBalance: number;
    totalPaid: number;
}

interface StudentProfile {
    id: number;
    firstName: string;
    lastName: string;
    matricNumber?: string;
    userId: number;
    programme?: { name: string };
}

export default function StudentFinancePage() {
    const { data: session } = useSession();
    const router = useRouter();

    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ledger' | 'bills'>('ledger');

    // Checkout Modal State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [selectedAmount, setSelectedAmount] = useState<number>(0);
    const [paymentMode, setPaymentMode] = useState<'gateway' | 'wallet'>('gateway');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [checkoutError, setCheckoutError] = useState("");
    const [remitaData, setRemitaData] = useState<{rrr: string, reference: string} | null>(null);

    // Search filter state
    const [filterQuery, setFilterQuery] = useState("");

    const fetchData = useCallback(async () => {
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) return;

        try {
            const studentData = await getStudentByUserId(parseInt(userId));
            if (!studentData) {
                setLoading(false);
                return;
            }
            setStudent(studentData as StudentProfile);
            const studentId = studentData.id;

            const [ledgerData, billsData, summaryData, settingsData] = await Promise.all([
                getStudentLedger(studentId),
                getStudentBills(studentId),
                getStudentFinancialSummary(studentId),
                getBursarySettings()
            ]);
            setLedger(ledgerData as LedgerEntry[]);
            setBills(billsData as Bill[]);
            setSummary(summaryData as FinancialSummary);
            setSettings(settingsData);
        } catch (error) {
            console.error("Failed to fetch financial data:", error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (session?.user) {
            fetchData();
        }
    }, [session, fetchData]);

    const openCheckout = (bill: Bill) => {
        setSelectedBill(bill);
        const outstanding = parseFloat(bill.totalAmount) - parseFloat(bill.amountPaid || "0.00");
        setSelectedAmount(outstanding);
        setPaymentMode('gateway');
        setCheckoutError("");
        setCheckoutSuccess(false);
        setRemitaData(null);
        setIsCheckoutOpen(true);
    };

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student || !selectedBill) return;

        // Validation
        const outstanding = parseFloat(selectedBill.totalAmount) - parseFloat(selectedBill.amountPaid || "0.00");
        const partPaymentEnabled = selectedBill.partPaymentAllowed !== false && settings['part_payment_enabled'] !== 'false';
        const minPercentage = parseFloat(selectedBill.partPaymentMinPercent?.toString() || settings['min_part_payment_percentage'] || "60");
        const minFlatAmount = parseFloat(settings['min_part_payment_amount'] || "5000");
        const isInitialPayment = parseFloat(selectedBill.amountPaid || "0.00") < 0.01;

        const pctAmount = (parseFloat(selectedBill.totalAmount) * minPercentage) / 100;
        const minPayment = (partPaymentEnabled && isInitialPayment)
            ? Math.min(outstanding, Math.max(pctAmount, minFlatAmount))
            : Math.min(outstanding, 1000);

        if (selectedAmount < minPayment) {
            setCheckoutError(`Minimum payment of ₦${minPayment.toLocaleString()} is required.`);
            return;
        }

        if (selectedAmount > outstanding + 0.01) {
            setCheckoutError(`Payment exceeds outstanding balance of ₦${outstanding.toLocaleString()}.`);
            return;
        }

        setCheckoutLoading(true);
        setCheckoutError("");

        try {
            if (paymentMode === 'wallet') {
                const currentWalletBalance = summary?.walletBalance || 0;
                if (currentWalletBalance < selectedAmount) {
                    setCheckoutError("Insufficient wallet balance. Please top up your wallet first.");
                    setCheckoutLoading(false);
                    return;
                }

                // Proceed directly to wallet payment
                try {
                    const res = await payBillWithWalletAction(student.id, selectedBill.id, selectedAmount);
                    if (res.success) {
                        setCheckoutSuccess(true);
                        setTimeout(() => {
                            setIsCheckoutOpen(false);
                            fetchData();
                        }, 2000);
                    } else {
                        setCheckoutError((res as any).error || "Wallet payment failed.");
                    }
                } catch (err) {
                    setCheckoutError("An unexpected error occurred during wallet payment.");
                } finally {
                    setCheckoutLoading(false);
                }
            } else {
                // Proceed directly to online checkout
                try {
                    const res = await initializeOnlineCheckoutAction(student.id, selectedBill.id, selectedAmount);

                    if (res.success && res.rrr && !res.rrr.startsWith('RRR-MOCK-')) {
                        setRemitaData({ rrr: res.rrr, reference: res.reference || "" });
                    } else if (res.success && res.checkoutUrl) {
                        setCheckoutSuccess(true);
                        setTimeout(() => {
                            setIsCheckoutOpen(false);
                            window.location.href = `${res.checkoutUrl}&billId=${selectedBill.id}`;
                        }, 1500);
                    } else {
                        setCheckoutError(res.error || "Online checkout initialization failed.");
                    }
                } catch (err) {
                    setCheckoutError("An unexpected error occurred during checkout.");
                } finally {
                    setCheckoutLoading(false);
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during checkout.";
            setCheckoutError(errorMessage);
            setCheckoutLoading(false);
        }
    };


    const walletBalanceText = summary?.walletBalance?.toLocaleString() || "0.00";
    const totalOwedText = summary?.outstandingBalance?.toLocaleString() || "0.00";
    const totalPaidText = summary?.totalPaid?.toLocaleString() || "0.00";

    const unpaidBill = bills.find(b => b.status !== 'paid');

    // Filters transaction ledger
    const filteredLedger = ledger.filter(entry => 
        entry.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (entry.transactionId || "").toString().includes(filterQuery)
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading secure ledger...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
          <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800 mb-2">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <Wallet className="w-12 h-12 text-emerald-400 drop-shadow-md" />
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                            Student Finance Center
                        </h2>
                    </div>
                    <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                        Manage your digital wallet, outstanding bills, and payment vouchers
                    </p>
                </div>
                <div className="relative z-10 flex gap-3 mt-6 md:mt-0">
                    <Button
                        variant="outline"
                        className="gap-2 h-11 px-6 rounded-xl border-white/20 text-white bg-white/10 hover:bg-white/20 hover:text-white font-bold text-xs transition-all shadow-sm backdrop-blur-md"
                        onClick={() => router.push("/student/finance/library")}
                    >
                        <BookOpen className="w-4 h-4" />
                        Library Fines
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 h-11 px-6 rounded-xl border-white/20 text-white bg-white/10 hover:bg-white/20 hover:text-white font-bold text-xs transition-all shadow-sm backdrop-blur-md"
                        onClick={() => router.push("/student/finance/refund")}
                    >
                        <Undo2 className="w-4 h-4" />
                        Request Refund
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 h-11 px-6 rounded-xl border-white/20 text-white bg-white/10 hover:bg-white/20 hover:text-white font-bold text-xs transition-all shadow-sm backdrop-blur-md"
                        onClick={() => window.print()}
                    >
                        <Download className="w-4 h-4" />
                        Export Statement
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Wallet Balance Card */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100 group transition-all duration-300 hover:shadow-indigo-200">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Wallet className="w-32 h-32" />
                    </div>
                    <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-2 opacity-80 flex items-center gap-1.5">
                        <Coins className="w-4 h-4" /> Available Wallet Balance
                    </p>
                    <h3 className="text-4xl font-black mb-10 tracking-tight">₦{walletBalanceText}</h3>
                    <div className="flex gap-2">
                        <Button 
                            className="bg-white text-indigo-600 hover:bg-indigo-50 w-full font-black rounded-2xl h-12 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={() => router.push("/student/finance/wallet")}
                        >
                            Go to Wallet Hub
                        </Button>
                    </div>
                </div>

                {/* Outstanding Debt Card */}
                <div className="bg-white rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl shadow-slate-100 border border-slate-100/50 group transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <ArrowDownCircle className="w-32 h-32 text-red-600" />
                    </div>
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        Outstanding Balance
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 mb-10 tracking-tight">₦{totalOwedText}</h3>
                    <Button 
                        disabled={!unpaidBill}
                        onClick={() => unpaidBill && openCheckout(unpaidBill)}
                        className="bg-slate-900 hover:bg-slate-800 text-white w-full font-black rounded-2xl h-12 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg"
                    >
                        {unpaidBill ? "Pay Fees Now" : "All Fees Settled"}
                    </Button>
                </div>

                {/* Information Card / Quick Insights */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl group transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <CreditCard className="w-32 h-32 text-indigo-400" />
                    </div>
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-lg flex items-center gap-2 font-bold tracking-tight">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            Financial Insights
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Your payment mode is locked to secure online gateways and digital wallet checkout to eliminate manual deposit delays.
                        </p>
                        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid:</span>
                            <span className="font-extrabold text-sm text-indigo-400">₦{totalPaidText}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Ledger Card */}
            <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden border border-slate-100">
                <CardHeader className="border-b border-slate-50 bg-white/50 backdrop-blur-sm p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <CardTitle className="text-lg flex items-center gap-2 font-bold tracking-tight text-slate-900">
                        <History className="w-5 h-5 text-indigo-600" />
                        Transaction Ledger
                    </CardTitle>
                    <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="pl-11 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-full h-11 transition-all outline-none"
                            placeholder="Filter transactions by details..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>

                <div className="bg-white border-b border-slate-50 flex justify-between items-center px-8">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('ledger')}
                            className={cn("py-4 text-[10px] font-black uppercase tracking-widest border-b-2 px-4 transition-all", activeTab === 'ledger' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400")}
                        >
                            Transaction Ledger
                        </button>
                        <button
                            onClick={() => setActiveTab('bills')}
                            className={cn("py-4 text-[10px] font-black uppercase tracking-widest border-b-2 px-4 transition-all", activeTab === 'bills' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400")}
                        >
                            My School Bills
                        </button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.print()}
                        className="text-[9px] font-black uppercase tracking-widest gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Print statement
                    </Button>
                </div>

                <div className="overflow-x-auto print:border-none print:shadow-none bg-white">
                    {activeTab === 'ledger' ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Description</th>
                                    <th className="px-8 py-5">Debit</th>
                                    <th className="px-8 py-5">Credit</th>
                                    <th className="px-8 py-5">Balance</th>
                                    <th className="px-8 py-5">Reference</th>
                                    <th className="px-8 py-5 text-right">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLedger.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center text-slate-400 italic text-sm">
                                            No transactions found matching the filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLedger.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5 text-xs font-bold text-slate-500">
                                                {new Date(entry.createdAt).toLocaleDateString('en-US')}
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-extrabold text-slate-800">{entry.description}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                {parseFloat(entry.debit) > 0 ? (
                                                    <span className="text-sm font-black text-rose-600">₦{parseFloat(entry.debit).toLocaleString()}</span>
                                                ) : "-"}
                                            </td>
                                            <td className="px-8 py-5">
                                                {parseFloat(entry.credit) > 0 ? (
                                                    <span className="text-sm font-black text-emerald-600">₦{parseFloat(entry.credit).toLocaleString()}</span>
                                                ) : "-"}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-black text-slate-900">
                                                {String(entry.id).startsWith('w-') ? (
                                                    <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Wallet Tx</span>
                                                ) : (
                                                    `₦${parseFloat(entry.balance).toLocaleString()}`
                                                )}
                                            </td>
                                            <td className="px-8 py-5 font-mono text-[10px] text-slate-400 group-hover:text-slate-600">
                                                #{entry.transactionId || "SYS-" + entry.id}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {parseFloat(entry.credit) > 0 && entry.transactionId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-3 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-black text-[9px] gap-1.5 uppercase tracking-wider"
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
                                <div className="py-20 text-center text-slate-400 italic text-sm">No bills generated for your account yet.</div>
                            ) : (
                                bills.map((bill) => {
                                    const outstanding = parseFloat(bill.totalAmount) - parseFloat(bill.amountPaid || "0.00");
                                    const termLabel = AcademicNomenclature.getLabel(
                                        bill.session?.currentSemester || "1",
                                        settings
                                    );
                                    
                                    return (
                                        <div key={bill.id} className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-8 border border-slate-100 relative overflow-hidden group transition-all duration-300">
                                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <FileText className="w-24 h-24" />
                                            </div>
                                            <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Bill ID</span>
                                                        <span className="text-xs font-mono font-bold text-slate-600">{bill.billNumber}</span>
                                                    </div>
                                                    <h4 className="text-xl font-black text-slate-900">{bill.session?.name} School Fees</h4>
                                                    <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest text-indigo-500/80">{termLabel}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                                                    <h3 className="text-2xl font-black text-slate-900">₦{outstanding.toLocaleString()}</h3>
                                                    <span className={cn("inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase mt-3 tracking-wider",
                                                        bill.status === 'paid' ? "bg-emerald-100 text-emerald-800" : bill.status === 'partially_paid' ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800")}>
                                                        {bill.status === 'partially_paid' ? 'Part-Paid' : bill.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-200/60 pt-4 mb-4 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pr-2">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {bill.items?.map((item) => (
                                                        <div key={item.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg">
                                                            <span className="text-slate-500 font-medium truncate mr-2" title={item.feeItem?.name}>{item.feeItem?.name}</span>
                                                            <span className="font-extrabold text-slate-800 shrink-0">₦{parseFloat(item.amount).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {bill.note && (
                                                <div className="bg-white p-4 rounded-2xl border border-slate-100 mt-4">
                                                    <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        Note:
                                                    </div>
                                                    <p className="text-xs text-slate-500 italic leading-relaxed">{bill.note}</p>
                                                </div>
                                            )}

                                            <div className="mt-6 flex justify-end gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => router.push(`/finance/bill/${bill.id}`)}
                                                    className="h-10 px-5 text-xs font-black rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 transition-all"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                    View &amp; Print Bill
                                                </Button>
                                                <Button 
                                                    disabled={outstanding <= 0}
                                                    onClick={() => openCheckout(bill)}
                                                    className="h-10 px-5 text-xs font-black bg-slate-900 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                                                >
                                                    Pay This Bill
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Premium Checkout Modal */}
            {isCheckoutOpen && selectedBill && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        {/* Close button */}
                        <button 
                            onClick={() => setIsCheckoutOpen(false)}
                            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 overflow-y-auto">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Secure Checkout</h3>
                                    <p className="text-[10px] text-slate-500">Bill ID: {selectedBill.billNumber}</p>
                                </div>
                            </div>

                            {checkoutSuccess ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 animate-bounce">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900">Payment Authorized!</h4>
                                    <p className="text-xs text-slate-400">Your student ledger balance has been credited successfully. Receipts are now viewable.</p>
                                </div>
                            ) : remitaData ? (
                                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                                    <h4 className="text-xl font-black text-slate-900">Complete Remita Payment</h4>
                                    <p className="text-xs text-slate-500 mb-4">Please complete your payment using the secure Remita gateway.</p>
                                    <div className="w-full">
                                        <RemitaInlineCheckout 
                                            rrr={remitaData.rrr} 
                                            amount={selectedAmount} 
                                            email={session?.user?.email || "student@fssibadan.edu.ng"} 
                                            firstName={student.firstName} 
                                            lastName={student.lastName} 
                                            onSuccess={async () => {
                                                setCheckoutLoading(true);
                                                try {
                                                    const verify = await resolveOnlinePaymentAction(remitaData.reference, 'completed', selectedBill.id);
                                                    if (verify.success) {
                                                        setCheckoutSuccess(true);
                                                        setTimeout(() => {
                                                            setIsCheckoutOpen(false);
                                                            if (verify.transactionId) {
                                                                window.location.href = `/finance/receipt/${verify.transactionId}`;
                                                            } else {
                                                                fetchData();
                                                            }
                                                        }, 1500);
                                                    } else {
                                                        setCheckoutError("Payment verification failed. Please contact admin.");
                                                        setRemitaData(null);
                                                    }
                                                } catch (err) {
                                                    setCheckoutError("Error verifying payment.");
                                                    setRemitaData(null);
                                                }
                                                setCheckoutLoading(false);
                                            }} 
                                            onError={() => {
                                                setCheckoutError("Remita payment failed or was cancelled.");
                                                setRemitaData(null);
                                            }} 
                                            onClose={() => {
                                                // Handle close
                                            }} 
                                        />
                                    </div>
                                    <Button variant="ghost" className="mt-4 text-xs font-bold text-slate-500" onClick={() => setRemitaData(null)}>
                                        Cancel Payment
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                                    {/* Bill summary box */}
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Academic Term:</span>
                                            <span className="font-extrabold text-indigo-600 uppercase">
                                                {AcademicNomenclature.getLabel(selectedBill.session?.currentSemester || "1", settings)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Outstanding:</span>
                                            <span className="font-extrabold text-slate-800">
                                                ₦{(parseFloat(selectedBill.totalAmount) - parseFloat(selectedBill.amountPaid || "0.00")).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Installment / Amount selector */}
                                    {(() => {
                                        const outstanding = parseFloat(selectedBill.totalAmount) - parseFloat(selectedBill.amountPaid || "0.00");
                                        const partPaymentEnabled = selectedBill.partPaymentAllowed !== false && settings['part_payment_enabled'] !== 'false';
                                        const minPercentage = parseFloat(selectedBill.partPaymentMinPercent?.toString() || settings['min_part_payment_percentage'] || "60");
                                        const minFlatAmount = parseFloat(settings['min_part_payment_amount'] || "5000");
                                        const isInitialPayment = parseFloat(selectedBill.amountPaid || "0.00") < 0.01;
                                        const pctAmount = (parseFloat(selectedBill.totalAmount) * minPercentage) / 100;
                                        const minPayment = (partPaymentEnabled && isInitialPayment)
                                            ? Math.min(outstanding, Math.max(pctAmount, minFlatAmount))
                                            : Math.min(outstanding, 1000);

                                        return (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount to Settle (₦)</label>
                                                    {partPaymentEnabled && (
                                                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                                            Installments Allowed (Min: {minPercentage}%)
                                                        </span>
                                                    )}
                                                </div>

                                                <input
                                                    type="number"
                                                    required
                                                    min={minPayment}
                                                    max={outstanding}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-12 px-4 focus:ring-2 focus:ring-indigo-500 transition-all font-black text-slate-800 placeholder:text-slate-400 text-lg"
                                                    placeholder="Enter amount (NGN)"
                                                    value={selectedAmount || ""}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        setSelectedAmount(isNaN(val) ? 0 : val);
                                                    }}
                                                    onBlur={() => {
                                                        if (selectedAmount < minPayment) {
                                                            setSelectedAmount(minPayment);
                                                        } else if (selectedAmount > outstanding) {
                                                            setSelectedAmount(outstanding);
                                                        }
                                                    }}
                                                />

                                                {partPaymentEnabled && outstanding > minPayment && (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="range"
                                                            min={minPayment}
                                                            max={outstanding}
                                                            step={100}
                                                            value={selectedAmount || minPayment}
                                                            onChange={(e) => setSelectedAmount(parseFloat(e.target.value))}
                                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                        />
                                                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                            <span>Min: ₦{minPayment.toLocaleString()}</span>
                                                            <span>Max: ₦{outstanding.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedAmount < minPayment && (
                                                    <div className="flex items-start gap-2 text-amber-600 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 text-xs">
                                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                        <p className="leading-relaxed">
                                                            Amount is below the minimum required installment of <strong>₦{minPayment.toLocaleString()}</strong> ({minPercentage}% setting threshold).
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Secure Payment Mode Select */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Secure Payment Mode</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMode('gateway')}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 text-left transition-all",
                                                    paymentMode === 'gateway'
                                                        ? "border-indigo-600 bg-white shadow-md shadow-indigo-50"
                                                        : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                                                )}
                                            >
                                                <CreditCard className={cn("w-5 h-5 mb-2", paymentMode === 'gateway' ? "text-indigo-600" : "text-slate-400")} />
                                                <p className="font-extrabold text-slate-800 text-xs">Online Gateway</p>
                                                <p className="text-[9px] text-slate-400 leading-tight mt-1">Paystack, Remita secure checkout</p>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMode('wallet')}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 text-left transition-all",
                                                    paymentMode === 'wallet'
                                                        ? "border-indigo-600 bg-white shadow-md shadow-indigo-50"
                                                        : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                                                )}
                                            >
                                                <Wallet className={cn("w-5 h-5 mb-2", paymentMode === 'wallet' ? "text-indigo-600" : "text-slate-400")} />
                                                <p className="font-extrabold text-slate-800 text-xs">Digital Wallet</p>
                                                <p className="text-[9px] text-slate-400 leading-tight mt-1">Instant debit (Bal: ₦{walletBalanceText})</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Wallet validation message */}
                                    {paymentMode === 'wallet' && (summary?.walletBalance || 0) < selectedAmount && (
                                        <div className="flex items-start gap-2 text-rose-600 bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 text-xs">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <p className="leading-relaxed">
                                                Your digital wallet has insufficient funds (₦{walletBalanceText} available). Please fund your wallet in the Wallet Portal before finalizing.
                                            </p>
                                        </div>
                                    )}

                                    {checkoutError && (
                                        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-xs font-bold flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {checkoutError}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={
                                            checkoutLoading || 
                                            selectedAmount <= 0 || 
                                            (paymentMode === 'wallet' && (summary?.walletBalance || 0) < selectedAmount) ||
                                            (() => {
                                                const outstanding = parseFloat(selectedBill.totalAmount) - parseFloat(selectedBill.amountPaid || "0.00");
                                                const partPaymentEnabled = selectedBill.partPaymentAllowed !== false && settings['part_payment_enabled'] !== 'false';
                                                const minPercentage = parseFloat(selectedBill.partPaymentMinPercent?.toString() || settings['min_part_payment_percentage'] || "60");
                                                const minFlatAmount = parseFloat(settings['min_part_payment_amount'] || "5000");
                                                const isInitialPayment = parseFloat(selectedBill.amountPaid || "0.00") < 0.01;
                                                const pctAmount = (parseFloat(selectedBill.totalAmount) * minPercentage) / 100;
                                                const minPayment = (partPaymentEnabled && isInitialPayment)
                                                    ? Math.min(outstanding, Math.max(pctAmount, minFlatAmount))
                                                    : Math.min(outstanding, 1000);
                                                return selectedAmount < minPayment || selectedAmount > outstanding + 0.01;
                                            })()
                                        }
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 rounded-2xl shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        {checkoutLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : paymentMode === 'wallet' ? (
                                            "Debit Wallet & Settle"
                                        ) : (
                                            "Authorize Gateway Payment"
                                        )}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
       </div>
    );
}
