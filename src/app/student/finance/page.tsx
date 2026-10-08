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
    BookOpen,
    GraduationCap,
    Archive,
    ExternalLink,
    Receipt,
    Layers,
    ChevronRight,
    Tag
} from "lucide-react";
import { 
    getStudentLedger, 
    getStudentBills, 
    getStudentFinancialSummary, 
    getBursarySettings,
    payBillWithWalletAction,
    initializeOnlineCheckoutAction,
    resolveOnlinePaymentAction,
    getStudentPaymentHistory
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
    feeItemId?: number;
    feeItem?: { name: string; category?: string };
    amount: string;
    amountPaid?: string;
    originalAmount?: string;
    scholarshipApplied?: string;
    discountApplied?: string;
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
    tuitionInstallmentEnabled?: boolean;
    tuitionInstallmentPercentage?: number | string;
    tuitionInstallmentDeadline?: string | Date;
    totalScholarshipApplied?: string;
    totalDiscountApplied?: string;
    items?: BillItem[];
}

interface FinancialSummary {
    walletBalance: number;
    outstandingBalance: number;
    totalPaid: number;
    legacyBalance?: number;
}

interface StudentProfile {
    id: number;
    firstName: string;
    lastName: string;
    matricNumber?: string;
    userId: number;
    programme?: { name: string };
}

const ACTION_TIMEOUT_MS = 25000;

function withTimeout<T>(promise: Promise<T>, fallback: T, ms: number = ACTION_TIMEOUT_MS): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
}

