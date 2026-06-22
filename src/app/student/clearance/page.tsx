"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    XCircle,
    ShieldCheck,
    QrCode,
    Download,
    Printer,
    Info,
    CreditCard,
    AlertTriangle,
    ArrowRight,
    RefreshCw,
    GraduationCap
} from "lucide-react";
import { getStudentClearance, syncClearanceStatus } from "@/actions/clearance";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function StudentClearancePage() {
    const { data: session } = useSession();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const fetchData = async () => {
        if (!session?.user) return;
        const res = await getStudentClearance((session.user as any).id);
        setData(res);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [session]);

    const handleSync = async () => {
        if (!data?.student) return;
        setSyncing(true);
        await syncClearanceStatus(data.student.id, "2025/2026", "both");
        await fetchData();
        setSyncing(false);
    };

    if (loading) return <div className="p-8 text-center font-bold animate-pulse text-slate-400 mt-20 uppercase tracking-widest text-xs">Accessing Financial Vault...</div>;

    const stats = data?.stats;
    const isCleared = stats?.existing?.status === 'cleared';

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="text-center lg:text-left">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">My Exam Clearance</h1>
                <p className="text-slate-500 font-medium">Verification status for 2025/2026 Academic Session</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Status Card */}
                <div className="space-y-6">
                    <Card className={cn(
                        "border-none shadow-xl relative overflow-hidden",
                        isCleared ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"
                    )}>
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    {isCleared ? <CheckCircle2 className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Current Status</span>
                            </div>

                            <h2 className="text-4xl font-black mb-2 uppercase tracking-tight">
                                {isCleared ? "FULLY CLEARED" : "CLEARANCE PENDING"}
                            </h2>
                            <p className="text-sm font-medium opacity-80">
                                {isCleared
                                    ? "You are eligible to participate in all examination exercises."
                                    : "Please complete your minimum fee payment to access your exam permit."}
                            </p>

                            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase opacity-60">Session</p>
                                    <p className="font-bold">2025/2026</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase opacity-60">Code</p>
                                    <p className="font-mono font-bold tracking-tighter">
                                        {stats?.existing?.clearanceCode?.slice(0, 8) || "--------"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Card */}
                    <Card className="border-none shadow-sm bg-white border border-slate-100">
                        <CardContent className="p-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Financial Completion
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-700">Payment Level</span>
                                        <span className="text-sm font-black text-indigo-600">{stats?.percentagePaid.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-1000 shadow-sm",
                                                stats?.percentagePaid >= stats?.threshold ? "bg-emerald-500" : "bg-indigo-600"
                                            )}
                                            style={{ width: `${stats?.percentagePaid}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">Threshold: {stats?.threshold}%</span>
                                        <button
                                            onClick={handleSync}
                                            disabled={syncing}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline underline-offset-4"
                                        >
                                            <RefreshCw className={cn("w-2.5 h-2.5", syncing && "animate-spin")} /> Re-Sync Ledger
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Bill</p>
                                        <p className="text-lg font-black text-slate-900">{settings?.base_currency || '₦'}{Number(stats?.totalDebit).toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Paid</p>
                                        <p className="text-lg font-black text-emerald-600">{settings?.base_currency || '₦'}{Number(stats?.totalCredit).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {!isCleared && (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-900 mb-1">Attention Required</p>
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                    You need to pay at least **{settings?.base_currency || '₦'}{(stats?.totalDebit * (stats?.threshold / 100) - stats?.totalCredit).toLocaleString()}** more to reach the {stats?.threshold}% clearance threshold.
                                </p>
                                <Link href="/student/finance">
                                    <Button variant="link" className="p-0 h-auto text-amber-800 font-black uppercase text-[10px] tracking-widest mt-2 gap-1">
                                        Proceed to Payment <ArrowRight className="w-3 h-3" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Permit Side */}
                <div className="space-y-6">
                    {isCleared ? (
                        <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-slate-100 rotate-1">
                            <div className="border-[6px] border-emerald-600 rounded-2xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full opacity-50" />

                                <div className="flex items-center gap-3 mb-10 relative">
                                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                        <GraduationCap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase text-lg leading-tight">Exam Pass</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Digital Admission Token</p>
                                    </div>
                                </div>

                                <div className="space-y-6 mb-10 relative">
                                    <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Student Name</p>
                                            <p className="font-bold text-slate-900 border-l-4 border-emerald-600 pl-3 uppercase">
                                                {session?.user?.name}
                                            </p>
                                        </div>
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                            <QrCode className="w-10 h-10 text-slate-900" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Matric Number</p>
                                            <p className="font-bold text-slate-900 uppercase">
                                                {data?.student?.id.toString().padStart(6, '0')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Level / Session</p>
                                            <p className="font-bold text-slate-900 uppercase">400L / 25-26</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-2xl p-6 text-white relative h-24 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase opacity-50">Authorized Signature</p>
                                        <p className="font-serif italic text-lg opacity-90 mt-1">Institutional Bursar</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                                            <ShieldCheck className="w-3 h-3" />
                                            <span className="text-[10px] font-black uppercase">Verified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 flex gap-4 mt-2">
                                <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-[10px] tracking-widest gap-2 h-12 rounded-2xl">
                                    <Download className="w-4 h-4" /> Download PDF
                                </Button>
                                <Button variant="outline" className="w-12 h-12 rounded-2xl border-slate-200">
                                    <Printer className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <QrCode className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="font-black text-slate-400 uppercase tracking-tighter text-xl">Exam Permit Locked</h3>
                            <p className="text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
                                Your digital admission pass will be generated automatically once your financial standing is cleared.
                            </p>
                        </div>
                    )}

                    <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-2xl italic">
                        <Info className="w-4 h-4 text-slate-400 mt-0.5" />
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                            A minimum payment of **{stats?.threshold}%** is required for eligibility. If you have recently made a payment, please use the **Re-Sync** button above to refresh your standing.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
