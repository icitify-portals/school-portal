"use client";

import React from "react";
import { Printer, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { viewableAssetUrl } from "@/lib/assets";

interface MatriculationOathPrintableProps {
    data: any;
    isStaffView?: boolean;
}

export function MatriculationOathPrintable({ data, isStaffView = false }: MatriculationOathPrintableProps) {
    if (!data || !data.student) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>Matriculation oath record not found.</p>
            </div>
        );
    }

    const { student, user, programme, department, session, matricRecord } = data;

    const handlePrint = () => {
        window.print();
    };

    const fullName = `${student.lastName || ''} ${student.firstName || ''} ${student.otherNames || ''}`.trim() || user?.name || "Student";
    const sessionName = session?.name || "2026/2027";
    const receiptCode = `FSS-REG-MAT-${student.id}-SESSION-${session?.id || 6}`;
    const signedDate = matricRecord?.signedAt 
        ? new Date(matricRecord.signedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : (student.oathSignedAt ? new Date(student.oathSignedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null);

    const signatureSrc = matricRecord?.oathSignature || student.signatureUrl;

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white text-slate-900">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Print Control (Hidden on Print) */}
                <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.history.back()}
                        className="rounded-xl flex items-center gap-1.5"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button 
                        onClick={handlePrint}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 px-6"
                    >
                        <Printer className="w-4 h-4" /> Print Matriculation Oath Slip
                    </Button>
                </div>

                {/* Printable Certificate Sheet */}
                <div className="bg-white rounded-3xl shadow-xl border-2 border-indigo-900/20 p-8 sm:p-12 print:p-0 print:shadow-none print:border-none print:rounded-none relative overflow-hidden">
                    {/* Watermark / Background Crest */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <img src="/fss_logo.png" alt="Watermark" className="w-[500px] h-[500px] object-contain" />
                    </div>

                    {/* Institutional Header */}
                    <div className="text-center pb-6 border-b-2 border-indigo-900 mb-8 relative z-10">
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <img src="/fss_logo.png" alt="FSS Logo" className="w-20 h-20 object-contain" />
                            <div className="text-center">
                                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
                                    Federal School of Statistics, Ibadan
                                </h1>
                                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
                                    (An Institution of the National Bureau of Statistics)
                                </p>
                                <p className="text-xs font-medium text-slate-500">
                                    P.M.B. 5065, Sango, Ibadan, Oyo State, Nigeria
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 inline-block bg-indigo-900 text-white px-8 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-sm">
                            Official Matriculation Oath & Declaration
                        </div>
                        <p className="text-xs font-bold text-indigo-900 mt-2 uppercase tracking-wider">
                            Academic Session: {sessionName}
                        </p>
                    </div>

                    {/* Student Identity Grid */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8 relative z-10">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                            <div className="sm:col-span-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Student Full Name</span>
                                <span className="text-base font-black text-slate-900 uppercase">{fullName}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Matriculation Number</span>
                                <span className="text-sm font-black font-mono text-indigo-700">{student.matricNumber || 'NOT ASSIGNED'}</span>
                            </div>

                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">JAMB / Reg Number</span>
                                <span className="text-sm font-bold font-mono text-slate-800">{student.jambNumber || student.admissionNumber || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Programme</span>
                                <span className="text-sm font-bold text-slate-800">{programme?.name || 'Not Assigned'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Department</span>
                                <span className="text-sm font-bold text-slate-800">{department?.name || 'Not Assigned'}</span>
                            </div>

                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Level & Mode</span>
                                <span className="text-sm font-bold text-slate-800 uppercase">
                                    {student.programmeType || ''} {student.currentLevel || 1} • {student.studyMode || 'Full-time'}
                                </span>
                            </div>
                            <div className="sm:col-span-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Institutional Receipt Code</span>
                                <span className="text-xs font-mono font-bold text-emerald-700">{receiptCode}</span>
                            </div>
                        </div>
                    </div>

                    {/* The Solemn Declaration */}
                    <div className="space-y-6 mb-10 relative z-10">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-2">
                            The Solemn Oath of Allegiance & Discipline
                        </h3>

                        <div className="bg-indigo-50/50 p-6 sm:p-8 rounded-2xl border border-indigo-100 font-serif text-slate-800 text-sm sm:text-base leading-relaxed text-justify space-y-4">
                            <p>
                                I, <span className="font-bold underline uppercase">{fullName}</span>, having been admitted as a bona fide student into the 
                                <strong> Federal School of Statistics, Ibadan</strong> for the <strong>{sessionName}</strong> academic session, do hereby 
                                solemnly promise and declare on my honour:
                            </p>
                            <ol className="list-decimal pl-6 space-y-2 text-xs sm:text-sm font-sans">
                                <li>
                                    That I will be a loyal, law-abiding, and respectful member of the Federal School of Statistics, Ibadan.
                                </li>
                                <li>
                                    That I will pay due respect, deference, and obedience to the Rector, Registrar, and other constituted officers and authorities of the institution.
                                </li>
                                <li>
                                    That I will faithfully observe, uphold, and abide by all statutes, rules, regulations, and codes of conduct of the school.
                                </li>
                                <li>
                                    That I will completely abstain from cultism, examination malpractices, unruly demonstrations, violence, sexual harassment, and any form of misconduct that could bring the institution into disrepute.
                                </li>
                                <li>
                                    That I accept that any breach of this solemn oath may result in severe disciplinary action, including suspension or summary expulsion from the institution.
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* Signatures & Institutional Endorsement */}
                    <div className="pt-6 border-t-2 border-slate-300 relative z-10">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 items-end text-center">
                            {/* Student Digital Signature */}
                            <div className="space-y-2">
                                <div className="border-b border-slate-400 min-h-[60px] flex flex-col items-center justify-center p-1">
                                    {signatureSrc ? (
                                        <img src={viewableAssetUrl(signatureSrc) || signatureSrc} alt="Signature" className="max-h-12 object-contain" />
                                    ) : (
                                        <div className="text-[10px] text-slate-400 italic">Signature Recorded</div>
                                    )}
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">Student&rsquo;s Signature</span>
                                    <span className="text-[9px] font-mono text-slate-500">{signedDate || 'Date: Verified Online'}</span>
                                </div>
                            </div>

                            {/* Official Institutional Stamp */}
                            <div className="space-y-2">
                                <div className="border-b border-slate-400 min-h-[60px] flex items-center justify-center">
                                    <div className="border-2 border-dashed border-indigo-300 rounded-lg px-3 py-1 text-center">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 block">FSS REGISTRY</span>
                                        <span className="text-[8px] font-mono text-slate-400 block">VERIFIED & ARCHIVED</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">Institutional Seal</span>
                            </div>

                            {/* Registrar Endorsement */}
                            <div className="space-y-2 col-span-2 sm:col-span-1">
                                <div className="border-b border-slate-400 min-h-[60px] flex items-center justify-center">
                                    <div className="font-serif italic text-slate-700 text-xs font-bold">
                                        Registrar
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">Registrar / Academic Affairs</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Legal Note */}
                    <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                        <span>Digital Matriculation Record • Valid without physical seal if verifiable</span>
                        <span>{receiptCode}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
