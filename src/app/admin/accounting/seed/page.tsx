"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { seedBursaryData } from "@/actions/seed";
import { cn } from "@/lib/utils";

export default function SeederPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

    const handleSeed = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const res = await seedBursaryData();
            setStatus({ success: true, message: "System populated with 2026 Institutional Data!" });
        } catch (e) {
            setStatus({ success: false, message: (e as Error).message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 flex items-center justify-center min-h-[80vh]">
            <Card className="max-w-md w-full border-none shadow-2xl ring-1 ring-slate-100 overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8 space-y-2">
                    <div className="bg-white/10 w-fit p-3 rounded-2xl mb-2">
                        <Database className="w-8 h-8 text-indigo-400" />
                    </div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">System Seeder</CardTitle>
                    <p className="text-slate-400 text-sm font-medium">Populate Bursary & ERP modules with sample 2026 data</p>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-700 font-medium leading-relaxed">
                            This will generate: Chart of Accounts, Vendors, Budgets, Fixed Assets, and Opening Ledger entries. Perfect for testing P&L and Balance Sheets.
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-lg font-bold gap-3"
                            onClick={handleSeed}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Database className="w-6 h-6" />}
                            Seed Institutional Data
                        </Button>

                        {status && (
                            <div className={cn(
                                "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2",
                                status.success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            )}>
                                {status.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                <p className="text-sm font-bold">{status.message}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
