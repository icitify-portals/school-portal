"use client";

import React from "react";
import { Printer, ArrowLeft, Edit3, Stethoscope, ShieldCheck, Heart, UserCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        : 'Pending Official Clearance';

    const photoUrl = student.imageUrl ? (viewableAssetUrl(student.imageUrl) || student.imageUrl) : null;
    const signatureUrl = student.signatureUrl ? (viewableAssetUrl(student.signatureUrl) || student.signatureUrl) : null;

    // Format measurements nicely
    const formatHeight = (h?: string | null) => {
        if (!h || h === "Pending Clinic Measurement") return "Pending Measurement";
        return h.toLowerCase().includes("cm") || h.toLowerCase().includes("m") ? h : `${h} cm`;
    };

    const formatWeight = (w?: string | null) => {
        if (!w || w === "Pending Clinic Measurement") return "Pending Measurement";
        return w.toLowerCase().includes("kg") ? w : `${w} kg`;
    };

    const formatBP = (bp?: string | null) => {
        if (!bp || bp === "Pending Clinic Measurement") return "Pending Measurement";
        return bp;
    };

    return (
        <div className="min-h-screen print:min-h-0 bg-slate-100 py-6 px-4 print:p-0 print:bg-white text-slate-900 font-sans">
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 6mm 8mm;
                    }
                    html, body {
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        color: #0f172a !important;
                        font-size: 11px !important;
                        line-height: 1.25 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .one-page-print {
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                    .avoid-break {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            `}</style>

            <div className="max-w-4xl mx-auto space-y-4 one-page-print">
                {/* Print Control Toolbar (Hidden on Print) */}
                <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
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
                                className="rounded-xl flex items-center gap-1.5 text-emerald-800 hover:text-emerald-900 border-emerald-200 bg-emerald-50/50"
                            >
                                <Edit3 className="w-4 h-4" /> Edit Medical Form
                            </Button>
                        )}
                    </div>
                    <Button 
                        onClick={handlePrint}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 px-6"
                    >
                        <Printer className="w-4 h-4" /> Print Medical Form
                    </Button>
                </div>

                {/* Printable Medical Sheet */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 print:p-0 print:shadow-none print:border-none print:rounded-none">
                    
                    {/* INSTITUTIONAL HEADER */}
                    <div className="border-b-2 border-emerald-800 pb-2 mb-2 text-center relative avoid-break">
                        <div className="flex items-center justify-center gap-3 mb-1">
                            <img src="/fss_logo.png" alt="FSS Logo" className="w-12 h-12 object-contain flex-shrink-0" />
                            <div className="text-center">
                                <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                                    Federal School of Statistics, Ibadan
                                </h1>
                                <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest mt-0.5">
                                    Directorate of Medical &amp; Health Services
                                </p>
                                <p className="text-[9.5px] font-medium text-slate-500">
                                    Institutional Health Centre &bull; Ajibode-Shasha Road, Behind Niser, Shasha Ojoo, Ibadan
                                </p>
                            </div>
                        </div>

                        <div className="inline-block bg-emerald-900 text-white px-4 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-widest shadow-2xs">
                            Official Student Medical Examination &amp; Health Record
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 mt-0.5 uppercase tracking-wider">
                            Academic Session: <span className="text-emerald-900 font-black">{sessionName}</span>
                        </p>
                    </div>

                    {/* SECTION 1: BIODATA */}
                    <div className="mb-2 avoid-break">
                        <div className="bg-emerald-800 text-white font-black text-[10.5px] uppercase px-3 py-1 rounded-t-md tracking-wider flex items-center justify-between">
                            <span>1. Biodata</span>
                            <span className="text-[9px] font-medium text-emerald-200">Personal &amp; Academic Particulars</span>
                        </div>
                        <div className="p-2.5 bg-slate-50/70 rounded-b-md border border-t-0 border-slate-300">
                            <div className="flex flex-row gap-3 items-start justify-between">
                                {/* Details Grid */}
                                <div className="grid grid-cols-3 gap-y-1.5 gap-x-3 text-xs flex-1 w-full">
                                    <div className="col-span-2">
                                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Student Full Name</span>
                                        <span className="text-xs sm:text-sm font-black text-slate-900 uppercase">{fullName}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Matriculation Number</span>
                                        <span className="text-xs font-black font-mono text-emerald-900">{student.matricNumber || 'NOT ASSIGNED'}</span>
                                    </div>

                                    <div>
                                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Application / JAMB No.</span>
                                        <span className="text-[11px] font-bold font-mono text-slate-800">{student.jambNumber || student.admissionNumber || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Department</span>
                                        <span className="text-[11px] font-bold text-slate-800">{department?.name || 'General Studies'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Programme</span>
                                        <span className="text-[11px] font-bold text-slate-800">{programme?.name || 'Not Assigned'}</span>
                                    </div>

                                    <div>
                                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Level &amp; Study Mode</span>
                                        <span className="text-[11px] font-bold text-slate-800 uppercase">
                                            {student.programmeType || ''} {student.currentLevel || 1} &bull; {student.studyMode || 'Full-time'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Gender &amp; Date of Birth</span>
                                        <span className="text-[11px] font-bold text-slate-800 capitalize">
                                            {student.gender || 'N/A'} &bull; {student.dob || 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">State of Origin / LGA</span>
                                        <span className="text-[11px] font-bold text-slate-800">
                                            {student.stateOfOrigin || 'N/A'} {student.lga ? `(${student.lga})` : ''}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Nationality</span>
                                        <span className="text-[11px] font-bold text-slate-800">{student.nationality || 'Nigerian'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Registration / Submission Date</span>
                                        <span className="text-[11px] font-bold text-slate-800">{submissionDate}</span>
                                    </div>
                                </div>

                                {/* Passport Photograph */}
                                <div className="w-20 h-24 rounded-lg border-2 border-slate-300 overflow-hidden bg-white shadow-2xs flex flex-col items-center justify-center text-center flex-shrink-0 self-start">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt="Passport Photo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="p-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-tight">
                                            Passport<br />Photograph
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: NEXT OF KIN DETAILS */}
                    <div className="mb-2 avoid-break">
                        <div className="bg-emerald-800 text-white font-black text-[10.5px] uppercase px-3 py-1 rounded-t-md tracking-wider flex items-center justify-between">
                            <span>2. Next of Kin Details</span>
                            <span className="text-[9px] font-medium text-emerald-200">Emergency Contact Information</span>
                        </div>
                        <div className="p-2.5 bg-slate-50/70 rounded-b-md border border-t-0 border-slate-300">
                            <div className="grid grid-cols-3 gap-3 text-xs">
                                <div>
                                    <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Next of Kin Full Name</span>
                                    <span className="text-[11px] font-bold text-slate-900 uppercase">{student.kinName || 'Not Provided'}</span>
                                </div>
                                <div>
                                    <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Emergency Telephone Number</span>
                                    <span className="text-[11px] font-bold font-mono text-slate-900">{student.kinPhone || 'Not Provided'}</span>
                                </div>
                                <div>
                                    <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Residential / Contact Address</span>
                                    <span className="text-[11px] font-medium text-slate-800 truncate block" title={student.kinAddress}>{student.kinAddress || 'Not Provided'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: HEALTH HISTORY */}
                    <div className="mb-2 avoid-break">
                        <div className="bg-emerald-800 text-white font-black text-[10.5px] uppercase px-3 py-1 rounded-t-md tracking-wider flex items-center justify-between">
                            <span>3. Health History</span>
                            <span className="text-[9px] font-medium text-emerald-200">Declared Medical Background</span>
                        </div>
                        <div className="p-2.5 bg-slate-50/70 rounded-b-md border border-t-0 border-slate-300">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Common Illnesses</span>
                                    <p className="p-1.5 bg-white rounded border border-slate-200 text-slate-900 font-semibold text-[10px] truncate" title={medicalRecord?.commonIllness}>
                                        {medicalRecord?.commonIllness || 'None declared'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Frequency &amp; Last Occurrence</span>
                                    <p className="p-1.5 bg-white rounded border border-slate-200 text-slate-900 font-semibold text-[10px] truncate">
                                        {medicalRecord?.illnessFrequency ? `${medicalRecord.illnessFrequency} (${medicalRecord.lastOccurrence || 'N/A'})` : 'Rarely / None'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Known Allergies</span>
                                    <p className="p-1.5 bg-white rounded border border-slate-200 text-slate-900 font-semibold text-[10px] truncate" title={medicalRecord?.allergies || student.foodAllergies}>
                                        {medicalRecord?.allergies || student.foodAllergies || 'No known allergies'}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Illness Description &amp; Chronic Conditions</span>
                                    <p className="p-1.5 bg-white rounded border border-slate-200 text-slate-900 font-medium text-[10px] truncate" title={medicalRecord?.illnessDescription || student.ailments}>
                                        {medicalRecord?.illnessDescription || student.ailments || 'No chronic health issues or physical disabilities declared.'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Past Surgeries / Major Ailments</span>
                                    <p className="p-1.5 bg-white rounded border border-slate-200 text-slate-900 font-semibold text-[10px] truncate" title={medicalRecord?.medicalHistory}>
                                        {medicalRecord?.medicalHistory || 'None recorded'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: GENERAL HEALTH INFORMATION */}
                    <div className="mb-2 avoid-break">
                        <div className="bg-emerald-800 text-white font-black text-[10.5px] uppercase px-3 py-1 rounded-t-md tracking-wider flex items-center justify-between">
                            <span>4. General Health Information</span>
                            <span className="text-[9px] font-medium text-emerald-200">Clinical Measurements &amp; Physical Assessment</span>
                        </div>
                        <div className="p-2.5 bg-slate-50/70 rounded-b-md border border-t-0 border-slate-300 space-y-1.5">
                            <div className="grid grid-cols-5 gap-2 text-center">
                                <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Height</span>
                                    <span className="text-xs font-black text-slate-900 block mt-0.5">{formatHeight(medicalRecord?.height)}</span>
                                </div>
                                <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Weight</span>
                                    <span className="text-xs font-black text-slate-900 block mt-0.5">{formatWeight(medicalRecord?.weight)}</span>
                                </div>
                                <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Blood Pressure</span>
                                    <span className="text-xs font-black text-slate-900 block mt-0.5">{formatBP(medicalRecord?.bloodPressure)}</span>
                                </div>
                                <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Blood Group</span>
                                    <span className="text-xs font-black text-rose-700 block mt-0.5">{student.bloodGroup || 'Pending'}</span>
                                </div>
                                <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Genotype</span>
                                    <span className="text-xs font-black text-indigo-700 block mt-0.5">{student.genotype || 'Pending'}</span>
                                </div>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 text-xs">
                                <div className="flex flex-row justify-between items-center gap-1 border-b border-slate-100 pb-1 mb-1">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                        Clinical Fitness Assessment:
                                    </span>
                                    <span className={`font-black text-[10px] px-2 py-0.5 rounded-full inline-block ${
                                        student.healthStatus === 'cleared' ? 'bg-emerald-100 text-emerald-800' :
                                        student.healthStatus === 'flagged' ? 'bg-rose-100 text-rose-800' :
                                        'bg-amber-100 text-amber-800'
                                    }`}>
                                        {student.healthStatus === 'cleared' ? 'CERTIFIED MEDICALLY FIT' :
                                         student.healthStatus === 'flagged' ? 'CONDITIONALLY CLEARED' :
                                         'PENDING PHYSICAL SCREENING'}
                                    </span>
                                </div>
                                <p className="text-slate-700 text-[9.5px] leading-snug">
                                    <strong>Physician Remarks:</strong> {student.healthNotes || 'Satisfactory. Candidate demonstrates good vital indicators and is medically fit to undertake rigorous academic studies.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: CLINICAL ENDORSEMENT & CLEARANCE */}
                    <div className="pt-2 border-t-2 border-slate-300 avoid-break">
                        <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/80 mb-2 text-[9.5px] text-emerald-950 leading-snug">
                            <strong>Institutional Clinic Clearance Certificate:</strong> Certified that the candidate whose particulars 
                            and biometric declarations appear on this official record has undergone medical assessment and physical screening 
                            at the Federal School of Statistics Health Centre, and is confirmed medically sound and fit for academic studies.
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-1 items-end text-center">
                            {/* Student's Signature */}
                            <div className="space-y-1">
                                <div className="border-b border-slate-400 h-8 flex items-center justify-center">
                                    {signatureUrl ? (
                                        <img src={signatureUrl} alt="Student Signature" className="max-h-7 object-contain" />
                                    ) : (
                                        <span className="text-slate-300 italic text-[9px]">Student Sign</span>
                                    )}
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 block">Student&rsquo;s Signature &amp; Date</span>
                            </div>

                            {/* Medical Officer */}
                            <div className="space-y-1">
                                <div className="border-b border-slate-400 h-8 flex items-center justify-center">
                                    <span className="font-serif italic font-bold text-[11px] text-slate-700">Examining Medical Officer</span>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 block">Examining Physician / Stamp</span>
                            </div>

                            {/* Director of Health Services */}
                            <div className="space-y-1">
                                <div className="border-b border-slate-400 h-8 flex items-center justify-center">
                                    <div className="text-[8.5px] font-black uppercase text-emerald-900 border border-dashed border-emerald-400 px-2 py-0.5 rounded">
                                        OFFICIAL CLINIC STAMP &amp; DATE
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 block">Director of Medical &amp; Health Services</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
