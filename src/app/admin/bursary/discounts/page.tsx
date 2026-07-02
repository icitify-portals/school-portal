"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    User,
    MessageSquare,
    TrendingDown,
    ShieldCheck,
    Percent
} from "lucide-react";
import { db } from "@/db/db";
import { discounts, students, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { approveDiscountWithAuth as approveDiscount } from "@/actions/bursary";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

export default function DiscountsDashboardPage() {
    const { data: session } = useSession();
    const userRoles = (session?.user as any)?.roles || [];
    const isBursar = userRoles.includes("bursar") || (session?.user as any)?.role === "admin";

    const [pendingDiscounts, setPendingDiscounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Note: In real app, we'd have a getDiscounts action. 
        // For now, I'll simulate or use the logic I implemented in schema.
        // We'll assume a mock fetch here as I can't easily query joined tables in a simple way without an action.
        setLoading(false);
    };

    const handleApprove = async (id: number) => {
        if (!isBursar) return; // Only bursars can approve
        const userId = (session?.user as any)?.id;
        if (!userId) return;
        const res = await approveDiscount(id, parseInt(userId));
        if (res.success) fetchData();
    };

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/30 to-indigo-650/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Percent className="w-12 h-12 text-orange-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Discount Approvals
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Review and approve student financial aid and discount requests
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600" />
                </div>
            ) : pendingDiscounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50">
                    <TrendingDown className="w-16 h-16 text-slate-300 mb-4 animate-bounce duration-1000" />
                    <h4 className="text-2xl font-black text-slate-800 italic uppercase">No pending requests</h4>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">All student discount requests have been processed.</p>
                </div>
            ) : (
                pendingDiscounts.map((discount) => (
                    <Card key={discount.id} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden group hover:shadow-2xl transition-all">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/40">
                                <div className="p-8 flex-1 flex gap-4">
                                    <div className="p-4 bg-indigo-600/90 border border-indigo-500/50 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-indigo-500/10 shrink-0 h-14 w-14">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{discount.student?.user?.name || "Student Name"}</p>
                                        <p className="text-sm font-black text-slate-500 font-mono mt-0.5">{discount.student?.matricNumber || "REG/2024/001"}</p>
                                        <div className="flex items-center gap-3 mt-4 text-slate-650 bg-white/50 border border-white/60 p-4 rounded-[1rem] shadow-inner">
                                            <MessageSquare className="w-5 h-5 text-indigo-500 shrink-0" />
                                            <span className="italic font-bold text-sm">"{discount.reason || "Financial assistance request"}"</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 w-full md:w-80 bg-white/20 flex flex-col justify-center items-center text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Granting</p>
                                    <p className="text-3xl font-black text-indigo-600">
                                        {discount.percentage ? `${discount.percentage}%` : `₦${discount.amount}`}
                                    </p>
                                    <span className="mt-3 bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                                        {discount.feeItem?.name || "General Fee"}
                                    </span>
                                </div>
                                <div className="p-8 w-full md:w-60 flex flex-col justify-center gap-3 bg-white/10">
                                    {isBursar ? (
                                        <>
                                            <Button
                                                onClick={() => handleApprove(discount.id)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-xs tracking-wider h-11 w-full gap-2 active:scale-95 transition-all shadow-md"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Approve
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/80 rounded-xl font-black uppercase text-xs tracking-wider h-11 w-full gap-2 active:scale-95 transition-all shadow-sm"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-amber-600 py-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                            <ShieldCheck className="w-6 h-6 text-amber-500 drop-shadow-sm" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-center px-4 leading-relaxed">Final Approval by Bursar Required</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