export function getBillGatewayInfo(bill: Bill) {
    const isProcessing = bill.items?.some(i => 
        i.feeItem?.name?.toLowerCase().includes('processing')
    ) || bill.note?.toLowerCase().includes('processing') || bill.billNumber?.includes('PROC');

    if (isProcessing) {
        return {
            id: 'paystack',
            name: 'Paystack Gateway',
            shortName: 'Paystack',
            categoryTitle: 'Portal Processing Fee',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
            indicator: '💚',
            description: 'Fast online card & transfer checkout via Paystack.'
        };
    }

    const hasTuition = bill.items?.some(i => 
        i.feeItem?.name?.toLowerCase().includes('tuition') || 
        i.feeItem?.category === 'tuition'
    ) || bill.note?.toLowerCase().includes('tuition') || bill.billNumber?.includes('TUI');

    if (hasTuition) {
        return {
            id: 'remita',
            name: 'Remita Gateway',
            shortName: 'Remita',
            categoryTitle: 'School Fees (Tuition)',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
            buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
            indicator: '🔵',
            description: 'Direct Remita payment for institutional tuition and academic fees.'
        };
    }

    return {
        id: 'alatpay',
        name: 'ALATPay Gateway',
        shortName: 'ALATPay',
        categoryTitle: 'Incidental & Ancillary Fees',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        buttonClass: 'bg-[#8A2132] hover:bg-[#721b29] text-white shadow-red-200',
        indicator: '🔴',
        description: 'Dedicated ALATPay account routing for ancillary, ICT, and incidental fees.'
    };
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
    const [activeTab, setActiveTab] = useState<'bills' | 'payments' | 'ledger'>('bills');
    
    // Payments State
    const [legacyPayments, setLegacyPayments] = useState<any[]>([]);
    const [subsequentOnlinePayments, setSubsequentOnlinePayments] = useState<any[]>([]);
    const [subsequentWalletPayments, setSubsequentWalletPayments] = useState<any[]>([]);

    // Checkout Modal State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [selectedAmount, setSelectedAmount] = useState<number>(0);
    const [paymentMode, setPaymentMode] = useState<'gateway' | 'wallet'>('gateway');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [completedTransactionId, setCompletedTransactionId] = useState<number | null>(null);
    const [checkoutError, setCheckoutError] = useState("");
    const [remitaData, setRemitaData] = useState<{rrr: string, reference: string} | null>(null);

    // Search filter state
    const [filterQuery, setFilterQuery] = useState("");

    const fetchData = useCallback(async () => {
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) return;

        try {
            const studentData = await withTimeout(getStudentByUserId(parseInt(userId)), null);
            if (!studentData) {
                setLoading(false);
                return;
            }
            setStudent(studentData as StudentProfile);
            const studentId = studentData.id;

            const [ledgerData, billsData, summaryData, settingsData, paymentHistory] = await Promise.all([
                withTimeout(getStudentLedger(studentId), []),
                withTimeout(getStudentBills(studentId), []),
                withTimeout(getStudentFinancialSummary(studentId), null),
                withTimeout(getBursarySettings(), {}),
                withTimeout(getStudentPaymentHistory(parseInt(userId), studentId), { success: false, data: null } as any)
            ]);
            setLedger(ledgerData as LedgerEntry[]);
            setBills(billsData as Bill[]);
            setSummary(summaryData as FinancialSummary);
            setSettings(settingsData);
            if (paymentHistory.success && paymentHistory.data) {
                setLegacyPayments(paymentHistory.data.legacyPayments);
                setSubsequentOnlinePayments(paymentHistory.data.subsequentOnlinePayments);
                setSubsequentWalletPayments(paymentHistory.data.subsequentWalletPayments);
            }
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
        setCompletedTransactionId(null);
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
                    const res = await withTimeout(
                        payBillWithWalletAction(student.id, selectedBill.id, selectedAmount),
                        { success: false, error: "Wallet payment is taking too long to respond. Please try again." } as any
                    );
                    if (res.success) {
                        setCheckoutSuccess(true);
                        setCompletedTransactionId((res as any).transactionId || null);
                        setTimeout(() => {
                            fetchData();
                        }, 1000);
                    } else {
                        setCheckoutError((res as any).error || "Wallet payment failed.");
                    }
                } catch (err) {
                    setCheckoutError("An unexpected error occurred during wallet payment.");
                } finally {
                    setCheckoutLoading(false);
                }
            } else {
                // Online checkout
                try {
                    const res = await withTimeout(
                        initializeOnlineCheckoutAction(student.id, selectedBill.id, selectedAmount),
                        { success: false, error: "Payment gateway is taking too long to respond. Please try again." } as any
                    );

                    if (res.success && res.rrr && !res.rrr.startsWith('RRR-MOCK-')) {
                        setRemitaData({ rrr: res.rrr, reference: res.reference || "" });
                    } else if (res.success && res.checkoutUrl) {
                        setCheckoutSuccess(true);
                        setTimeout(() => {
                            setIsCheckoutOpen(false);
                            window.location.href = `${res.checkoutUrl}&billId=${selectedBill.id}`;
                        }, 1000);
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

    // Filter bills and transactions
    const filteredBills = bills.filter(b => 
        b.billNumber.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (b.session?.name || "").toLowerCase().includes(filterQuery.toLowerCase()) ||
        (b.note || "").toLowerCase().includes(filterQuery.toLowerCase())
    );

    const filteredLedger = ledger.filter(entry => 
        entry.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (entry.transactionId || "").toString().includes(filterQuery)
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading secure billing portal...</p>
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
                        View Itemized School Bills • Modular Multi-Gateway Payments • Instant Receipts
                    </p>
                </div>
                <div className="relative z-10 flex flex-wrap gap-3 mt-6 md:mt-0">
                    <Button
                        variant="outline"
                        className="gap-2 h-11 px-5 rounded-xl border-white/20 text-white bg-white/10 hover:bg-white/20 hover:text-white font-bold text-xs transition-all shadow-sm backdrop-blur-md"
                        onClick={() => router.push("/student/finance/receipts")}
                    >
                        <Receipt className="w-4 h-4 text-emerald-400" />
                        All Receipts
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 h-11 px-5 rounded-xl border-white/20 text-white bg-white/10 hover:bg-white/20 hover:text-white font-bold text-xs transition-all shadow-sm backdrop-blur-md"
                        onClick={() => router.push("/student/finance/refund")}
                    >
                        <Undo2 className="w-4 h-4" />
                        Refunds
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 h-11 px-5 rounded-xl border-white/20 text-white bg-white/10 hover:bg-white/20 hover:text-white font-bold text-xs transition-all shadow-sm backdrop-blur-md"
                        onClick={() => window.print()}
                    >
                        <Printer className="w-4 h-4" />
                        Print Statement
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Total Outstanding Card */}
                <div className="bg-white rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl shadow-slate-100 border border-slate-100 group transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <ArrowDownCircle className="w-32 h-32 text-red-600" />
                    </div>
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 border border-red-100">
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        Outstanding School Bills
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">₦{totalOwedText}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {bills.filter(b => b.status !== 'paid').length} unpaid / partial bill(s) currently pending settlement.
                    </p>
                </div>

                {/* Total Paid / Settled Card */}
                <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-100 group transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <CheckCircle2 className="w-32 h-32 text-white" />
                    </div>
                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-2 opacity-90 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-200" /> Total Payments Settled
                    </p>
                    <h3 className="text-4xl font-black mb-4 tracking-tight">₦{totalPaidText}</h3>
                    <div className="flex gap-2">
                        <Button 
                            className="bg-white text-emerald-700 hover:bg-emerald-50 w-full font-black rounded-2xl h-12 shadow-md transition-all text-xs"
                            onClick={() => router.push("/student/finance/receipts")}
                        >
                            View All Payment Receipts
                        </Button>
                    </div>
                </div>

                {/* Multi-Gateway Policy Insight */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl group transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <CreditCard className="w-32 h-32 text-indigo-400" />
                    </div>
                    <CardHeader className="p-0 mb-3">
                        <CardTitle className="text-base flex items-center gap-2 font-bold tracking-tight text-indigo-300">
                            <Tag className="w-4 h-4" />
                            Smart Multi-Gateway Channels
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🔵</span>
                                <span className="font-bold text-slate-200">School Fees (Tuition)</span>
                            </div>
                            <span className="text-[10px] font-black bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                                Remita Gateway
                            </span>
                        </div>
                        <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🔴</span>
                                <span className="font-bold text-slate-200">Incidental / Ancillary</span>
                            </div>
                            <span className="text-[10px] font-black bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full border border-red-500/30">
                                ALATPay Gateway
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden border border-slate-100">
                <CardHeader className="border-b border-slate-100 bg-white/70 backdrop-blur-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight text-slate-900">
                                Student Payment &amp; Bills Hub
                            </CardTitle>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Select individual bills to pay or print receipts
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="pl-11 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 w-full h-11 transition-all outline-none font-medium"
                            placeholder="Search bills, items, or reference..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>

                <div className="bg-white border-b border-slate-100 flex justify-between items-center px-6 sm:px-8">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('bills')}
                            className={cn(
                                "py-4 text-xs font-black uppercase tracking-wider border-b-2 px-4 transition-all flex items-center gap-2",
                                activeTab === 'bills' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Layers className="w-4 h-4" />
                            My School Bills ({bills.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            className={cn(
                                "py-4 text-xs font-black uppercase tracking-wider border-b-2 px-4 transition-all flex items-center gap-2",
                                activeTab === 'payments' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Receipt className="w-4 h-4" />
                            Payment Receipts &amp; History ({subsequentOnlinePayments.length + subsequentWalletPayments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('ledger')}
                            className={cn(
                                "py-4 text-xs font-black uppercase tracking-wider border-b-2 px-4 transition-all flex items-center gap-2",
                                activeTab === 'ledger' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <History className="w-4 h-4" />
                            Account Ledger
                        </button>
                    </div>
                </div>

                <div className="p-6 sm:p-8 bg-slate-50/50 min-h-[400px]">
                    {/* TAB 1: MODULAR SCHOOL BILLS */}
                    {activeTab === 'bills' ? (
                        <div className="space-y-6">
                            {filteredBills.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h4 className="text-lg font-bold text-slate-700">No School Bills Generated</h4>
                                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                        You currently do not have any invoices assigned. Once bursary assigns fee structures for your session and level, they will appear here.
                                    </p>
                                </div>
                            ) : (
                                filteredBills.map((bill) => {
                                    const total = parseFloat(bill.totalAmount);
                                    const paid = parseFloat(bill.amountPaid || "0.00");
                                    const outstanding = total - paid;
                                    const isPaid = outstanding <= 0;
                                    const gateway = getBillGatewayInfo(bill);

                                    return (
                                        <div 
                                            key={bill.id} 
                                            className={cn(
                                                "bg-white rounded-[2rem] p-6 sm:p-8 border shadow-sm transition-all duration-300 hover:shadow-md",
                                                isPaid ? "border-emerald-100 bg-emerald-50/10" : "border-slate-200"
                                            )}
                                        >
                                            {/* Top Banner of Bill Card */}
                                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-100">
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2.5">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            Invoice #{bill.billNumber}
                                                        </span>
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5",
                                                            gateway.badgeClass
                                                        )}>
                                                            <span>{gateway.indicator}</span>
                                                            <span>{gateway.name}</span>
                                                        </span>
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                            isPaid ? "bg-emerald-100 text-emerald-800" :
                                                            paid > 0 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                                        )}>
                                                            {isPaid ? "Settled / Paid" : paid > 0 ? "Partially Paid" : "Unpaid / Due"}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-900 mt-1">
                                                        {bill.session?.name || "2026/2027"} {bill.note || gateway.categoryTitle}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 font-medium">
                                                        {gateway.description}
                                                    </p>
                                                </div>

                                                {/* Outstanding / Total Display */}
                                                <div className="flex items-center gap-6 self-end lg:self-auto bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Billed</p>
                                                        <p className="text-lg font-bold text-slate-700">₦{total.toLocaleString()}</p>
                                                    </div>
                                                    <div className="h-8 w-px bg-slate-200" />
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Paid So Far</p>
                                                        <p className="text-lg font-bold text-emerald-600">₦{paid.toLocaleString()}</p>
                                                    </div>
                                                    <div className="h-8 w-px bg-slate-200" />
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Balance Due</p>
                                                        <p className={cn("text-xl font-black", isPaid ? "text-emerald-600" : "text-rose-600")}>
                                                            ₦{outstanding.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Itemized Breakdown Table */}
                                            <div className="py-6">
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                    Itemized Fee Breakdown
                                                </h4>
                                                <div className="overflow-x-auto rounded-xl border border-slate-100">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                            <tr>
                                                                <th className="py-3 px-4">Fee Item</th>
                                                                <th className="py-3 px-4 text-right">Standard Amount</th>
                                                                <th className="py-3 px-4 text-right">Scholarship/Discount</th>
                                                                <th className="py-3 px-4 text-right">Net Payable</th>
                                                                <th className="py-3 px-4 text-right">Amount Paid</th>
                                                                <th className="py-3 px-4 text-center">Item Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 bg-white">
                                                            {bill.items?.map((item) => {
                                                                const itemPaid = parseFloat(item.amountPaid || "0.00");
                                                                const itemNet = parseFloat(item.amount);
                                                                const itemAid = (parseFloat(item.scholarshipApplied || "0.00") + parseFloat(item.discountApplied || "0.00"));
                                                                const itemOrig = parseFloat(item.originalAmount || item.amount);
                                                                const itemStatus = itemPaid >= itemNet ? 'paid' : itemPaid > 0 ? 'partial' : 'unpaid';

                                                                return (
                                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                                        <td className="py-3 px-4 font-bold text-slate-800">
                                                                            {item.feeItem?.name || `Item #${item.feeItemId}`}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-right text-slate-400">
                                                                            ₦{itemOrig.toLocaleString()}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-right text-indigo-600 font-medium">
                                                                            {itemAid > 0 ? `-₦${itemAid.toLocaleString()}` : '—'}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-right font-black text-slate-900">
                                                                            ₦{itemNet.toLocaleString()}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-right font-black text-emerald-600">
                                                                            ₦{itemPaid.toLocaleString()}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-center">
                                                                            <span className={cn(
                                                                                "inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                                                                itemStatus === 'paid' ? "text-emerald-700 bg-emerald-50 border border-emerald-200" :
                                                                                itemStatus === 'partial' ? "text-amber-700 bg-amber-50 border border-amber-200" :
                                                                                "text-slate-500 bg-slate-100 border border-slate-200"
                                                                            )}>
                                                                                {itemStatus === 'paid' ? 'Settled' : itemStatus === 'partial' ? 'Part' : 'Pending'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Action Buttons Footer */}
                                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="font-bold text-slate-700">Payment Gateway:</span>
                                                    <span className="font-medium">{gateway.name}</span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => router.push(`/finance/bill/${bill.id}`)}
                                                        className="h-11 px-5 text-xs font-black rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 gap-2"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                        View &amp; Print Bill
                                                    </Button>

                                                    {isPaid ? (
                                                        <Button
                                                            onClick={() => router.push("/student/finance/receipts")}
                                                            className="h-11 px-6 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-100"
                                                        >
                                                            <Receipt className="w-4 h-4" />
                                                            View Payment Receipts
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={() => openCheckout(bill)}
                                                            className={cn(
                                                                "h-11 px-6 text-xs font-black rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all gap-2",
                                                                gateway.buttonClass
                                                            )}
                                                        >
                                                            <CreditCard className="w-4 h-4" />
                                                            Pay via {gateway.shortName} (₦{outstanding.toLocaleString()})
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : activeTab === 'payments' ? (
                        /* TAB 2: COMPREHENSIVE PAYMENT HISTORY & RECEIPTS */
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase italic">
                                        Receipts &amp; Successful Payments
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                        Each payment generates an official verifiable digital receipt
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/student/finance/receipts")}
                                    className="gap-2 rounded-xl text-xs font-black"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Dedicated Receipt Portal
                                </Button>
                            </div>

                            {subsequentOnlinePayments.length === 0 && subsequentWalletPayments.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h4 className="text-lg font-bold text-slate-700">No Payments Recorded Yet</h4>
                                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                        Once you make a payment via Remita or ALATPay, your official receipt with transaction RRR/reference will appear here instantly.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Online Payments (Remita & ALATPay) */}
                                    {subsequentOnlinePayments.map((p) => {
                                        const isRemita = p.paymentMethod?.toLowerCase().includes('remita') || p.transactionType?.toLowerCase().includes('tuition');
                                        return (
                                            <div 
                                                key={p.id} 
                                                className="bg-white p-6 rounded-[1.8rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg",
                                                        isRemita ? "bg-rose-50 text-rose-600" : "bg-red-50 text-red-700"
                                                    )}>
                                                        {isRemita ? "🔵" : "🔴"}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-extrabold text-base text-slate-900">{p.transactionType}</h4>
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                                                                isRemita ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-red-50 text-red-700 border-red-200"
                                                            )}>
                                                                {isRemita ? "Remita" : "ALATPay"}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                            {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • Ref: {p.transactionReference || p.id}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 self-end md:self-auto">
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Amount Settled</p>
                                                        <h3 className="text-2xl font-black text-emerald-600">₦{parseFloat(p.amount).toLocaleString()}</h3>
                                                    </div>

                                                    <Button
                                                        onClick={() => window.open(`/finance/receipt/${p.id}`, '_blank')}
                                                        className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black gap-2 shadow-md"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                        Print Receipt
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Wallet Payments */}
                                    {subsequentWalletPayments.map((p) => (
                                        <div 
                                            key={p.id} 
                                            className="bg-white p-6 rounded-[1.8rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black">
                                                    <Wallet className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-extrabold text-base text-slate-900">{p.purpose}</h4>
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                                                            Digital Wallet
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                        {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • Ref: {p.gatewayReference || p.id}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 self-end md:self-auto">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Amount Deducted</p>
                                                    <h3 className="text-2xl font-black text-teal-600">₦{parseFloat(p.amount).toLocaleString()}</h3>
                                                </div>

                                                <Button
                                                    onClick={() => window.open(`/finance/receipt/${p.id}`, '_blank')}
                                                    className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black gap-2 shadow-md"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                    Print Receipt
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* TAB 3: TRANSACTION LEDGER */
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="py-4 px-6">Date</th>
                                                <th className="py-4 px-6">Description</th>
                                                <th className="py-4 px-6 text-right">Debit (Owed)</th>
                                                <th className="py-4 px-6 text-right">Credit (Paid)</th>
                                                <th className="py-4 px-6 text-right">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredLedger.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                                                        No transactions recorded in ledger.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredLedger.map((entry) => (
                                                    <tr key={entry.id} className="hover:bg-slate-50/50">
                                                        <td className="py-4 px-6 text-slate-500 font-bold whitespace-nowrap">
                                                            {new Date(entry.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="py-4 px-6 font-semibold text-slate-800">
                                                            {entry.description}
                                                        </td>
                                                        <td className="py-4 px-6 text-right font-bold text-rose-600">
                                                            {parseFloat(entry.debit) > 0 ? `₦${parseFloat(entry.debit).toLocaleString()}` : "—"}
                                                        </td>
                                                        <td className="py-4 px-6 text-right font-bold text-emerald-600">
                                                            {parseFloat(entry.credit) > 0 ? `₦${parseFloat(entry.credit).toLocaleString()}` : "—"}
                                                        </td>
                                                        <td className="py-4 px-6 text-right font-black text-slate-900 whitespace-nowrap">
                                                            ₦{parseFloat(entry.balance).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Premium Multi-Gateway Checkout Modal */}
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

                        <div className="p-6 sm:p-8 overflow-y-auto">
                            {(() => {
                                const gateway = getBillGatewayInfo(selectedBill);
                                return (
                                    <>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0",
                                                gateway.id === 'remita' ? "bg-rose-50 text-rose-600" : "bg-red-50 text-red-700"
                                            )}>
                                                {gateway.indicator}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900">
                                                    Secure Payment Checkout
                                                </h3>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    Designated Gateway: <strong className="text-slate-800">{gateway.name}</strong>
                                                </p>
                                            </div>
                                        </div>

                                        {checkoutSuccess ? (
                                            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 className="w-12 h-12" />
                                                </div>
                                                <h4 className="text-2xl font-black text-slate-900">Payment Completed!</h4>
                                                <p className="text-xs text-slate-500 max-w-sm">
                                                    Your payment for <strong>{selectedBill.billNumber}</strong> was successfully verified and applied to your account.
                                                </p>
                                                {completedTransactionId && (
                                                    <Button
                                                        onClick={() => window.open(`/finance/receipt/${completedTransactionId}`, '_blank')}
                                                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-11 px-6 text-xs gap-2 shadow-lg shadow-emerald-100"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                        Print Official Receipt
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsCheckoutOpen(false);
                                                        fetchData();
                                                    }}
                                                    className="text-xs font-bold"
                                                >
                                                    Done
                                                </Button>
                                            </div>
                                        ) : remitaData ? (
                                            <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
                                                <h4 className="text-lg font-black text-slate-900">Complete Remita Tuition Payment</h4>
                                                <p className="text-xs text-slate-500 mb-2">
                                                    RRR: <strong className="text-slate-900 font-mono text-sm">{remitaData.rrr}</strong>
                                                </p>
                                                <div className="w-full">
                                                    <RemitaInlineCheckout 
                                                        rrr={remitaData.rrr} 
                                                        amount={selectedAmount} 
                                                        email={session?.user?.email || "student@fssibadan.edu.ng"} 
                                                        firstName={student?.firstName || "Student"} 
                                                        lastName={student?.lastName || "Payer"} 
                                                        onSuccess={async () => {
                                                            setCheckoutLoading(true);
                                                            try {
                                                                const verify = await resolveOnlinePaymentAction(remitaData.reference, 'completed', selectedBill.id);
                                                                if (verify.success) {
                                                                    setCheckoutSuccess(true);
                                                                    setCompletedTransactionId((verify as any).transactionId || null);
                                                                    setTimeout(() => {
                                                                        fetchData();
                                                                    }, 1000);
                                                                } else {
                                                                    setCheckoutError("Payment verification failed. Please contact bursary.");
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
                                                        onClose={() => {}} 
                                                    />
                                                </div>
                                                <Button variant="ghost" className="mt-2 text-xs font-bold text-slate-500" onClick={() => setRemitaData(null)}>
                                                    Cancel Payment
                                                </Button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                                                {/* Bill details */}
                                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Bill Purpose:</span>
                                                        <span className="font-extrabold text-slate-800">
                                                            {selectedBill.note || gateway.categoryTitle}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Payment Channel:</span>
                                                        <span className="font-black text-indigo-600 uppercase">
                                                            {gateway.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Total Outstanding:</span>
                                                        <span className="font-black text-slate-900 text-sm">
                                                            ₦{(parseFloat(selectedBill.totalAmount) - parseFloat(selectedBill.amountPaid || "0.00")).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Amount selector */}
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
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                    Amount to Pay (₦)
                                                                </label>
                                                                {partPaymentEnabled && (
                                                                    <span className="text-[9px] text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                                                                        Installment (Min {minPercentage}%)
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <input
                                                                type="number"
                                                                required
                                                                min={minPayment}
                                                                max={outstanding}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-12 px-4 focus:ring-2 focus:ring-indigo-500 transition-all font-black text-slate-900 text-lg outline-none"
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
                                                        </div>
                                                    );
                                                })()}

                                                {/* Secure Gateway / Wallet selection */}
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
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
                                                            <p className="font-extrabold text-slate-800 text-xs">{gateway.name}</p>
                                                            <p className="text-[9px] text-slate-400 leading-tight mt-1">Cards, Transfer, USSD</p>
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
                                                            <p className="text-[9px] text-slate-400 leading-tight mt-1">Bal: ₦{walletBalanceText}</p>
                                                        </button>
                                                    </div>
                                                </div>

                                                {checkoutError && (
                                                    <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-xs font-bold flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                                        {checkoutError}
                                                    </div>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={checkoutLoading || selectedAmount <= 0}
                                                    className={cn(
                                                        "w-full text-white font-black h-12 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2",
                                                        gateway.buttonClass
                                                    )}
                                                >
                                                    {checkoutLoading ? (
                                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                                    ) : paymentMode === 'wallet' ? (
                                                        `Debit Wallet (₦${selectedAmount.toLocaleString()})`
                                                    ) : (
                                                        `Proceed to ${gateway.shortName} Checkout (₦${selectedAmount.toLocaleString()})`
                                                    )}
                                                </Button>
                                            </form>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
       </div>
    );
}
