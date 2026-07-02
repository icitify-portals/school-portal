"use client";

import { useEffect, useState } from "react";
import { getBursaryDashboardSummary } from "@/actions/bursary";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Wallet, ArrowDownRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryData {
    totalGenerated: number;
    totalBudget: number;
    totalSpent: number;
    totalPendingOutflow: number;
}

export function BursarySummaryCards({ session }: { session?: string }) {
    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSummary() {
            setLoading(true);
            try {
                const result = await getBursaryDashboardSummary(session);
                setData(result);
            } catch (error) {
                console.error("Failed to load bursary summary:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSummary();
    }, [session]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse bg-slate-50 border-none h-[120px]" />
                ))}
            </div>
        );
    }

    if (!data) return null;

    const cards = [
        {
            title: "Total Revenue Generated",
            amount: data.totalGenerated,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            trend: "All completed payments"
        },
        {
            title: "Total Active Budget",
            amount: data.totalBudget,
            icon: Wallet,
            color: "text-blue-600",
            bg: "bg-blue-50",
            trend: "Approved allocations"
        },
        {
            title: "Total Spent (Disbursed)",
            amount: data.totalSpent,
            icon: ArrowDownRight,
            color: "text-rose-600",
            bg: "bg-rose-50",
            trend: "Completed expenditures"
        },
        {
            title: "Pending Outflows",
            amount: data.totalPendingOutflow,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
            trend: "Awaiting approval/disbursement"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <Card key={index} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all">
                    <div className={cn("absolute right-0 top-0 w-32 h-32 rounded-full -mr-10 -mt-10 opacity-30 transition-transform group-hover:scale-110 duration-500", card.bg)} />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-3 rounded-2xl border shadow-sm", 
                                card.color.includes("emerald") ? "bg-emerald-50 text-emerald-700 border-emerald-250" :
                                card.color.includes("blue") ? "bg-blue-50 text-blue-700 border-blue-250" :
                                card.color.includes("rose") ? "bg-rose-50 text-rose-700 border-rose-250" :
                                "bg-amber-50 text-amber-700 border-amber-250"
                            )}>
                                <card.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{card.title}</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                            {formatCurrency(card.amount)}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide opacity-80">
                            {card.trend}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
