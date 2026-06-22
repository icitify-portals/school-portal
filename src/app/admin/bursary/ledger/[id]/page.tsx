"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    History,
    Search,
    Loader2,
    Printer,
    Download,
    ArrowLeft,
    Wallet,
    AlertCircle,
    CheckCircle,
    User,
    BadgeCheck,
    FileText,
    ArrowDownCircle,
    ArrowUpCircle
} from "lucide-react";
import { getStudentLedger, getStudentFinancialSummary } from "@/actions/bursary";
import { getStudentById } from "@/actions/students";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminStudentLedgerPage() {
    const { id } = useParams();
    const router = useRouter();
    const [ledger, setLedger] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const studentId = parseInt(id as string);
        const [ledgerData, summaryData, studentData] = await Promise.all([
            getStudentLedger(studentId),
            getStudentFinancialSummary(studentId),
            getStudentById(studentId)
        ]);
        setLedger(ledgerData);
        setSummary(summaryData);
        setStudent(studentData);
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredLedger = ledger.filter(entry =>
        entry.description.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium animate-pulse">Retrieving financial audit trail...</p>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Student not found.
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 print:p-0">
            {/* Header: Hidden on Print */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            Student Financial Ledger
                        </h2>
                        <p className="text-slate-500 mt-1">Audit trail for {student.firstName} {student.lastName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint} className="gap-2 border-slate-200">
                        <Printer className="w-4 h-4" />
                        Print Statement
                    </Button>
                    <Button className="bg-slate-900 hover:bg-slate-800 gap-2">
                        <Download className="w-4 h-4" />
                        Export Data
                    </Button>
                </div>
            </div>

            {/* Print Header: Only visible on Print */}
            <div className="hidden print:block text-center space-y-2 mb-10 border-b pb-8">
                <h1 className="text-4xl font-black uppercase tracking-tighter">Statement of Account</h1>
                <p className="text-slate-500 text-lg">Official Academic Financial Audit Trail</p>
                <div className="grid grid-cols-2 mt-8 text-left max-w-2xl mx-auto border p-6 rounded-xl">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 capitalize">Student Name</p>
                        <p className="font-bold">{student.firstName} {student.lastName}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 capitalize">Matric Number</p>
                        <p className="font-bold">{student.matricNumber || 'N/A'}</p>
                    </div>
                    <div className="mt-4">
                        <p className="text-[10px] font-bold text-slate-400 capitalize">Programme</p>
                        <p className="font-bold">{student.programme?.name}</p>
                    </div>
                    <div className="mt-4 text-right">
                        <p className="text-[10px] font-bold text-slate-400 capitalize">Statement Date</p>
                        <p className="font-bold">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4">
                <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                    <div className="h-1 bg-indigo-500" />
                    <CardContent className="p-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Balance Owed</p>
                        <h3 className={cn(
                            "text-2xl font-black mt-2",
                            (summary?.outstandingBalance || 0) > 0 ? "text-red-600" : "text-green-600"
                        )}>
                            {settings?.base_currency || '₦'}{summary?.outstandingBalance?.toLocaleString() || "0.00"}
                        </h3>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                    <div className="h-1 bg-emerald-500" />
                    <CardContent className="p-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wallet Credit</p>
                        <h3 className="text-2xl font-black mt-2 text-slate-900">
                            {settings?.base_currency || '₦'}{summary?.walletBalance?.toLocaleString() || "0.00"}
                        </h3>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                    <div className="h-1 bg-amber-500" />
                    <CardContent className="p-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Paid (Till Date)</p>
                        <h3 className="text-2xl font-black mt-2 text-slate-900">
                            {settings?.base_currency || '₦'}{summary?.totalPaid?.toLocaleString() || "0.00"}
                        </h3>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                    <div className="h-1 bg-slate-900" />
                    <CardContent className="p-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entries Count</p>
                        <h3 className="text-2xl font-black mt-2 text-slate-900">
                            {ledger.length}
                        </h3>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter Bar: Hidden on Print */}
            <div className="relative print:hidden">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    placeholder="Search ledger entries by description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Ledger Table */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden print:ring-0 print:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100">
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Description</th>
                                <th className="px-8 py-5">Debit (+)</th>
                                <th className="px-8 py-5">Credit (-)</th>
                                <th className="px-8 py-5">Running Balance</th>
                                <th className="px-8 py-5 text-right print:hidden">Ref</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 whitespace-nowrap">
                            {filteredLedger.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">
                                        No ledger activity found for this student.
                                    </td>
                                </tr>
                            ) : (
                                filteredLedger.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50 group">
                                        <td className="px-8 py-4 text-xs font-medium text-slate-500">
                                            {new Date(entry.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">{entry.description}</span>
                                                {entry.transaction?.gatewayReference && (
                                                    <span className="text-[10px] text-slate-400 font-mono">{entry.transaction.gatewayReference}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            {parseFloat(entry.debit) > 0 ? (
                                                <span className="text-sm font-bold text-red-600">{settings?.base_currency || '₦'}{parseFloat(entry.debit).toLocaleString()}</span>
                                            ) : "-"}
                                        </td>
                                        <td className="px-8 py-4">
                                            {parseFloat(entry.credit) > 0 ? (
                                                <span className="text-sm font-bold text-green-600">{settings?.base_currency || '₦'}{parseFloat(entry.credit).toLocaleString()}</span>
                                            ) : "-"}
                                        </td>
                                        <td className="px-8 py-4 font-black text-slate-900 border-l border-slate-50">
                                            {settings?.base_currency || '₦'}{parseFloat(entry.balance).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-4 text-right print:hidden">
                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                #{entry.transactionId || "SYS-" + entry.id}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Print Footer */}
            <div className="hidden print:flex justify-between items-center mt-20 border-t pt-10 text-slate-400">
                <div className="text-xs italic">
                    This is a computer-generated document. No signature is required.
                </div>
                <div className="text-xs font-bold uppercase tracking-widest">
                    Authorized Financial Record
                </div>
            </div>

            {/* Support Message */}
            <div className="bg-slate-50 p-6 rounded-2xl flex gap-4 items-start print:hidden">
                <AlertCircle className="w-6 h-6 text-indigo-500 shrink-0" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">About this Audit Trail</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        The running balance is calculated in real-time. Debits (Charges) increase the balance owed,
                        while Credits (Payments/Discounts) decrease it. A negative balance indicates a credit in
                        the student's favor.
                    </p>
                </div>
            </div>
        </div>
    );
}
