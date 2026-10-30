"use client";

import React from "react";
import { Printer, ArrowLeft, Edit3, Stethoscope, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { viewableAssetUrl } from "@/lib/assets";

interface MedicalFormPrintableProps {
    data: any;
    isStaffView?: boolean;
    onEdit?: () => void;
}

export function MedicalFormPrintable({ data, isStaffView = false, onEdit }: MedicalFormPrintableProps) {
    if (!data || !data.student) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>Medical record not found.</p>
            </div>
        );
    }

    const { student, user, programme, department, session, medicalRecord } = data;

    const handlePrint = () => {
        window.print();
    };

    const fullName = `${student.lastName || ''} ${student.firstName || ''} ${student.otherNames || ''}`.trim() || user?.name || "Student";
    const sessionName = session?.name || "2026/2027";
    const submissionDate = student.medicalFormSubmittedAt 
        ? new Date(student.medicalFormSubmittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Submitted';

    return (
        <div className="min-h-screen print:min-h-0 bg-slate-100 py-8 px-4 print:p-0 print:bg-white text-slate-900">
            <style>{`@media print { @page { size: A4 portrait; margin: 8mm; } html, body { height: auto !important; } .one-page-print { zoom: 0.68; break-inside: avoid; page-break-inside: avoid; page-break-after: avoid; } }`}</style>
            <div className="max-w-4xl mx-auto space-y-6 one-page-print">
                {/* Print Control (Hidden on Print) */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.history.back()}
                            className="rounded-xl flex items-center gap-1.5"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                        {onEdit && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={onEdit}
                                className="rounded-xl flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800"
                            >
                                <Edit3 className="w-4 h-4" /> Update Medical Info
                            </Button>
                        )}
                    </div>
                    <Button 
                        onClick={handlePrint}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 px-6"
                    >
                        <Printer className="w-4 h-4" /> Print Medical Form
                    </Button>
                </div>

                {/* Printable Medical Sheet */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-12 print:p-0 print:shadow-none print:border-none print:rounded-none">
                    {/* Institutional Header */}
                    <div className="border-b-4 border-emerald-800 pb-6 mb-8 text-center relative">
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <img src="/fss_logo.png" alt="FSS Logo" className="w-20 h-20 object-contain" />
                            <div className="text-center">
                                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
                                    Federal School of Statistics, Ibadan
                                </h1>
                                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
                                    Directorate of Medical & Health Services
                                </p>
                                <p className="text-xs font-medium text-slate-500">
                                    Institutional Health Center • P.M.B. 5065, Sango, Ibadan, Nigeria
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 inline-block bg-emerald-800 text-white px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                            Official Student Medical Examination & Health Record
                        </div>
                        <p className="text-xs font-bold text-emerald-800 mt-2 uppercase tracking-wider">
                            Academic Session: {sessionName}
                        </p>
                    </div>

                    {/* Student Identity Banner */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 text-xs">
                            <div className="sm:col-span-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Student Full Name</span>
                                <span className="text-lg font-black text-slate-900 uppercase">{fullName}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Matriculation Number</span>
                                <span className="text-sm font-black font-mono text-emerald-800">{student.matricNumber || 'NOT ASSIGNED'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Application / JAMB No.</span>
                                <span className="text-sm font-bold font-mono text-slate-800">{student.jambNumber || student.admissionNumber || 'N/A'}</span>
                            </div>

                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Programme</span>
                                <span className="text-sm font-bold text-slate-800">{programme?.name || 'Not Assigned'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Level & Mode</span>
                                <span className="text-sm font-bold text-slate-800 uppercase">
                                    {student.programmeType || ''} {student.currentLevel || 1} • {student.studyMode || 'Full-time'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Gender & DOB</span>
                                <span className="text-sm font-bold text-slate-800 capitalize">
                                    {student.gender || 'N/A'} {student.dob ? `(${student.dob})` : ''}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Submission Date</span>
                                <span className="text-sm font-bold text-slate-800">{submissionDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 1: PHYSICAL & LAB METRICS */}
                    <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white bg-emerald-800 px-3 py-1.5 rounded-md mb-3">
                            Section 1: Laboratory & Physical Assessment
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Blood Group</span>
                                <span className="text-base font-black text-rose-700">{student.bloodGroup || 'N/A'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Genotype</span>
                                <span className="text-base font-black text-indigo-700">{student.genotype || 'N/A'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Height (cm)</span>
                                <span className="text-sm font-bold text-slate-800">{medicalRecord?.height ? `${medicalRecord.height} cm` : 'Not recorded'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Weight (kg)</span>
                                <span className="text-sm font-bold text-slate-800">{medicalRecord?.weight ? `${medicalRecord.weight} kg` : 'Not recorded'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Blood Pressure</span>
                                <span className="text-sm font-bold text-slate-800">{medicalRecord?.bloodPressure || 'Normal'}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CLINICAL HISTORY */}
                    <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white bg-emerald-800 px-3 py-1.5 rounded-md mb-3">
                            Section 2: Health History & Medical Declarations
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Common Illnesses Experienced</span>
                                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                                    {medicalRecord?.commonIllness || 'None recorded'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Illness Frequency & Occurrence</span>
                                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                                    {medicalRecord?.illnessFrequency ? `${medicalRecord.illnessFrequency} (Last: ${medicalRecord.lastOccurrence || 'N/A'})` : 'Rarely / None'}
                                </p>
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Detailed Illness Description & Chronic Conditions</span>
                                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                                    {medicalRecord?.illnessDescription || student.ailments || 'No chronic health issues or physical disabilities declared.'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Known Allergies (Food / Drug)</span>
                                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                                    {medicalRecord?.allergies || student.foodAllergies || 'No known allergies'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Current Routine Medications</span>
                                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                                    {medicalRecord?.currentMedications || 'None'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: NEXT OF KIN & EMERGENCY CONTACT */}
                    <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white bg-emerald-800 px-3 py-1.5 rounded-md mb-3">
                            Section 3: Emergency & Next of Kin Contact
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Next of Kin Name</span>
                                <span className="font-bold text-slate-900">{student.kinName || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Emergency Phone Number</span>
                                <span className="font-bold text-slate-900">{student.kinPhone || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Contact Address</span>
                                <span className="font-medium text-slate-800">{student.kinAddress || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: CLINICAL ENDORSEMENT & CLEARANCE */}
                    <div className="pt-6 border-t-2 border-slate-300">
                        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 mb-6 text-xs text-emerald-950">
                            <strong>Institutional Clinic Clearance Certificate:</strong> Certified that the candidate whose particulars 
                            appear on this document has provided their medical and health history and is medically fit to undergo academic 
                            studies and physical training at Federal School of Statistics, Ibadan.
                        </div>

                        <div className="grid grid-cols-3 gap-8 pt-2 items-end text-center">
                            <div className="space-y-2">
                                <div className="border-b border-slate-400 h-12 flex items-center justify-center">
                                    {student.signatureUrl ? (
                                        <img src={viewableAssetUrl(student.signatureUrl) || student.signatureUrl} alt="Signature" className="max-h-10 object-contain" />
                                    ) : null}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Student&rsquo;s Signature</span>
                            </div>

                            <div className="space-y-2">
                                <div className="border-b border-slate-400 h-12 flex items-center justify-center">
                                    <div className="text-[9px] font-black uppercase text-emerald-800 border-2 border-dashed border-emerald-300 px-3 py-1 rounded">
                                        CLINIC STAMP & DATE
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Director of Health Services</span>
                            </div>

                            <div className="space-y-2">
                                <div className="border-b border-slate-400 h-12 flex items-center justify-center">
                                    <span className="font-serif italic font-bold text-xs text-slate-700">Medical Officer</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Examining Physician Signature</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
