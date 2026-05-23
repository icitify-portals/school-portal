"use client";

import { GraduationCap, School, MapPin, Phone, Mail, Award, Target } from "lucide-react";

interface ResultData {
    student: any;
    results: any[];
    summaries: any[];
    annualSummaries?: any[];
}

export const K12ReportCard = ({ data, term }: { data: ResultData, term: string }) => {
    const { student, results, summaries, annualSummaries } = data;
    const termNumber = parseInt(term);
    
    // Filter results for only this term
    const currentTermResults = results.filter(r => r.semester === termNumber);
    const summary = summaries.find(s => s.semester === termNumber.toString());

    return (
        <div className="bg-white p-10 border-[12px] border-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden">
            {/* Aesthetic Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full -ml-16 -mb-16 z-0" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 border-b-2 border-slate-100 pb-12">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl rotate-3">
                            <School className="w-14 h-14 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Institutional Academy</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] italic">Excellence & Discipline</p>
                        </div>
                    </div>
                    <div className="text-center md:text-right space-y-1">
                        <div className="flex items-center justify-center md:justify-end gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                            <MapPin className="w-3 h-3" />
                            <span>Campus Headquarters</span>
                        </div>
                        <p className="text-slate-900 font-black text-lg">STUDENT REPORT CARD</p>
                        <div className="inline-block px-4 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                            {termNumber === 1 ? "FIRST TERM" : termNumber === 2 ? "SECOND TERM" : "THIRD TERM (ANNUAL)"}
                        </div>
                    </div>
                </div>

                {/* Student Profile Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="md:col-span-2 bg-slate-50 rounded-3xl p-8 border border-slate-100 flex gap-8 items-center">
                        <div className="w-24 h-24 bg-white rounded-2xl border-2 border-white shadow-lg overflow-hidden shrink-0">
                           {student.imageUrl ? (
                               <img src={student.imageUrl} alt={student.name} className="w-full h-full object-cover" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                   <GraduationCap className="w-10 h-10 text-slate-300" />
                               </div>
                           )}
                        </div>
                        <div className="space-y-4 w-full">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Student Name</p>
                                    <p className="text-xl font-black text-slate-900 tracking-tight">{student.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Student ID/Matric</p>
                                    <p className="text-lg font-black text-indigo-600 font-mono tracking-tighter">{student.matricNumber || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Class/Grade</p>
                                    <p className="text-sm font-bold text-slate-700">{student.currentLevel}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Class Arm</p>
                                    <p className="text-sm font-bold text-slate-700">{student.groupName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Academic Year</p>
                                    <p className="text-sm font-bold text-slate-700">{student.admissionYear || '2024/2025'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-center items-center gap-2 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 relative z-10">OVERALL PERFORMANCE</p>
                        <div className="text-5xl font-black italic tracking-tighter relative z-10">{summary?.gpa || "N/A"}</div>
                        <p className="text-xs font-bold text-white/60 relative z-10">Average Score</p>
                    </div>
                </div>

                {/* Score Table */}
                <div className="overflow-hidden border-2 border-slate-50 rounded-[2rem] shadow-sm mb-12">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900">
                            <tr className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em]">
                                <th className="px-8 py-5">Subject/Course</th>
                                <th className="px-8 py-5 text-center">CA (40%)</th>
                                <th className="px-8 py-5 text-center">EXAM (60%)</th>
                                <th className="px-8 py-5 text-center">TOTAL (100)</th>
                                <th className="px-8 py-5 text-center">GRADE</th>
                                {termNumber < 3 && <th className="px-8 py-5 text-center">CLASS RANK</th>}
                                {termNumber === 3 && <th className="px-8 py-5 text-center">LEVEL RANK</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentTermResults.map((r, i) => (
                                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{r.title}</div>
                                        <div className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">{r.code}</div>
                                    </td>
                                    <td className="px-8 py-5 text-center text-slate-600 font-bold">{r.caScore || 0}</td>
                                    <td className="px-8 py-5 text-center text-slate-600 font-bold">{r.examScore || 0}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="text-lg font-black text-slate-900 tabular-nums">{r.totalScore || 0}</span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                                            r.grade === 'A' ? 'bg-green-600 text-white shadow-green-200' :
                                            r.grade === 'F' ? 'bg-red-600 text-white shadow-red-200' : 
                                            'bg-slate-100 text-slate-900 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200'
                                        }`}>
                                            {r.grade}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="inline-flex flex-col items-center">
                                           <span className="text-sm font-black text-slate-900 tracking-tighter">{termNumber === 3 ? r.rankLevel : r.rankClass || '--' }</span>
                                           <div className="w-8 h-1 bg-slate-100 rounded-full mt-1 group-hover:bg-indigo-200 transition-all" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Annual Cumulative Section (Only for T3) */}
                {termNumber === 3 && annualSummaries && annualSummaries.length > 0 && (
                    <div className="mb-12 bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                                    <Award className="w-10 h-10 text-indigo-300" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-1">Annual Performance Summary</h4>
                                    <p className="text-indigo-300 font-bold text-xs uppercase tracking-widest">Cumulative Result of T1, T2 & T3</p>
                                </div>
                            </div>
                            <div className="flex gap-12 text-center">
                                <div>
                                    <p className="text-7xl font-black italic tracking-tighter">{annualSummaries[0].averageScore}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">ANNUAL AVERAGE</p>
                                </div>
                                <div className="w-px h-16 bg-indigo-500/30 self-center" />
                                <div>
                                    <p className="text-7xl font-black italic tracking-tighter text-indigo-400">{annualSummaries[0].rankLevel}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">ANNUAL POSITION</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer / Signatures */}
                <div className="mt-20 pt-10 border-t-2 border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                     <div className="space-y-6">
                         <div className="h-16 flex items-end justify-center">
                            <div className="w-48 h-px bg-slate-200 border-dashed border-t-2" />
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Teacher's Signature</p>
                     </div>
                     <div className="space-y-6">
                         <div className="h-16 flex items-end justify-center">
                            <div className="w-48 h-px bg-slate-200 border-dashed border-t-2" />
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal's Signature</p>
                     </div>
                     <div className="space-y-6">
                         <div className="h-16 flex items-end justify-center px-8">
                             <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center p-4">
                                <div className="text-[10px] font-black text-slate-400">SCHOOL STAMP SPACE</div>
                             </div>
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official stamp</p>
                     </div>
                </div>
            </div>
        </div>
    );
};
