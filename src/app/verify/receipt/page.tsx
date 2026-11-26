"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ReceiptVerifyLookupPage() {
    const router = useRouter();
    const [refInput, setRefInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleaned = refInput.trim();
        if (!cleaned) return;
        router.push(`/verify/receipt/${encodeURIComponent(cleaned)}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg space-y-6">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto ring-1 ring-slate-200">
                        <ShieldCheck className="w-9 h-9 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        Official Receipt Verification
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Enter a payment reference or Remita RRR to verify authenticity against the live school portal database.
                    </p>
                </div>

                <Card className="border border-slate-200 shadow-xl rounded-2xl bg-white">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    value={refInput}
                                    onChange={(e) => setRefInput(e.target.value)}
                                    placeholder="e.g. SCH-684-..., 171543763498, or UUID reference"
                                    className="pl-10 h-12 rounded-xl font-mono text-sm"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                            >
                                Verify Receipt
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-400">
                    Federal School of Statistics, Ibadan • Official Bursary Anti-Forgery Registry
                </p>
            </div>
        </div>
    );
}
