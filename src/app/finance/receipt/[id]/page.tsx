
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTransactionForReceipt } from "@/actions/bursary";
import { ModernReceipt, ClassicReceipt, MinimalistReceipt } from "@/components/finance/ReceiptTemplates";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Download, Undo2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReceiptPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getTransactionForReceipt(parseInt(params.id as string));
        if (res) {
            setData(res);
        }
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Generating Digital Receipt...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Receipt Not Found</h2>
                    <p className="text-slate-500 mb-8">The transaction record you are looking for might have been moved or deleted.</p>
                    <Button onClick={() => router.back()} className="w-full h-12 rounded-xl bg-slate-900">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const { transaction, student, programme, branding, template, bursar, arrears, bursarySettings } = data;

    // Enrich student data with programme info for templates
    const enrichedStudent = { ...student, programme };

    return (
        <div className="min-h-screen bg-slate-50 md:py-12 print:bg-white print:py-0">
            {/* Control Bar - Hidden during print */}
            <div className="max-w-2xl mx-auto mb-8 px-4 flex justify-between items-center print:hidden">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-slate-500 hover:text-slate-900">
                    <Undo2 className="w-4 h-4" />
                    Back
                </Button>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handlePrint} className="gap-2 rounded-xl border-slate-200 text-slate-600">
                        <Printer className="w-4 h-4" />
                        Print Receipt
                    </Button>
                    <Button className="gap-2 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 text-white" onClick={handlePrint}>
                        <Download className="w-4 h-4" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Template Rendering */}
            <div className="px-4">
                {template === 'classic' ? (
                    <ClassicReceipt transaction={transaction} student={enrichedStudent} branding={branding} bursar={bursar} arrears={arrears} bursarySettings={bursarySettings} />
                ) : template === 'minimalist' ? (
                    <MinimalistReceipt transaction={transaction} student={enrichedStudent} branding={branding} bursar={bursar} arrears={arrears} bursarySettings={bursarySettings} />
                ) : (
                    <ModernReceipt transaction={transaction} student={enrichedStudent} branding={branding} bursar={bursar} arrears={arrears} bursarySettings={bursarySettings} />
                )}
            </div>

            {/* Footer Notice - Hidden during print */}
            <div className="max-w-2xl mx-auto mt-12 px-4 text-center print:hidden">
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Verified digital copy. Authenticated by the Bursary Department.
                    <br />
                    Verify this receipt online by scanning the reference number or contact support.
                </p>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        background: white !important;
                    }
                    nav, aside, header, footer, .print-hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
