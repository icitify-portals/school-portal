"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Loader2,
    RefreshCw,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    Activity,
    Wallet
} from "lucide-react";
import { predictCashFlow } from "@/actions/ai";
import { cn } from "@/lib/utils";

export default function ForecastingPage() {
    const [forecast, setForecast] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        handleForecast();
    }, []);

    const handleForecast = async () => {
        setRefreshing(true);
        const res = await predictCashFlow();
        if (res.success) {
            setForecast(res.data);
        }
        setRefreshing(false);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium animate-pulse">AI is calculating 6-month liquidity trends...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-indigo-600" />
                        Liquidity Forecasting
                    </h2>
                    <p className="text-slate-500 mt-1">Predictive AI cash flow analysis for the next 6 months</p>
                </div>
                <Button
                    onClick={handleForecast}
                    disabled={refreshing}
                    className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl gap-2 shadow-lg shadow-indigo-500/20"
                >
                    {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh Projection
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <Card className="border-none shadow-sm bg-slate-900 text-white col-span-1">
                    <CardContent className="p-6">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Liquidity Health</p>
                        <div className="flex items-end gap-2">
                            <h3 className="text-4xl font-black">{forecast?.healthScore}%</h3>
                        </div>
                        <div className="mt-4 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all duration-1000",
                                    (forecast?.healthScore || 0) > 70 ? "bg-emerald-400" :
                                        (forecast?.healthScore || 0) > 40 ? "bg-amber-400" : "bg-rose-400"
                                )}
                                style={{ width: `${forecast?.healthScore || 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-white border border-slate-100">
                        <CardContent className="p-6">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Projected Inflow</p>
                                    <h4 className="text-xl font-bold text-slate-900">
                                        {settings?.base_currency || '₦'}{forecast?.projections?.reduce((s: number, p: any) => s + (p.inflow || 0), 0).toLocaleString()}
                                    </h4>
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white border border-slate-100">
                        <CardContent className="p-6">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Projected Outflow</p>
                                    <h4 className="text-xl font-bold text-slate-900">
                                        {settings?.base_currency || '₦'}{forecast?.projections?.reduce((s: number, p: any) => s + (p.outflow || 0), 0).toLocaleString()}
                                    </h4>
                                </div>
                                <ArrowDownRight className="w-5 h-5 text-rose-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-indigo-50/50 border border-indigo-100">
                        <CardContent className="p-6">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Net Cash Impact</p>
                                    <h4 className="text-xl font-bold text-indigo-900 font-mono">
                                        {settings?.base_currency || '₦'}{(forecast?.projections?.reduce((s: number, p: any) => s + (p.net || 0), 0)).toLocaleString()}
                                    </h4>
                                </div>
                                <Activity className="w-5 h-5 text-indigo-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Projections Table */}
                <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Monthly Liquidity Runway
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Month</th>
                                        <th className="text-right py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Inflow</th>
                                        <th className="text-right py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Outflow</th>
                                        <th className="text-right py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Net Position</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {forecast?.projections?.map((p: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 font-bold text-slate-700">{p.month}</td>
                                            <td className="py-4 text-right text-emerald-600 font-medium">{settings?.base_currency || '₦'}{p.inflow.toLocaleString()}</td>
                                            <td className="py-4 text-right text-rose-600 font-medium">{settings?.base_currency || '₦'}{p.outflow.toLocaleString()}</td>
                                            <td className={cn(
                                                "py-4 text-right font-black",
                                                p.net >= 0 ? "text-slate-900" : "text-rose-700"
                                            )}>
                                                {p.net < 0 ? "-" : "+"}{settings?.base_currency || '₦'}{Math.abs(p.net).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Insights */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 opacity-90">
                                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                                Sentinel AI Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {forecast?.insights?.map((insight: string, idx: number) => (
                                <div key={idx} className="flex gap-3 items-start bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0 mt-1.5" />
                                    <p className="text-xs leading-relaxed font-medium">{insight}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white border border-slate-100">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Target className="w-4 h-4 text-slate-400" />
                                Recommended Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Based on the 6-month runway, the institution should focus on:
                            </p>
                            <div className="space-y-2">
                                <div className="p-3 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-600 flex items-center gap-2 border border-slate-100">
                                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                                    Optimizing operational expenditure in low-inflow months.
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-600 flex items-center gap-2 border border-slate-100">
                                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                                    Allocating surplus to capital development funds.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
