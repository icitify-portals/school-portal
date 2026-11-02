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
        <div className="min-h-screen print:min-h-0 bg-slate-100 py-8 px-4 print:p-0 print:bg-white text-slate-900 font-sans">
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }
                    html, body {
                        height: auto !important;
                        background: #ffffff !important;
                        color: #0f172a !important;
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
                        zoom: 0.88;
                    }
                    .avoid-break {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            `}</style>

            <div className="max-w-4xl mx-auto space-y-6 one-page-print">
                {/* Print Control Toolbar (Hidden on Print) */}
                <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
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
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 print:p-0 print:shadow-none print:border-none print:rounded-none">
                    
                    {/* INSTITUTIONAL HEADER */}
                    <div className="border-b-4 border-emerald-800 pb-4 mb-6 text-center relative avoid-break">
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <img src="/fss_logo.png" alt="FSS Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
                            <div className="text-center">
                                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                                    Federal School of Statistics, Ibadan
                                </h1>
                                <p className="text-xs sm:text-sm font-black text-emerald-800 uppercase tracking-widest mt-0.5">
                                    Directorate of Medical & Health Services
                                </p>
                                <p className="text-[11px] font-medium text-slate-500">
                                    Institutional Health Centre • P.M.B. 5065, Sango, Ibadan, Oyo State, Nigeria
                                </p>
                            </div>
                        </div>

                        <div className="mt-2 inline-block bg-emerald-900 text-white px-6 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm">
                            Official Student Medical Examination & Health Record
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 mt-1 uppercase tracking-wider">
                            Academic Session: <span className="text-emerald-900 font-black">{sessionName}</span>
                        </p>
                    </div>

                    {/* SECTION 1: BIODATA */}
                    <div className="mb-5 avoid-break">
                        <div className="bg-emerald-800 text-white font-black text-xs uppercase px-4 py-1.5 rounded-t-lg tracking-wider flex items-center justify-between">
                            <span>1. Biodata</span>
                            <span className="text-[10px] font-medium text-emerald-200">Personal & Academic Particulars</span>
                        </div>
                        <div className="p-4 bg-slate-50/70 rounded-b-lg border border-t-0 border-slate-300">
                            <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs flex-1 w-full">
                                    <div className="sm:col-span-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Student Full Name</span>
                                        <span className="text-sm sm:text-base font-black text-slate-900 uppercase">{fullName}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Matriculation Number</span>
                                        <span className="text-xs sm:text-sm font-black font-mono text-emerald-900">{student.matricNumber || 'NOT ASSIGNED'}</span>
                                    </div>

                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Application / JAMB No.</span>
                                        <span className="text-xs font-bold font-mono text-slate-800">{student.jambNumber || student.admissionNumber || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Department</span>
                                        <span className="text-xs font-bold text-slate-800">{department?.name || 'General Studies'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Programme</span>
                                        <span className="text-xs font-bold text-slate-800">{programme?.name || 'Not Assigned'}</span>
                                    </div>

                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Level & Study Mode</span>
                                        <span className="text-xs font-bold text-slate-800 uppercase">
                                            {student.programmeType || ''} {student.currentLevel || 1} • {student.studyMode || 'Full-time'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Gender & Date of Birth</span>
                                        <span className="text-xs font-bold text-slate-800 capitalize">
                                            {student.gender || 'N/A'} • {student.dob || 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">State of Origin / LGA</span>
                                        <span className="text-xs font-bold text-slate-800">
                                            {student.stateOfOrigin || 'N/A'} {student.lga ? `(${student.lga})` : ''}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Nationality</span>
                                        <span className="text-xs font-bold text-slate-800">{student.nationality || 'Nigerian'}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Registration / Submission Date</span>
                                        <span className="text-xs font-bold text-slate-800">{submissionDate}</span>
                                    </div>
                                </div>

                                {/* Passport Photograph */}
                                <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl border-2 border-slate-300 overflow-hidden bg-white shadow-sm flex flex-col items-center justify-center text-center flex-shrink-0 self-center sm:self-start">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt="Passport Photo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="p-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-tight">
                                            Passport<br />Photograph
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: NEXT OF KIN DETAILS */}
                    <div className="mb-5 avoid-break">
                        <div className="bg-emerald-800 text-white font-black text-xs uppercase px-4 py-1.5 rounded-t-lg tracking-wider flex items-center justify-between">
                            <span>2. Next of kin Details</span>
                            <span className="text-[10px] font-medium text-emerald-200">Emergency Contact Information</span>
                        </div>
                        <div className="p-4 bg-slate-50/70 rounded-b-lg border border-t-0 border-slate-300">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Next of Kin Full Name</span>
                                    <span className="text-xs font-bold text-slate-900 uppercase">{student.kinName || 'Not Provided'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Emergency Telephone Number</span>
                                    <span className="text-xs font-bold font-mono text-slate-900">{student.kinPhone || 'Not Provided'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Residential / Contact Address</span>
                                    <span className="text-xs font-medium text-slate-800">{student.kinAddress || 'Not Provided'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: HEALTH HISTORY */}
                    <div className="mb-5 avoid-break">
                        <div className="bg-emerald-800 text-white font-black text-xs uppercase px-4 py-1.5 rounded-t-lg tracking-wider flex items-center justify-between">
                            <span>3. Health History</span>
                            <span className="text-[10px] font-medium text-emerald-200">Declared Medical Background</span>
                        </div>
                        <div className="p-4 bg-slate-50/70 rounded-b-lg border border-t-0 border-slate-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Common Illnesses Experienced</span>
                                    <p className="p-2 bg-white rounded-md border border-slate-200 text-slate-900 font-semibold text-xs">
                                        {medicalRecord?.commonIllness || 'None declared'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Frequency & Last Occurrence</span>
                                    <p className="p-2 bg-white rounded-md border border-slate-200 text-slate-900 font-semibold text-xs">
                                        {medicalRecord?.illnessFrequency ? `${medicalRecord.illnessFrequency} (Last: ${medicalRecord.lastOccurrence || 'N/A'})` : 'Rarely / None'}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Detailed Illness Description & Chronic Conditions</span>
                                    <p className="p-2 bg-white rounded-md border border-slate-200 text-slate-900 font-medium text-xs">
                                        {medicalRecord?.illnessDescription || student.ailments || 'No chronic health issues, physical disabilities, or significant past medical conditions declared.'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Known Allergies (Food / Drug / Environmental)</span>
                                    <p className="p-2 bg-white rounded-md border border-slate-200 text-slate-900 font-semibold text-xs">
                                        {medicalRecord?.allergies || student.foodAllergies || 'No known allergies'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Medical History (Past Surgeries / Major Ailments)</span>
                                    <p className="p-2 bg-white rounded-md border border-slate-200 text-slate-900 font-semibold text-xs">
                                        {medicalRecord?.medicalHistory || 'None recorded'}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Current Routine Medications & Treatments</span>
                                    <p className="p-2 bg-white rounded-md border border-slate-200 text-slate-900 font-semibold text-xs">
                                        {medicalRecord?.currentMedications || 'None'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: GENERAL HEALTH INFORMATION */}
                    <div className="mb-6 avoid-break">
                        <div className="bg-emerald-800 text-white font-black text-xs uppercase px-4 py-1.5 rounded-t-lg tracking-wider flex items-center justify-between">
                            <span>4. General Health Information</span>
                            <span className="text-[10px] font-medium text-emerald-200">Clinical Measurements & Physical Assessment</span>
                        </div>
                        <div className="p-4 bg-slate-50/70 rounded-b-lg border border-t-0 border-slate-300 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Height</span>
                                    <span className="text-sm font-black text-slate-900 block mt-0.5">{formatHeight(medicalRecord?.height)}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Weight</span>
                                    <span className="text-sm font-black text-slate-900 block mt-0.5">{formatWeight(medicalRecord?.weight)}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Blood Pressure</span>
                                    <span className="text-sm font-black text-slate-900 block mt-0.5">{formatBP(medicalRecord?.bloodPressure)}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Blood Group</span>
                                    <span className="text-base font-black text-rose-700 block mt-0.5">{student.bloodGroup || 'Pending Test'}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Genotype</span>
                                    <span className="text-base font-black text-indigo-700 block mt-0.5">{student.genotype || 'Pending Test'}</span>
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 border-b border-slate-100 pb-2 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                        Clinical Physical Fitness Assessment:
                                    </span>
                                    <span className={`font-black text-xs px-2.5 py-0.5 rounded-full inline-block ${
                                        student.healthStatus === 'cleared' ? 'bg-emerald-100 text-emerald-800' :
                                        student.healthStatus === 'flagged' ? 'bg-rose-100 text-rose-800' :
                                        'bg-amber-100 text-amber-800'
                                    }`}>
                                        {student.healthStatus === 'cleared' ? 'CERTIFIED MEDICALLY FIT' :
                                         student.healthStatus === 'flagged' ? 'CONDITIONALLY CLEARED / UNDER OBSERVATION' :
                                         'PENDING PHYSICAL SCREENING'}
                                    </span>
                                </div>
                                <p className="text-slate-700 text-[11px] leading-relaxed">
                                    <strong>Physician Remarks:</strong> {student.healthNotes || 'Satisfactory. Candidate demonstrates good vital indicators and is medically fit to undertake rigorous academic studies and institutional physical activities.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: CLINICAL ENDORSEMENT & CLEARANCE */}
                    <div className="pt-4 border-t-2 border-slate-300 avoid-break">
                        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 mb-5 text-[11px] text-emerald-950 leading-relaxed">
                            <strong>Institutional Clinic Clearance Certificate:</strong> Certified that the candidate whose particulars 
                            and biometric declarations appear on this official record has undergone medical assessment and physical screening 
                            at the Federal School of Statistics Health Centre, and is confirmed medically sound and fit for academic studies.
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-1 items-end text-center">
                            {/* Student's Signature */}
                            <div className="space-y-1.5">
                                <div className="border-b border-slate-400 h-10 flex items-center justify-center">
                                    {signatureUrl ? (
                                        <img src={signatureUrl} alt="Student Signature" className="max-h-9 object-contain" />
                                    ) : (
                                        <span className="text-slate-300 italic text-[10px]">Student Sign</span>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Student&rsquo;s Signature & Date</span>
                            </div>

                            {/* Medical Officer */}
                            <div className="space-y-1.5">
                                <div className="border-b border-slate-400 h-10 flex items-center justify-center">
                                    <span className="font-serif italic font-bold text-xs text-slate-700">Examining Medical Officer</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Examining Physician / Stamp</span>
                            </div>

                            {/* Director of Health Services */}
                            <div className="space-y-1.5">
                                <div className="border-b border-slate-400 h-10 flex items-center justify-center">
                                    <div className="text-[9px] font-black uppercase text-emerald-900 border-2 border-dashed border-emerald-400 px-3 py-0.5 rounded">
                                        OFFICIAL CLINIC STAMP & DATE
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Director of Medical & Health Services</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
