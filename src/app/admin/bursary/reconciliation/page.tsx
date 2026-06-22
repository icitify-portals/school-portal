"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    RefreshCcw,
    Upload,
    Link as LinkIcon,
    X,
    Check,
    AlertCircle,
    FileText,
    Search,
    History,
    Landmark,
    ArrowRightLeft,
    ShieldCheck,
    CheckCircle2
} from "lucide-react";
import { getBankStatements, getReconciliationEntries, uploadBankStatement, matchEntry } from "@/actions/reconciliation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function BankReconciliationPage() {
    const { data: session } = useSession();
    const [statements, setStatements] = useState<any[]>([]);
    const [selectedStatement, setSelectedStatement] = useState<number | null>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [csvInput, setCsvInput] = useState("");
    const [matchingId, setMatchingId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const st = await getBankStatements();
        setStatements(st);
        if (selectedStatement === null && st.length > 0) {
            setSelectedStatement(st[0].id);
        }
        setLoading(false);
    };

    const fetchEntries = async (id: number) => {
        setLoading(true);
        const en = await getReconciliationEntries(id);
        setEntries(en);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedStatement) fetchEntries(selectedStatement);
    }, [selectedStatement]);

    const handleUpload = async () => {
        if (!session?.user) return;
        const res = await uploadBankStatement({
            filename: "Bank_Statement_" + new Date().toLocaleDateString() + ".csv",
            uploadedBy: (session.user as any).id,
            bankName: "Zenith Bank PLC",
            csvContent: csvInput
        });
        if (res.success) {
            setShowUpload(false);
            setCsvInput("");
            await fetchData();
            setSelectedStatement(res.statementId!);
        }
    };

    const handleMatch = async (entryId: number, ledgerId: number) => {
        setMatchingId(entryId);
        const res = await matchEntry(entryId, ledgerId);
        if (res.success) {
            await fetchEntries(selectedStatement!);
        }
        setMatchingId(null);
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
                        <Landmark className="w-8 h-8 text-blue-600" /> Bank Reconciliation
                    </h1>
                    <p className="text-slate-500 font-medium">Matching institutional ledgers with physical bank statement reality</p>
                </div>
                <Button onClick={() => setShowUpload(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest h-10 px-6 shadow-lg shadow-blue-100">
                    <Upload className="w-3 h-3" /> Upload Statement
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Statement History Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <History className="w-4 h-4" /> Statement History
                    </h2>
                    <div className="space-y-3">
                        {statements.map((st) => (
                            <div
                                key={st.id}
                                onClick={() => setSelectedStatement(st.id)}
                                className={cn(
                                    "p-4 rounded-2xl cursor-pointer transition-all border-2",
                                    selectedStatement === st.id ? "bg-white border-blue-600 shadow-md" : "bg-slate-50 border-transparent hover:bg-slate-100"
                                )}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className={cn("w-4 h-4", selectedStatement === st.id ? "text-blue-600" : "text-slate-400")} />
                                    <p className={cn("text-xs font-black uppercase tracking-tight", selectedStatement === st.id ? "text-slate-900" : "text-slate-500")}>
                                        {st.filename.slice(0, 20)}...
                                    </p>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                                    <span>{new Date(st.statementDate).toLocaleDateString()}</span>
                                    <span>{st.bankName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <ArrowRightLeft className="w-4 h-4" /> Matching Workspace
                        </h2>
                        {selectedStatement && (
                            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                {entries.filter(e => e.status === 'matched').length} / {entries.length} Balanced
                            </span>
                        )}
                    </div>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 italic bg-slate-50/50">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Bank Record</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Correlation</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Ledger Proposal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {entries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group h-24">
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm",
                                                        parseFloat(entry.credit) > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {parseFloat(entry.credit) > 0 ? "+" : "-"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{entry.description}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium uppercase truncate w-48">
                                                            Ref: {entry.reference} • {new Date(entry.transactionDate).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-xs font-black text-slate-900 mt-1">
                                                            {settings?.base_currency || '₦'}{Number(parseFloat(entry.credit) > 0 ? entry.credit : entry.debit).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                {entry.status === 'matched' ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        <span className="text-[10px] font-black uppercase text-emerald-500">Perfect Match</span>
                                                    </div>
                                                ) : entry.suggestedMatch ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <LinkIcon className="w-5 h-5 text-blue-400 animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase text-blue-400">Deep Link Found</span>
                                                    </div>
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 text-slate-200 mx-auto" />
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                {entry.status === 'matched' ? (
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase">Matched to GL Entry</p>
                                                        <p className="text-xs font-bold text-slate-900">#{entry.matchedLedgerId}</p>
                                                    </div>
                                                ) : entry.suggestedMatch ? (
                                                    <div className="flex flex-col items-end gap-3">
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-blue-600 uppercase italic">Internal Suggestion</p>
                                                            <p className="text-xs font-bold text-slate-900 truncate w-48">{entry.suggestedMatch.description}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase">Match probability: 98%</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleMatch(entry.id, entry.suggestedMatch.id)}
                                                            className="h-7 text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-emerald-600 transition-all border-none"
                                                            disabled={matchingId === entry.id}
                                                        >
                                                            {matchingId === entry.id ? <RefreshCcw className="w-3 h-3 animate-spin" /> : "Confirm Match"}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] font-black text-slate-400 uppercase italic">Anomaly Detected • No Ledger Match</p>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest italic">Institutional Data Upload</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-slate-500 font-medium">Paste CSV content (Date, Description, Reference, Debit, Credit) to simulate a bank statement upload.</p>
                            <textarea
                                className="w-full h-48 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                                placeholder="2026-02-01,Student Fee - ID4022,REF-9921,,50000"
                                value={csvInput}
                                onChange={(e) => setCsvInput(e.target.value)}
                            />
                            <div className="flex gap-3">
                                <Button onClick={handleUpload} className="flex-1 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl">
                                    Process Statement
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
