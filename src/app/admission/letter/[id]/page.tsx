"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getApplicantStatusData } from "@/actions/admission_v2";
import { Loader2, Printer, MapPin, Calendar, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function AdmissionLetterPage() {
    const params = useParams();
    const id = parseInt(params.id as string);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getApplicantStatusData(id);
        setData(res);
        setLoading(false);
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!data || data.status !== 'admitted') return <div className="min-h-screen flex justify-center items-center font-black text-2xl uppercase text-slate-300">Letter Not Available</div>;

    const formData = JSON.parse(data.formData || "{}");

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
                <div className="bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-slate-200 print:shadow-none print:border-none print:rounded-none min-h-[11in] p-16 md:p-24 space-y-12 font-serif text-slate-800">
                    {/* Official Header */}
                    <div className="flex justify-between items-start border-b-4 border-double border-slate-900 pb-12">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter font-sans text-slate-900 leading-none">Official Admission</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-sans">Office of the Registrar • Intake Board</p>
                        </div>
                        <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 font-sans">
                            <span className="text-[8px] font-black text-center uppercase p-2">Institutional Seal</span>
                        </div>
                    </div>

                    {/* Date & Ref */}
                    <div className="flex justify-between text-sm font-bold italic font-sans text-slate-400">
                        <p>Date: {format(new Date(), 'PPP')}</p>
                        <p>Ref: ADM/{new Date().getFullYear()}/{data.id.toString().padStart(5, '0')}</p>
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                        <p className="font-black text-lg text-slate-900 uppercase font-sans">{formData.firstName} {formData.lastName}</p>
                        <p className="italic">{formData.address || 'Candidate Address Not Provided'}</p>
                        <p className="italic">{formData.phone}</p>
                    </div>

                    {/* Body */}
                    <div className="space-y-8 leading-loose text-lg">
                        <h2 className="text-2xl font-black italic text-slate-900 underline decoration-indigo-500/30 underline-offset-8">OFFER OF PROVISIONAL ADMISSION</h2>
                        
                        <p>Dear {formData.lastName},</p>
                        
                        <p>
                            Following your performance in the entrance examination and subsequent screening process, 
                            I am pleased to inform you that you have been offered provisional admission into the 
                            <span className="font-black italic"> {data.template.name} </span> for the upcoming academic session.
                        </p>

                        <p>
                            This offer is subject to the verification of your original documents and the fulfillment of all 
                            departmental requirements as stipulated by the academic board. 
                            {data.template.requireAcceptanceFee && (
                                <span> To secure this admission, you are required to pay a non-refundable acceptance fee of 
                                    <span className="font-black"> ₦{parseFloat(data.template.acceptanceFee).toLocaleString()} </span> 
                                    before the registration deadline.
                                </span>
                            )}
                        </p>

                        <div className="p-8 bg-slate-50 rounded-3xl space-y-4 font-sans border border-slate-100">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admission Details</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                                <LetterItem label="Programme" value={data.template.name} />
                                <LetterItem label="Level" value={data.template.level.toUpperCase()} />
                                <LetterItem label="CBT Score" value={data.results?.[0]?.totalScore || 'N/A'} />
                                <LetterItem label="Matric Number" value="To be assigned upon registration" />
                            </div>
                        </div>

                        <p>
                            We congratulate you on your success and look forward to welcoming you to our academic community.
                        </p>
                    </div>

                    {/* Signature Area */}
                    <div className="pt-12 space-y-12">
                        <div className="space-y-4">
                            <div className="w-48 h-[1px] bg-slate-900" />
                            <div className="space-y-1">
                                <p className="font-black uppercase italic text-sm font-sans">The Registrar</p>
                                <p className="text-xs text-slate-400 font-sans">For the Academic Board</p>
                            </div>
                        </div>

                        {/* Security QR */}
                        <div className="flex justify-between items-end border-t border-slate-100 pt-8 opacity-50 grayscale group-hover:grayscale-0 transition-all">
                            <div className="space-y-1 text-[8px] font-black uppercase tracking-widest text-slate-400 font-sans">
                                <p>Digital Signature Verified</p>
                                <p>Authentic Academic Document</p>
                            </div>
                            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-200">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LetterItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-sm font-black text-slate-900 italic uppercase">{value}</p>
        </div>
    );
}
