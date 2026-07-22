"use client";

import React, { useRef } from "react";
import { Printer, BookOpen, Star, User, GraduationCap } from "lucide-react";
import { formatLevel } from "@/lib/utils";

interface SubjectResult {
    code: string;
    title: string;
    units: number;
    score: number;
    grade: string;
    points: number;
    rankClass?: string;
    rankLevel?: string;
    caScore?: string;
    examScore?: string;
}

interface BehavioralRating {
    name: string;
    category: string;
    score: number;
}

interface K12ReportData {
    student: {
        name: string;
        matricNumber: string;
        level: number;
        unit: string;
        admissionNumber?: string;
    };
    results: SubjectResult[];
    behaviors: BehavioralRating[];
    remarks: {
        classTeacherComment?: string;
        headTeacherComment?: string;
        daysOpen?: number;
        daysPresent?: number;
        daysAbsent?: number;
        nextTermStarts?: string;
    } | null;
    session: string;
    term: string;
}

export default function TerminalReportSheet({
    data
}: {
    data: K12ReportData;
}) {
    const reportRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const getGradeColor = (grade: string) => {
        switch (grade.toUpperCase()) {
            case "A":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "B":
            case "C":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "D":
            case "E":
                return "bg-amber-50 text-amber-700 border-amber-200";
            default:
                return "bg-rose-50 text-rose-700 border-rose-200";
        }
    };

    const affectiveTraits = data.behaviors.filter(b => b.category === "affective");
    const psychomotorTraits = data.behaviors.filter(b => b.category === "psychomotor");

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {/* Control Panel */}
            <div className="flex justify-between items-center bg-white border border-slate-100 shadow-xl shadow-slate-100/40 rounded-2xl p-4 print:hidden">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-teal-600" />
                        Report Card Print Manager
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Click Print to generate high-fidelity paper sheets.</p>
                </div>
                
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-teal-100/50 hover:shadow-teal-100"
                >
                    <Printer className="w-4 h-4" />
                    Print Report Sheet
                </button>
            </div>

            {/* Printable Report Card Sheet */}
            <div
                ref={reportRef}
                className="bg-white border border-slate-200 shadow-2xl p-8 rounded-2xl relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
                {/* School Header Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-teal-600 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-teal-100/50 rounded-2xl flex items-center justify-center text-teal-700 font-extrabold text-2xl border border-teal-200">
                            IC
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">Icitify School Academy</h1>
                            <p className="text-xs text-slate-400 font-medium">Technology for Knowledge • Elementary & Junior High Portal</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Ogun State, Nigeria • info@icitifyschool.com</p>
                        </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 text-right md:border-l md:border-slate-100 md:pl-6">
                        <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-extrabold rounded-full uppercase tracking-wider mb-2">
                            {data.term} Term Report
                        </span>
                        <p className="text-sm font-bold text-slate-700">{data.session} Academic Session</p>
                    </div>
                </div>

                {/* Student Metadata Card */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student Name</span>
                        <span className="text-sm font-extrabold text-slate-700">{data.student.name}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admission Number</span>
                        <span className="text-sm font-bold text-slate-700">{data.student.admissionNumber || data.student.matricNumber}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Level</span>
                        <span className="text-sm font-bold text-slate-700">{formatLevel(data.student.level)}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Branch Annex</span>
                        <span className="text-sm font-bold text-slate-700">{data.student.unit || "Nursery/Primary Section"}</span>
                    </div>
                </div>

                {/* Subject Performance Grid */}
                <div className="mb-6">
                    <h3 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                        Academic Subject Grades
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Subject Name</th>
                                    <th className="px-4 py-3 text-center">CA (40%)</th>
                                    <th className="px-4 py-3 text-center">Exam (60%)</th>
                                    <th className="px-4 py-3 text-center">Total (100%)</th>
                                    <th className="px-4 py-3 text-center">Grade</th>
                                    <th className="px-4 py-3 text-center">Class Position</th>
                                    <th className="px-4 py-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-600">
                                {data.results.map((res) => (
                                    <tr key={res.code} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-bold text-slate-700">{res.code}</td>
                                        <td className="px-4 py-3 capitalize font-bold text-slate-800">{res.title}</td>
                                        <td className="px-4 py-3 text-center">{res.caScore || "-"}</td>
                                        <td className="px-4 py-3 text-center">{res.examScore || "-"}</td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-800">{res.score}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${getGradeColor(res.grade)}`}>
                                                {res.grade}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-700">{res.rankClass || "-"}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-500">{res.score >= 50 ? "Pass" : "Fail"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Behavioral Traits Ratings Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Affective */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                        <h4 className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider border-b border-teal-100 pb-2 mb-3">Affective Domain</h4>
                        {affectiveTraits.length === 0 ? (
                            <p className="text-[10px] text-slate-400">No affective ratings logged.</p>
                        ) : (
                            <div className="space-y-2">
                                {affectiveTraits.map(b => (
                                    <div key={b.name} className="flex justify-between items-center text-xs">
                                        <span className="capitalize font-semibold text-slate-600">{b.name}</span>
                                        <div className="flex gap-0.5">
                                            {[1,2,3,4,5].map(n => (
                                                <Star key={n} className={`w-3.5 h-3.5 ${n <= b.score ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Psychomotor */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                        <h4 className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider border-b border-teal-100 pb-2 mb-3">Psychomotor Skills</h4>
                        {psychomotorTraits.length === 0 ? (
                            <p className="text-[10px] text-slate-400">No psychomotor ratings logged.</p>
                        ) : (
                            <div className="space-y-2">
                                {psychomotorTraits.map(b => (
                                    <div key={b.name} className="flex justify-between items-center text-xs">
                                        <span className="capitalize font-semibold text-slate-600">{b.name}</span>
                                        <div className="flex gap-0.5">
                                            {[1,2,3,4,5].map(n => (
                                                <Star key={n} className={`w-3.5 h-3.5 ${n <= b.score ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Remarks & Signatures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Teacher Remarks</span>
                            <p className="text-xs font-semibold text-slate-700 italic mt-1 bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                                "{data.remarks?.classTeacherComment || "Exemplary attitude towards curriculum and classmates. Keep maintaining this focus."}"
                            </p>
                        </div>
                        
                        {data.remarks?.daysOpen && (
                            <div className="flex gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs">
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Days Open</span>
                                    <span className="font-extrabold text-slate-700">{data.remarks.daysOpen}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Present</span>
                                    <span className="font-extrabold text-slate-700">{data.remarks.daysPresent}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Absent</span>
                                    <span className="font-extrabold text-slate-700">{data.remarks.daysAbsent}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Principal Remarks</span>
                            <p className="text-xs font-semibold text-slate-700 italic mt-1 bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                                "{data.remarks?.headTeacherComment || "A very promising performance. Highly recommended for the next class promotion."}"
                            </p>
                        </div>
                        
                        {/* Signature Bars */}
                        <div className="flex justify-between items-end border-t border-slate-100 pt-6">
                            <div className="text-center">
                                <div className="w-24 border-b border-slate-300 mx-auto mb-1"></div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Class Teacher</span>
                            </div>
                            <div className="text-center">
                                <div className="w-24 border-b border-slate-300 mx-auto mb-1"></div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Principal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Styling Rules CSS Overlay */}
                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #report-sheet-container, #report-sheet-container * {
                            visibility: visible;
                        }
                        #report-sheet-container {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
