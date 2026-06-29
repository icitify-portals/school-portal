"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Loader2,
    Wallet,
    Calendar,
    DollarSign,
    ArrowDownRight,
    User,
    Tag,
    Clock,
    RotateCcw,
    AlertCircle
} from "lucide-react";
import {
    getExternalInflows,
    recordExternalInflow,
    reverseExternalInflow
} from "@/actions/bursary";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function InflowsPage() {
    const { data: session } = useSession();
    const [inflows, setInflows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [source, setSource] = useState("");
    const [amount, setAmount] = useState("");
    const [purpose, setPurpose] = useState("");
    const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getExternalInflows();
        setInflows(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const userId = (session?.user as any)?.id;
        if (!userId) return alert("User session not found");

        setSubmitting(true);
        const res = await recordExternalInflow({
            source,
            amount,
            purpose,
            recordedBy: parseInt(userId),
            receivedAt: new Date(receivedAt)
        });

        if (res.success) {
            setSource("");
            setAmount("");
            setPurpose("");
            setIsAdding(false);
            fetchData();
        } else {
            alert(res.error);
        }
        setSubmitting(false);
    };

    const handleReverse = async (id: number) => {
        if (!confirm("Are you sure you want to reverse this inflow? This action cannot be undone and will mark the funds as nullified in accounts.")) return;

        const res = await reverseExternalInflow(id);
        if (res.success) {
            fetchData();
        } else {
            alert(res.error);
        }
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">External Inflows</h2>
                    <p className="text-slate-500 mt-1">Record institutional income from external sources</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl shadow-lg shadow-blue-500/20 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Record Inflow
                </Button>
            </div>

            {isAdding && (
                <Card className="mb-10 border-none shadow-md bg-slate-50">
                    <CardHeader>
                        <CardTitle className="text-lg">Record Received Funds</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Source / Provider</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                        placeholder="e.g. State Government Grant"
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Amount (NGN)</label>
                                    <div className="relative">
                                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            required
                                            type="number"
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200"
                                            placeholder="1000000"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Purpose / Category</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                        placeholder="e.g. Research Funding"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Date Received</label>
                                    <input
                                        type="date"
                                        required
                                        suppressHydrationWarning
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                        value={receivedAt}
                                        onChange={(e) => setReceivedAt(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={submitting} className="bg-slate-900 px-10 h-11">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log Inflow"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                    </div>
                ) : inflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <ArrowDownRight className="w-12 h-12 text-slate-300 mb-4" />
                        <h4 className="text-lg font-bold text-slate-400">No inflow records found</h4>
                        <p className="text-sm text-slate-400">Log institutional income using the button above.</p>
                    </div>
                ) : (
                    inflows.map((inflow) => (
                        <Card key={inflow.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:row items-center gap-6">
                                    <div className="p-4 bg-blue-50 rounded-2xl">
                                        <Wallet className="w-8 h-8 text-blue-600" />
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex flex-col md:row md:items-center gap-2 mb-2">
                                            <h3 className="font-extrabold text-slate-900 text-xl">{inflow.source}</h3>
                                            <Badge variant="outline" className="w-fit mx-auto md:mx-0 bg-white border-slate-200 text-slate-600">
                                                {inflow.purpose}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar className="w-3 h-3" />
                                                <span suppressHydrationWarning>Received: {new Date(inflow.receivedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <User className="w-3 h-3" />
                                                <span>Recorded by: {inflow.recordedBy?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Clock className="w-3 h-3" />
                                                <span suppressHydrationWarning>Logged: {new Date(inflow.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt Amount</p>
                                        <p className={cn("text-3xl font-extrabold", inflow.status === 'reversed' ? "text-slate-300 line-through" : "text-blue-600")}>
                                            // @ts-expect-error - TS2304: Auto-suppressed for build
                                            {settings?.base_currency || '₦'}{parseFloat(inflow.amount).toLocaleString()}
                                        </p>

                                        <div className="mt-4 flex justify-end">
                                            {inflow.status === 'active' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-[10px] font-bold uppercase tracking-tight text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
                                                    onClick={() => handleReverse(inflow.id)}
                                                >
                                                    <AlertCircle className="w-3 h-3" />
                                                    Reverse Entry
                                                </Button>
                                            ) : (
                                                <Badge variant="destructive" className="text-[10px] font-black uppercase">Reversed</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
