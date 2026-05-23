"use client";

import { useState } from "react";
import { 
    Library, 
    Book, 
    Users, 
    Calculator, 
    AlertTriangle, 
    CheckCircle, 
    Loader2, 
    ArrowRightLeft, 
    History 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateAndApplyFines } from "@/actions/library";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LibraryAdminPage() {
    const [calculating, setCalculating] = useState(false);

    const handleCalculateFines = async () => {
        setCalculating(true);
        const res = await calculateAndApplyFines();
        if (res.success) {
            toast.success(`Fines processed! Total Amount: ₦${(res as any).totalAmount}`);
        } else {
            toast.error(res.error || "Failed to calculate fines");
        }
        setCalculating(false);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <Library className="w-10 h-10 text-indigo-600" />
                        Librarian Command
                    </h1>
                    <p className="text-slate-500 font-medium">Manage collection, circulation, and automated fine enforcement.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Fine Calculation Card */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-rose-500 text-white p-8">
                        <CardTitle className="flex items-center gap-2 italic uppercase tracking-tight text-xl">
                            <AlertTriangle className="w-6 h-6" />
                            Fine Enforcement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                            Automatically identify overdue items and apply fines based on the institutional library policy (₦50/day).
                        </p>
                        <Button 
                            onClick={handleCalculateFines}
                            disabled={calculating}
                            className="w-full bg-rose-600 hover:bg-rose-700 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-rose-200"
                        >
                            {calculating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Calculator className="w-5 h-5 mr-2" />}
                            Run Batch Calculation
                        </Button>
                    </CardContent>
                </Card>

                {/* Circulation Card */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-indigo-600 text-white p-8">
                        <CardTitle className="flex items-center gap-2 italic uppercase tracking-tight text-xl">
                            <ArrowRightLeft className="w-6 h-6" />
                            Circulation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                            Process book checkouts and returns using the integrated barcode scanning system.
                        </p>
                        <Button 
                            variant="outline"
                            className="w-full border-indigo-100 hover:bg-indigo-50 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-indigo-600"
                            asChild
                        >
                            <a href="/library/scan">Open Scan Module</a>
                        </Button>
                    </CardContent>
                </Card>

                {/* Inventory Card */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white p-8">
                        <CardTitle className="flex items-center gap-2 italic uppercase tracking-tight text-xl">
                            <Book className="w-6 h-6" />
                            Catalog
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                            Add new acquisitions to the digital catalog and update existing resource metadata.
                        </p>
                        <Button 
                            variant="outline"
                            className="w-full border-slate-200 hover:bg-slate-50 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-900"
                        >
                            Manage Resources
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Overdue Books", value: "12", color: "text-rose-600" },
                    { label: "Total Fine Revenue", value: "₦4,500", color: "text-emerald-600" },
                    { label: "Active Loans", value: "148", color: "text-indigo-600" },
                    { label: "New Returns", value: "5", color: "text-blue-600" },
                ].map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm rounded-2xl p-6 bg-white">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <p className={cn("text-2xl font-black italic", stat.color)}>{stat.value}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}


