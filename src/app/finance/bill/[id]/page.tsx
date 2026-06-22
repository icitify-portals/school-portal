"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBillForPrint } from "@/actions/bursary";
import { SchoolBillTemplate } from "@/components/finance/BillTemplates";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Download, Undo2, AlertCircle, FileText } from "lucide-react";

export default function BillPrintPage() {
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
        const res = await getBillForPrint(parseInt(params.id as string));
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
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Preparing School Bill...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl shadow-slate-200 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Bill Not Found</h2>
                    <p className="text-slate-500 mb-8">The school bill record you are looking for might have been moved or doesn&apos;t exist.</p>
                    <Button onClick={() => router.back()} className="w-full h-12 rounded-xl bg-slate-900">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const { bill, student, items, summary, branding, bursarySettings, billNote, schoolBillNote } = data;

    return (
        <div className="min-h-screen bg-slate-50 md:py-12 print:bg-white print:py-0">
            {/* Control Bar - Hidden during print */}
            <div className="max-w-3xl mx-auto mb-8 px-4 flex justify-between items-center print:hidden">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-slate-500 hover:text-slate-900">
                    <Undo2 className="w-4 h-4" />
                    Back
                </Button>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">
                        <FileText className="w-3.5 h-3.5" />
                        Bill: {bill.billNumber}
                    </div>
                    <Button variant="outline" onClick={handlePrint} className="gap-2 rounded-xl border-slate-200 text-slate-600">
                        <Printer className="w-4 h-4" />
                        Print Bill
                    </Button>
                    <Button className="gap-2 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 text-white" onClick={handlePrint}>
                        <Download className="w-4 h-4" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Bill Template Rendering */}
            <div className="px-4">
                <SchoolBillTemplate
                    bill={bill}
                    student={student}
                    items={items}
                    summary={summary}
                    branding={branding}
                    bursarySettings={bursarySettings}
                    billNote={billNote}
                    schoolBillNote={schoolBillNote}
                />
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                }
            `}</style>
        </div>
    );
}
