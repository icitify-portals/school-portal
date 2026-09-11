"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getAdminV2ApplicationDetail } from "@/actions/admission_v2";
import { generateAdmissionLetterAction } from "@/actions/result-management";
import { Loader2, Printer, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminAdmissionLetterPage() {
    const params = useParams();
    const id = parseInt(params.id as string);
    const [app, setApp] = useState<any>(null);
    const [letter, setLetter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isNaN(id)) return;
        (async () => {
            try {
                const data = await getAdminV2ApplicationDetail(id);
                setApp(data);

                if (!data) {
                    setError("Application not found.");
                    return;
                }
                if (data.status !== 'admitted') {
                    setError("This application is not admitted. The admission letter is only issued to admitted candidates.");
                    return;
                }
                if (!data.student?.matricNumber && !(data.admissionNotes || '').includes('Matric Number')) {
                    setError("No matriculation number assigned yet. The official admission letter is issued after a matriculation number has been assigned.");
                    return;
                }

                const letterRes = await generateAdmissionLetterAction(id);
                if (letterRes.success) {
                    setLetter(letterRes.data);
                } else {
                    setError(letterRes.error || "Failed to generate admission letter.");
                }
            } catch (e: any) {
                setError(e.message || "An error occurred.");
            }
            setLoading(false);
        })();
    }, [id]);

    if (loading) return <div className="p-8 min-h-screen flex justify-center items-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

    if (error || !letter) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-8 text-center space-y-6">
                <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md mx-auto space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-10 h-10 text-rose-500" />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 italic uppercase">Letter Unavailable</h4>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-widest">{error}</p>
                </div>
                <Button onClick={() => window.close()} className="rounded-2xl bg-slate-900 text-white font-black px-8 py-4 uppercase text-xs tracking-widest hover:bg-slate-800">
                    Close
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 py-20 px-4 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                        <ArrowLeft className="w-4 h-4" />
                        <span>{app?.applicantName || 'Applicant'}{app?.student?.matricNumber ? ` — ${app.student.matricNumber}` : ''}</span>
                    </div>
                    <Button onClick={() => window.print()} className="bg-slate-900 text-white font-black px-8 py-6 rounded-2xl shadow-xl flex gap-3 uppercase text-xs tracking-widest">
                        <Printer className="w-5 h-5" /> Print Admission Letter
                    </Button>
                </div>

                <div className="bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-slate-200 print:shadow-none print:border-none print:rounded-none min-h-[11in] p-16 md:p-24 space-y-12">
                    <style dangerouslySetInnerHTML={{ __html: letter.css }} />
                    <div dangerouslySetInnerHTML={{ __html: letter.html }} />
                </div>
            </div>
        </div>
    );
}