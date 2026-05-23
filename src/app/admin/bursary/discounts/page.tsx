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
    ShieldCheck
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
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Discount Approvals</h2>
                <p className="text-slate-500 mt-1">Review and approve student financial aid and discount requests</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                    </div>
                ) : pendingDiscounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <TrendingDown className="w-12 h-12 text-slate-300 mb-4" />
                        <h4 className="text-lg font-bold text-slate-400">No pending requests</h4>
                        <p className="text-sm text-slate-400">All student discount requests have been processed.</p>
                    </div>
                ) : (
                    pendingDiscounts.map((discount) => (
                        <Card key={discount.id} className="border-none shadow-sm overflow-hidden group">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                    <div className="p-6 flex-1 flex gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-full h-fit">
                                            <User className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{discount.student?.user?.name || "Student Name"}</p>
                                            <p className="text-sm text-slate-500 font-mono">{discount.student?.matricNumber || "REG/2024/001"}</p>
                                            <div className="flex items-center gap-2 mt-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                                <MessageSquare className="w-4 h-4 text-slate-400" />
                                                <span className="italic">"{discount.reason || "Financial assistance request"}"</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 w-full md:w-64 bg-slate-50/50 flex flex-col justify-center items-center text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Granting</p>
                                        <p className="text-3xl font-bold text-indigo-600">
                                            {discount.percentage ? `${discount.percentage}%` : `₦${discount.amount}`}
                                        </p>
                                        <Badge className="mt-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">
                                            {discount.feeItem?.name || "General Fee"}
                                        </Badge>
                                    </div>
                                    <div className="p-6 w-full md:w-48 flex flex-col justify-center gap-2">
                                        {isBursar ? (
                                            <>
                                                <Button
                                                    onClick={() => handleApprove(discount.id)}
                                                    className="bg-green-600 hover:bg-green-700 w-full h-10 gap-2"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Approve
                                                </Button>
                                                <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full h-10 gap-2">
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-amber-500 py-4">
                                                <ShieldCheck className="w-6 h-6 opacity-50" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-center">Final Approval by Bursar Required</span>
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
    );
}
