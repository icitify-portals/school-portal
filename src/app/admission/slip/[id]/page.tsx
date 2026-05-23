"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getExamSlipData } from "@/actions/admission_v2";
import { Loader2, Printer, ShieldCheck, MapPin, Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdmissionSlipPage() {
    const params = useParams();
    const id = parseInt(params.id as string);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getExamSlipData(id);
        setData(res);
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!data) return <div className="min-h-screen flex justify-center items-center font-black text-2xl italic uppercase text-slate-300">Slip Not Found</div>;

    const formData = JSON.parse(data.formData || "{}");
    const exam = data.template.exams?.[0];

    return (
        <div className="min-h-screen bg-slate-100 py-20 px-4 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Print Control - Hidden on Print */}
                <div className="flex justify-between items-center print:hidden">
                    <Button variant="ghost" onClick={() => window.history.back()} className="rounded-xl font-bold">Back</Button>
                    <Button onClick={handlePrint} className="bg-indigo-600 text-white font-black px-8 py-6 rounded-2xl shadow-xl flex gap-3 uppercase text-xs tracking-widest">
                        <Printer className="w-5 h-5" /> Print Examination Slip
                    </Button>
                </div>

                {/* The Slip */}
                <div className="bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-slate-200 print:shadow-none print:border-none print:rounded-none">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-12 flex justify-between items-center">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Admission Entrance Slip</h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{data.template.name}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Application ID</p>
                            <p className="text-xl font-black italic">#{data.id.toString().padStart(6, '0')}</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-12 space-y-12">
                        <div className="flex gap-12 items-start">
                            {/* Photo */}
                            <div className="w-48 h-56 bg-slate-50 border-2 border-slate-100 rounded-[2rem] overflow-hidden flex-shrink-0 relative">
                                {data.applicantPhoto ? (
                                    <img src={data.applicantPhoto} alt="Applicant" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <User className="w-16 h-16" />
                                    </div>
                                )}
                                <div className="absolute bottom-0 inset-x-0 bg-slate-900/10 backdrop-blur-sm p-2 text-center">
                                    <span className="text-[8px] font-black uppercase text-slate-900">Official Identity</span>
                                </div>
                            </div>

                            {/* Candidate Details */}
                            <div className="flex-1 grid grid-cols-2 gap-y-8 gap-x-12">
                                <DetailItem label="Full Name" value={`${formData.firstName || ''} ${formData.lastName || ''}`} />
                                <DetailItem label="Date of Birth" value={formData.dob || 'N/A'} />
                                <DetailItem label="Gender" value={formData.gender || 'N/A'} />
                                <DetailItem label="Phone Number" value={formData.phone || 'N/A'} />
                                <DetailItem label="State of Origin" value={formData.stateOfOrigin || 'N/A'} />
                                <DetailItem label="Admission Level" value={data.template.level.toUpperCase()} />
                            </div>
                        </div>

                        {/* Examination Details */}
                        <div className="bg-indigo-50 rounded-[2.5rem] p-10 border border-indigo-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Calendar className="w-24 h-24 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-black text-indigo-900 italic uppercase mb-8 flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6" />
                                Examination Schedule
                            </h3>
                            {exam ? (
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Exam Date</p>
                                        <div className="flex items-center gap-3 text-indigo-900 font-black italic">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(exam.examDate), 'MMMM dd, yyyy')}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Start Time</p>
                                        <div className="flex items-center gap-3 text-indigo-900 font-black italic">
                                            <Clock className="w-4 h-4" />
                                            {format(new Date(exam.examDate), 'hh:mm a')}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Duration</p>
                                        <div className="flex items-center gap-3 text-indigo-900 font-black italic">
                                            <Clock className="w-4 h-4" />
                                            {exam.duration} Minutes
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-indigo-400 font-bold italic text-sm">Examination date has not been fixed for this template. Please check back later.</p>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instructions to Candidate</h4>
                            <ul className="grid grid-cols-1 gap-3">
                                <InstructionItem text="Candidates must present this slip for entry into the examination hall." />
                                <InstructionItem text="You are expected to be at the venue at least 30 minutes before the scheduled time." />
                                <InstructionItem text="Electronic gadgets including mobile phones are strictly prohibited." />
                                <InstructionItem text="Your application must be fully paid to be eligible for the examination." />
                            </ul>
                        </div>

                        {/* Footer / QR Area */}
                        <div className="pt-12 border-t border-slate-50 flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Generated On</p>
                                <p className="text-[10px] font-bold text-slate-500 italic">{format(new Date(), 'PPP p')}</p>
                            </div>
                            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                                <span className="text-[8px] font-black text-center uppercase p-2">Security QR Code</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-sm font-black text-slate-900 italic uppercase truncate">{value}</p>
        </div>
    );
}

function InstructionItem({ text }: { text: string }) {
    return (
        <li className="flex items-start gap-3 text-xs font-bold text-slate-500 italic leading-relaxed">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
            {text}
        </li>
    );
}
