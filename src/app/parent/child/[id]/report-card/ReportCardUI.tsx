"use client";

import { 
    Printer, 
    ShieldCheck, 
    FileText, 
    Star, 
    TrendingUp,
    Award,
    Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ReportCardUI({ data }: { data: any }) {
    const { student, results, behaviors, remarks, session, term: termName } = data;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Action Bar (Not for Print) */}
            <div className="flex justify-between items-center print:hidden">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Digital <span className="text-indigo-600">Report Card</span></h1>
                    <p className="text-slate-500 font-medium text-sm italic">{termName} Term, {session} Session</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => window.print()} 
                        className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Print / PDF
                    </button>
                </div>
            </div>

            {/* The Report Card (Institutional Design) */}
            <div className="bg-white rounded-[3rem] border-8 border-indigo-50 shadow-2xl overflow-hidden print:border-none print:shadow-none print-area">
                {/* Institutional Header */}
                <div className="bg-indigo-600 p-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Award className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600">
                                    <ShieldCheck className="w-10 h-10" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">LMS <span className="text-indigo-200">Academy</span></h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Official Academic Performance Record</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="text-4xl font-black tracking-tight">{student.name}</h3>
                            <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mt-1">{student.matricNumber} • {student.level}L • {student.unit}</p>
                        </div>
                    </div>
                </div>

                <div className="p-12 space-y-12">
                    {/* Academic Performance Table */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">Academic Summary</h4>
                        </div>
                        <div className="overflow-hidden border border-slate-100 rounded-3xl">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Subject</th>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">CA (40)</th>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Exam (60)</th>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Total</th>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Grade</th>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {results.map((res: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="p-6">
                                                <p className="font-black text-slate-900">{res.courseName}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{res.courseCode}</p>
                                            </td>
                                            <td className="p-6 text-center font-bold text-slate-600">{res.caScore}</td>
                                            <td className="p-6 text-center font-bold text-slate-600">{res.examScore}</td>
                                            <td className="p-6 text-center font-black text-indigo-600 text-lg">{res.totalScore}</td>
                                            <td className="p-6 text-center">
                                                <Badge className={cn(
                                                    "font-black rounded-lg w-8 h-8 flex items-center justify-center p-0",
                                                    res.grade === 'A' ? "bg-emerald-500" : 
                                                    res.grade === 'B' ? "bg-blue-500" :
                                                    res.grade === 'C' ? "bg-amber-500" : "bg-rose-500"
                                                )}>
                                                    {res.grade}
                                                </Badge>
                                            </td>
                                            <td className="p-6 text-right font-medium text-slate-500 text-xs italic">
                                                {parseFloat(res.totalScore) >= 70 ? "Excellent" : 
                                                 parseFloat(res.totalScore) >= 60 ? "Very Good" : 
                                                 parseFloat(res.totalScore) >= 45 ? "Pass" : "Weak"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Behavioral & Trait Assessment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">Affective Traits</h4>
                            </div>
                            <div className="space-y-4">
                                {behaviors.map((trait: any, idx: number) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">{trait.name}</span>
                                            <span className="text-indigo-600">{trait.score}/5</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${(trait.score / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Principal's Remarks & Signature */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Star className="w-5 h-5 text-indigo-600" />
                                <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">Official Remarks</h4>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-3xl space-y-6 border border-slate-100">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Form Teacher's Remark</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                                        "{remarks?.classTeacherComment || "Student shows consistent improvement in technical subjects but needs more focus on extracurricular participation."}"
                                    </p>
                                </div>
                                <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Validated by Registrar</p>
                                        <div className="h-10 w-32 bg-slate-200/50 rounded flex items-center justify-center text-[10px] text-slate-400 italic">
                                            Electronic Signature
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-indigo-600">Seal of Excellence</p>
                                        <Badge className="bg-indigo-600 text-white mt-1">CERTIFIED</Badge>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Attendance Insight */}
                    <div className="pt-8 border-t border-slate-100 flex flex-wrap gap-8">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Times Present:</span>
                            <span className="text-sm font-black text-slate-900">{remarks?.daysPresent || 0} / {remarks?.daysOpen || 0} Days</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Star className="w-5 h-5 text-slate-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Position in Class:</span>
                            <span className="text-sm font-black text-slate-900">12th of 45 Students</span>
                        </div>
                    </div>
                </div>
                
                {/* Institutional Footer */}
                <div className="bg-slate-900 p-8 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/30">
                        This document is a valid digital representation of academic records stored in the Institutional Database.
                    </p>
                </div>
            </div>

            {/* Print Styling */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
