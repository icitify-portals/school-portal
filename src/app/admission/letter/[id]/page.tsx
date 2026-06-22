"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getApplicantStatusData } from "@/actions/admission_v2";
import { generateAdmissionLetterAction } from "@/actions/result-management";
import { Loader2, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdmissionLetterPage() {
    const params = useParams();
    const id = parseInt(params.id as string);
    const [data, setData] = useState<any>(null);
    const [letter, setLetter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const statusRes = await getApplicantStatusData(id);
            setData(statusRes);

            if (statusRes && statusRes.status === 'admitted') {
                const requireAcceptanceFee = statusRes.template?.requireAcceptanceFee;
                const acceptancePaid = statusRes.acceptancePaymentStatus === 'paid';
                
                if (!requireAcceptanceFee || acceptancePaid) {
                    const letterRes = await generateAdmissionLetterAction(id);
                    if (letterRes.success) {
                        setLetter(letterRes.data);
                    } else {
                        setError(letterRes.error || "Failed to generate admission letter.");
                    }
                }
            }
        } catch (e: any) {
            setError(e.message || "An error occurred.");
        }
        setLoading(false);
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!data || data.status !== 'admitted') return <div className="min-h-screen flex justify-center items-center font-black text-2xl uppercase text-slate-300">Letter Not Available</div>;

    const requireAcceptanceFee = data.template?.requireAcceptanceFee;
    const acceptancePaid = data.acceptancePaymentStatus === 'paid';
    
    if (requireAcceptanceFee && !acceptancePaid) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-8 text-center space-y-6">
                <div className="p-8 bg-rose-50 rounded-[3rem] text-rose-500 shadow-xl">
                    <ShieldCheck className="w-16 h-16 animate-pulse" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h4 className="text-3xl font-black text-slate-900 italic uppercase">Admission Letter Locked</h4>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                        You must pay the non-refundable acceptance fee before you can view or print your official admission letter.
                    </p>
                </div>
                <Button onClick={() => window.history.back()} className="rounded-2xl bg-slate-900 text-white font-black px-8 py-4 uppercase text-xs tracking-widest hover:bg-slate-800">
                    Go Back
                </Button>
            </div>
        );
    }

    if (error || !letter) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-8 text-center space-y-6">
                <div className="p-8 bg-slate-100 rounded-[3rem] text-slate-400">
                    <ShieldCheck className="w-16 h-16" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h4 className="text-2xl font-black text-slate-900 italic uppercase">Error Generating Letter</h4>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                        {error || "We could not compile your admission letter because your student profile or matriculation details are still processing. Please contact registration support."}
                    </p>
                </div>
                <Button onClick={() => window.history.back()} className="rounded-2xl bg-slate-900 text-white font-black px-8 py-4 uppercase text-xs tracking-widest hover:bg-slate-800">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 py-20 px-4 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Print Control */}
                <div className="flex justify-between items-center print:hidden">
                    <Button variant="ghost" onClick={() => window.history.back()} className="rounded-xl font-bold">Back to Status</Button>
                    <Button onClick={() => window.print()} className="bg-slate-900 text-white font-black px-8 py-6 rounded-2xl shadow-xl flex gap-3 uppercase text-xs tracking-widest">
                        <Printer className="w-5 h-5" /> Print Admission Letter
                    </Button>
                </div>

                {/* The Letter */}
                <div className="bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-slate-200 print:shadow-none print:border-none print:rounded-none min-h-[11in] p-16 md:p-24 space-y-12">
                    <style dangerouslySetInnerHTML={{ __html: letter.css }} />
                    <div dangerouslySetInnerHTML={{ __html: letter.html }} />
                </div>
            </div>
        </div>
    );
}
