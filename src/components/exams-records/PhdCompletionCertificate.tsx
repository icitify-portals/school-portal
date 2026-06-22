"use client";

import React from "react";
import { Award, Printer, Shield, CheckCircle, Award as MedalIcon } from "lucide-react";

interface PhdCompletionCertificateProps {
    candidateName: string;
    researchTitle: string;
    department: string;
    defenseDate: Date;
    certificateNumber: string;
    provostName?: string;
    registrarName?: string;
}

export function PhdCompletionCertificate({
    candidateName,
    researchTitle,
    department,
    defenseDate,
    certificateNumber,
    provostName = "Prof. Marcus Aurelius",
    registrarName = "Dr. Helen Troy"
}: PhdCompletionCertificateProps) {

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 md:p-8 select-none">
            
            {/* Top Toolbar - Hides when printing */}
            <div className="no-print w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 mb-6 shadow-2xl">
                <div>
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        PhD Completion Certificate Terminal
                    </h3>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                        Print layout is optimized for landscape A4 formatting. Press Print to generate document.
                    </p>
                </div>
                <button
                    onClick={handlePrint}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg hover:scale-102"
                >
                    <Printer className="w-4 h-4" />
                    Print Certificate
                </button>
            </div>

            {/* Print Overrides CSS */}
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .certificate-container {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        background: white !important;
                        transform: none !important;
                    }
                    @page {
                        size: landscape;
                        margin: 0;
                    }
                }
            `}</style>

            {/* The Gold Embossed Certificate Body */}
            <div className="certificate-container relative w-full max-w-4xl aspect-[1.414/1] bg-gradient-to-br from-amber-50/90 via-slate-50 to-amber-50/90 border-[16px] border-amber-950 rounded-2xl p-8 md:p-12 shadow-2xl flex flex-col justify-between overflow-hidden text-slate-900">
                
                {/* Vintage Ornamental Inner Border */}
                <div className="absolute inset-2 border-[2px] border-dashed border-amber-700/60 rounded-lg pointer-events-none -z-10" />
                
                {/* Background Watermark Crest */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none -z-20">
                    <Shield className="w-96 h-96 text-amber-900" />
                </div>

                {/* Left/Right Ornamental Corners */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-600 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-600 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-600 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-600 rounded-br-lg" />

                {/* Certificate Header */}
                <div className="text-center space-y-2">
                    <h1 className="font-serif text-amber-900 font-extrabold tracking-widest text-lg md:text-xl uppercase">
                        School of Postgraduate Studies
                    </h1>
                    <h2 className="font-serif text-slate-700 text-xs font-semibold tracking-widest uppercase border-b border-amber-800/30 pb-2 max-w-xs mx-auto">
                        National University Institute
                    </h2>
                    <p className="text-amber-800/80 font-serif italic text-sm mt-3">
                        Upon recommendation of the Board of Postgraduate Studies hereby confers upon
                    </p>
                </div>

                {/* Candidate Name Section */}
                <div className="text-center my-4">
                    <h3 className="font-serif text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 tracking-tight leading-none">
                        {candidateName}
                    </h3>
                    <div className="w-16 h-[2px] bg-amber-600 mx-auto mt-4" />
                </div>

                {/* Research Title & Candidacy Details */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                    <p className="text-slate-600 font-serif italic text-xs">
                        the degree of
                    </p>
                    <h4 className="font-serif font-extrabold text-amber-950 tracking-widest text-md md:text-lg uppercase">
                        Doctor of Philosophy (Ph.D.)
                    </h4>
                    <p className="text-slate-500 font-serif text-[11px]">
                        in the Department of <strong className="text-slate-800 font-bold">{department}</strong>
                    </p>
                    <p className="text-slate-600 font-serif text-xs leading-relaxed max-w-xl mx-auto">
                        for the thesis presentation entitled:<br />
                        <strong className="text-amber-900 font-serif text-xs tracking-tight italic block mt-1">
                            "{researchTitle}"
                        </strong>
                    </p>
                </div>

                {/* Bottom section: Signatures and Embossed Gold Seal */}
                <div className="grid grid-cols-3 items-end gap-4 mt-6">
                    
                    {/* Left: Registrar Signature */}
                    <div className="text-center space-y-1">
                        <div className="font-serif italic text-slate-800 text-xs h-6 border-b border-amber-900/30 flex items-end justify-center">
                            Dr. Helen Troy
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            University Registrar
                        </p>
                    </div>

                    {/* Center: Gold Embossed Wax Seal */}
                    <div className="flex flex-col items-center justify-center relative">
                        {/* 3D Wax Seal Circle */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 shadow-xl border-4 border-amber-400 flex items-center justify-center relative group transform hover:scale-105 transition-all">
                            {/* Inner circle detail */}
                            <div className="w-15 h-15 rounded-full border border-amber-300/40 flex items-center justify-center flex-col">
                                <MedalIcon className="w-7 h-7 text-amber-200 drop-shadow-md animate-pulse" />
                                <span className="text-[7px] text-amber-200 font-bold tracking-widest uppercase">SPGS</span>
                            </div>
                            
                            {/* Embossed Text Orbiting */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-[6px] text-amber-200 font-extrabold uppercase tracking-[0.2em] transform rotate-12">
                                    APPROVED
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Provost Signature */}
                    <div className="text-center space-y-1">
                        <div className="font-serif italic text-slate-800 text-xs h-6 border-b border-amber-900/30 flex items-end justify-center">
                            Prof. Marcus Aurelius
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Provost SPGS
                        </p>
                    </div>
                </div>

                {/* Footer Certificate ID Metadata */}
                <div className="flex justify-between items-center text-[8px] font-bold tracking-wider text-slate-400 mt-4 border-t border-amber-800/10 pt-2">
                    <span>DATE OF DEFENSE: {new Date(defenseDate).toLocaleDateString()}</span>
                    <span>CERTIFICATE ID: {certificateNumber}</span>
                </div>
            </div>
        </div>
    );
}
