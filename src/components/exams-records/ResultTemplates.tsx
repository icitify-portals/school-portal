"use client";

import React from "react";
import { GraduationCap, School, MapPin, Award, Star, ShieldCheck, HeartPulse } from "lucide-react";

interface ResultData {
    student: any;
    results: any[];
    summaries: any[];
    annualSummaries?: any[];
}

// Utility to apply classes
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export const RowelSchoolsReportCard = ({ data, term, templateCode = 'rowel_schools' }: { data: any, term: string, templateCode?: string }) => {
    const { student, results } = data;
    const termNumber = parseInt(term);
    
    const currentTermResults = results.filter((r: any) => r.semester === termNumber || !r.semester);
    
    // Group behaviors by category
    const behaviors = data.behaviors || [];
    const affectiveTraits = behaviors.filter((b: any) => b.category === "affective");

    const remarks = data.remarks || {};
    const vitals = data.vitals || {};

    const totalSubjects = currentTermResults.length;
    const totalMarksObtainable = totalSubjects * 100;
    const totalMarksObtained = currentTermResults.reduce((s: number, r: any) => s + (r.totalScore || 0), 0);
    const scorePercentage = totalMarksObtainable > 0 ? Math.round((totalMarksObtained / totalMarksObtainable) * 100) : 0;

    return (
        <div className="bg-white p-8 border-[10px] border-emerald-700 rounded-[2.5rem] shadow-2xl relative max-w-[1600px] w-full mx-auto space-y-6 text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {/* Double Border Details */}
            <div className="absolute inset-2 border border-emerald-700/30 rounded-[2.2rem] pointer-events-none" />

            {/* Rowel Header */}
            <div className="flex flex-col md:flex-row justify-between items-center pb-6 border-b-2 border-emerald-700/20 gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-emerald-700 rounded-full flex flex-col items-center justify-center text-white shadow-lg text-center p-2 shrink-0">
                        <span className="text-[7px] font-black leading-none">THE ROWEL</span>
                        <span className="text-[7px] font-black leading-none mt-1">SCHOOLS</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">The Rowel Schools</h1>
                        <p className="text-slate-500 font-medium text-xs">No 23, Tanimowo Layout, Abayomi, Iwo Road, Ibadan</p>
                        <p className="text-slate-400 font-bold text-[10px] tracking-wider mt-0.5">07031055352; 08133004845</p>
                    </div>
                </div>
                <div className="text-center md:text-right">
                    <div className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                        {data.rubric ? data.rubric.name : `${termNumber === 1 ? "FIRST TERM" : termNumber === 2 ? "SECOND TERM" : "THIRD TERM"} REPORT SHEET`}
                    </div>
                    <p className="text-slate-500 text-xs font-bold">{data.session || "2024/2025"} ACADEMIC SESSION</p>
                </div>
            </div>

            {/* Student Metadata Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-100 items-center">
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">SURNAME</span>
                        <span className="text-sm font-black text-slate-950 uppercase">{student.lastName || student.name?.split(' ')[1] || 'OLADIPO'}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">OTHER NAMES</span>
                        <span className="text-sm font-black text-slate-950 uppercase">{student.firstName || student.name?.split(' ')[0] || 'RADIYYAH'}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">ADMISSION NO</span>
                        <span className="text-sm font-bold text-emerald-700 font-mono">{student.admissionNumber || student.matricNumber || 'TRC/024/0001'}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">GENDER</span>
                        <span className="text-sm font-semibold text-slate-700 uppercase">{student.gender || 'FEMALE'}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">CLASS LEVEL</span>
                        <span className="text-sm font-semibold text-slate-700 uppercase">{student.currentLevel} {student.groupName || ''}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">NO IN CLASS</span>
                        <span className="text-sm font-semibold text-slate-700">{(templateCode === '001a' && termNumber === 3) ? '18' : '6'}</span>
                    </div>
                </div>

                <div className="flex justify-center md:justify-end">
                    <div className="w-20 h-20 bg-white rounded-full border-2 border-emerald-500 shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                        {student.imageUrl ? (
                            <img src={student.imageUrl} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            <GraduationCap className="w-8 h-8 text-emerald-600" />
                        )}
                    </div>
                </div>
            </div>

            {/* Attendance section */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border border-slate-800">
                <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">TIMES SCHOOL OPENED</span>
                    <span className="text-lg font-black">{remarks.daysOpen || 122}</span>
                </div>
                <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">TIMES PRESENT</span>
                    <span className="text-lg font-black text-emerald-400">{remarks.daysPresent || 122}</span>
                </div>
                <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">TIMES ABSENT</span>
                    <span className="text-lg font-black text-rose-400">{remarks.daysAbsent || 0}</span>
                </div>
                <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">TERM POSITION</span>
                    <span className="text-lg font-black text-amber-400">
                        {(templateCode === '001a' && termNumber === 3) 
                            ? (currentTermResults[0]?.rankLevel || "1st") 
                            : (currentTermResults[0]?.rankClass || "1st")}
                    </span>
                </div>
            </div>

            {/* Physical Vitals and Affective Traits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Physical Dev */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                        <HeartPulse className="w-4 h-4 text-emerald-600" />
                        PHYSICAL DEVELOPMENT & HEALTH
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-center text-xs">
                        <div className="bg-white border rounded-xl p-3">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">HEIGHT</span>
                            <span className="font-extrabold text-slate-700 text-sm">{vitals.height ? `${vitals.height} m` : 'N/A'}</span>
                        </div>
                        <div className="bg-white border rounded-xl p-3">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">WEIGHT</span>
                            <span className="font-extrabold text-slate-700 text-sm">{vitals.weight ? `${vitals.weight} kg` : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Affective */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        AFFECTIVE DOMAIN RATINGS
                    </h3>
                    <div className="space-y-2 text-xs">
                        {affectiveTraits.length > 0 ? (
                            affectiveTraits.map((t: any) => (
                                <div key={t.name} className="flex justify-between items-center">
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">{t.name}</span>
                                    <span className="font-black text-emerald-700 uppercase text-[10px]">{t.score === 5 ? 'EXCELLENT' : t.score === 4 ? 'VERY GOOD' : 'GOOD'}</span>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">Punctuality</span>
                                    <span className="font-black text-emerald-700 uppercase text-[10px]">VERY GOOD</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">Neatness</span>
                                    <span className="font-black text-emerald-700 uppercase text-[10px]">EXCELLENT</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">Emotional Stability</span>
                                    <span className="font-black text-emerald-700 uppercase text-[10px]">GOOD</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance in Subjects Table */}
            <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-indigo-200 uppercase tracking-widest text-[9px]">
                        <tr>
                            <th className="px-6 py-4">Subject Name</th>
                            {data.rubric?.columnsConfig ? (
                                data.rubric.columnsConfig.map((col: any) => (
                                    <th key={col.id} className="px-6 py-4 text-center">{col.name} ({col.maxScore})</th>
                                ))
                            ) : (
                                <>
                                    <th className="px-6 py-4 text-center">CA (40%)</th>
                                    <th className="px-6 py-4 text-center">EXAM (60%)</th>
                                </>
                            )}
                            <th className="px-6 py-4 text-center">TOTAL (100)</th>
                            <th className="px-6 py-4 text-center">GRADE</th>
                            <th className="px-6 py-4 text-center">REMARK</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentTermResults.map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-black text-slate-900 tracking-tight uppercase">{r.title}</div>
                                    <div className="text-[9px] font-bold text-slate-400 font-mono tracking-tighter">{r.code}</div>
                                </td>
                                {data.rubric?.columnsConfig ? (
                                    data.rubric.columnsConfig.map((col: any) => {
                                        let val = 0;
                                        if (col.isExam) val = r.examScore || 0;
                                        else if (col.id === 'ca1' || col.name.toLowerCase().includes('1st')) val = r.test1 !== undefined ? r.test1 : Math.round((r.caScore || 0) / 2);
                                        else if (col.id === 'ca2' || col.name.toLowerCase().includes('2nd')) val = r.test2 !== undefined ? r.test2 : (r.caScore ? r.caScore - Math.round(r.caScore / 2) : 0);
                                        else val = r.caScore || 0;
                                        return <td key={col.id} className="px-6 py-4 text-center font-bold text-slate-600">{val}</td>;
                                    })
                                ) : (
                                    <>
                                        <td className="px-6 py-4 text-center font-bold text-slate-600">{r.caScore || 0}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-600">{r.examScore || 0}</td>
                                    </>
                                )}
                                <td className="px-6 py-4 text-center">
                                    <span className="text-base font-black text-slate-900 tabular-nums">{r.totalScore || 0}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={cn(
                                        "inline-block px-2 py-0.5 font-black rounded-lg text-xs",
                                        r.grade === 'F' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                    )}>
                                        {r.grade || 'C'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-500">
                                    {r.totalScore >= 90 ? 'OUTSTANDING' : r.totalScore >= 80 ? 'EXCELLENT' : r.totalScore >= 70 ? 'VERY GOOD' : r.totalScore >= 60 ? 'GOOD' : r.totalScore >= 50 ? 'PASS' : 'FAIL'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Performance Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border text-center text-xs font-bold text-slate-600">
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Total Subjects</span>
                    <span className="text-slate-950 font-black">{totalSubjects}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Obtainable Marks</span>
                    <span className="text-slate-950 font-black">{totalMarksObtainable}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Marks Obtained</span>
                    <span className="text-slate-950 font-black">{totalMarksObtained.toFixed(0)}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Percentage Score</span>
                    <span className="text-slate-950 font-black">{scorePercentage}%</span>
                </div>
            </div>

            {/* Qur'an Memorization box */}
            {templateCode === '001a' && data.quranMemorization && (
                <div className="border border-black rounded-2xl p-5 bg-slate-50/50 space-y-2 text-xs">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">
                        QUR'AN MEMORIZATION EVALUATION
                    </h3>
                    <div className="grid grid-cols-3 gap-4 font-bold text-slate-700">
                        <div>
                            <span className="text-[9px] uppercase tracking-wider block text-slate-400">Juz</span>
                            <span>{data.quranMemorization.juzId || "Juz 30"}</span>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase tracking-wider block text-slate-400">Read Ability</span>
                            <span>{data.quranMemorization.readingAbility || "Very Good"}</span>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase tracking-wider block text-slate-400">Remark</span>
                            <span>{data.quranMemorization.remark || "Fluent recitation"}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher & Principal Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                <div className="space-y-4">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">CLASS TEACHER COMMENT</span>
                        <p className="text-xs font-semibold text-slate-700 italic mt-1 bg-slate-50/50 border border-slate-100 rounded-xl p-3 uppercase">
                            {remarks.classTeacherComment || "HAS SHOWN EXCELLENT PROGRESS IN ACADEMICS. DILIGENT AND MOTIVATED."}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PRINCIPAL COMMENT</span>
                        <p className="text-xs font-semibold text-slate-700 italic mt-1 bg-slate-50/50 border border-slate-100 rounded-xl p-3 uppercase">
                            {remarks.headTeacherComment || "AN OUTSTANDING TERM RESULT. KEEP STRIVING FOR TOP STANDARDS."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DefaultK12ReportCard = ({ data, term }: { data: any, term: string }) => {
    const { student, results, summaries } = data;
    const termNumber = parseInt(term);
    const currentTermResults = results.filter((r: any) => r.semester === termNumber || !r.semester);
    const summary = summaries ? summaries.find((s: any) => s.semester === term.toString()) : null;

    return (
        <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-6 text-slate-800">
            <div className="text-center border-b pb-6">
                <h1 className="text-2xl font-black text-slate-900">K-12 ACADEMIC REPORT CARD</h1>
                <p className="text-slate-400 text-xs font-bold mt-1">TERM {term} • SESSION {data.session || "2024/2025"}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 rounded-xl p-4">
                <div>
                    <span className="text-slate-400 text-xs uppercase font-bold block">Student</span>
                    <span className="font-extrabold text-slate-800">{student.name}</span>
                </div>
                <div>
                    <span className="text-slate-400 text-xs uppercase font-bold block">ID/Matric</span>
                    <span className="font-bold text-slate-800">{student.admissionNumber || student.matricNumber}</span>
                </div>
            </div>

            <div className="overflow-hidden border rounded-xl">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-black">
                        <tr>
                            <th className="px-6 py-3">Subject</th>
                            <th className="px-6 py-3 text-center">CA</th>
                            <th className="px-6 py-3 text-center">Exam</th>
                            <th className="px-6 py-3 text-center">Total</th>
                            <th className="px-6 py-3 text-center">Grade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {currentTermResults.map((r: any, i: number) => (
                            <tr key={i}>
                                <td className="px-6 py-3 font-bold">{r.title}</td>
                                <td className="px-6 py-3 text-center">{r.caScore || 0}</td>
                                <td className="px-6 py-3 text-center">{r.examScore || 0}</td>
                                <td className="px-6 py-3 text-center font-bold">{r.totalScore || 0}</td>
                                <td className="px-6 py-3 text-center font-bold text-indigo-600">{r.grade || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const RowelSchools002ReportCard = ({ data, term, templateCode = '002' }: { data: any, term: string, templateCode?: string }) => {
    const { student, results } = data;
    const termNumber = parseInt(term);
    const isThirdTerm = termNumber === 3;
    const currentTermResults = results.filter((r: any) => r.semester === termNumber || !r.semester);

    const remarks = data.remarks || {};
    const vitals = data.vitals || {};
    const behaviors = data.behaviors || [];

    // Filter traits
    const affectiveTraits = behaviors.filter((b: any) => b.category === "affective");
    const psychomotorTraits = behaviors.filter((b: any) => b.category === "psychomotor" || b.category === "skills");

    const totalSubjects = currentTermResults.length;
    const totalMarksObtainable = totalSubjects * 100;
    const totalMarksObtained = currentTermResults.reduce((s: number, r: any) => s + (r.totalScore || 0), 0);
    const scorePercentage = totalMarksObtainable > 0 ? Math.round((totalMarksObtained / totalMarksObtainable) * 100) : 0;

    const classSize = templateCode === '002b' 
        ? (data.studentsInClassCount || 18) 
        : (data.studentsInClassDivisionCount || 6);

    const position = templateCode === '002a'
        ? (currentTermResults[0]?.rankClass || '1st')
        : (currentTermResults[0]?.rankLevel || '1st');

    const termLabel = termNumber === 1 ? "FIRST TERM" : termNumber === 2 ? "SECOND TERM" : "THIRD TERM";

    return (
        <div className="bg-white p-8 border-[10px] border-sky-600 rounded-[2.5rem] shadow-2xl relative max-w-[1600px] w-full mx-auto space-y-6 text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <div className="absolute inset-2 border border-sky-600/30 rounded-[2.2rem] pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center pb-6 border-b-2 border-sky-600/20 gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-sky-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg text-center p-2 shrink-0">
                        {templateCode === '002' ? 'ROWEL' : 'ROWEL GROUP'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">
                            {templateCode === '002' ? 'The Rowel Schools' : 'Rowel Group of Schools'}
                        </h1>
                        <p className="text-slate-500 font-medium text-xs">No 23, Tanimowo Layout, Abayomi, Iwo Road, Ibadan</p>
                        <p className="text-slate-400 font-bold text-[10px] tracking-wider mt-0.5">07031055352; 08133004845</p>
                    </div>
                </div>
                <div className="text-center md:text-right">
                    <div className="inline-block px-4 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                        {data.rubric ? data.rubric.name : `${termLabel} REPORT SHEET`}
                    </div>
                    <p className="text-slate-500 text-xs font-bold">{data.session || "2024/2025"} ACADEMIC SESSION</p>
                </div>
            </div>

            {/* Student metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 rounded-2xl p-6 border border-slate-100 items-center">
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">SURNAME</span>
                        <span className="text-sm font-black text-slate-950 uppercase">{student.lastName || 'OLADIPO'}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">OTHER NAMES</span>
                        <span className="text-sm font-black text-slate-950 uppercase">{`${student.firstName || ''} ${student.otherNames || ''}`.trim() || 'RADIYYAH'}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">ADMISSION NO</span>
                        <span className="text-sm font-bold text-sky-700 font-mono">{student.admissionNumber || student.matricNumber || 'TRC/024/0001'}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">GENDER</span>
                        <span className="text-sm font-semibold text-slate-700 uppercase">{student.gender || 'FEMALE'}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">CLASS</span>
                        <span className="text-sm font-semibold text-slate-700 uppercase">{student.currentLevel} {student.groupName || ''}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">NO IN CLASS</span>
                        <span className="text-sm font-semibold text-slate-700">{classSize}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">POSITION</span>
                        <span className="text-sm font-semibold text-amber-600 font-black">{position}</span>
                    </div>
                </div>

                <div className="flex justify-center md:justify-end">
                    <div className="w-20 h-20 bg-white rounded-full border-2 border-sky-500 shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                        {student.imageUrl ? (
                            <img src={student.imageUrl} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            <GraduationCap className="w-8 h-8 text-sky-600" />
                        )}
                    </div>
                </div>
            </div>

            {/* Cognitive assessment horizontal table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-sky-600 text-white uppercase tracking-wider text-[9px]">
                        <tr>
                            <th className="px-4 py-3" rowSpan={2}>Subject</th>
                            {data.rubric?.columnsConfig ? (
                                data.rubric.columnsConfig.map((col: any) => (
                                    <th key={col.id} className="px-4 py-3 text-center" rowSpan={2}>{col.name} ({col.maxScore})</th>
                                ))
                            ) : (
                                <>
                                    <th className="px-4 py-3 text-center" colSpan={2}>Continuous</th>
                                    <th className="px-4 py-3 text-center" rowSpan={2}>Exam</th>
                                </>
                            )}
                            <th className="px-4 py-3 text-center" rowSpan={2}>Term Total</th>
                            {isThirdTerm && (
                                <>
                                    <th className="px-4 py-3 text-center" rowSpan={2}>2nd Term</th>
                                    <th className="px-4 py-3 text-center" rowSpan={2}>1st Term</th>
                                    <th className="px-4 py-3 text-center" rowSpan={2}>Annual Avg</th>
                                </>
                            )}
                            <th className="px-4 py-3 text-center" rowSpan={2}>Grade</th>
                            <th className="px-4 py-3 text-center" rowSpan={2}>Remark</th>
                        </tr>
                        {!data.rubric?.columnsConfig && (
                            <tr className="bg-sky-500 text-white">
                                <th className="px-2 py-1 text-center font-bold">CA1 (20)</th>
                                <th className="px-2 py-1 text-center font-bold">CA2 (20)</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentTermResults.map((r: any, i: number) => {
                            const test1Val = r.test1 !== undefined ? r.test1 : (r.caScore ? Math.round(r.caScore / 2) : 0);
                            const test2Val = r.test2 !== undefined ? r.test2 : (r.caScore ? r.caScore - test1Val : 0);

                            return (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-black text-slate-900 tracking-tight uppercase">{r.title}</td>
                                    {data.rubric?.columnsConfig ? (
                                        data.rubric.columnsConfig.map((col: any) => {
                                            let val = 0;
                                            if (col.isExam) val = r.examScore || 0;
                                            else if (col.id === 'ca1' || col.name.toLowerCase().includes('1st')) val = test1Val;
                                            else if (col.id === 'ca2' || col.name.toLowerCase().includes('2nd')) val = test2Val;
                                            else val = r.caScore || 0;
                                            return <td key={col.id} className="px-4 py-3 text-center font-bold text-slate-600">{val}</td>;
                                        })
                                    ) : (
                                        <>
                                            <td className="px-4 py-3 text-center font-bold text-slate-600">{test1Val}</td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-600">{test2Val}</td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-600">{r.examScore || 0}</td>
                                        </>
                                    )}
                                    <td className="px-4 py-3 text-center font-black text-slate-900">{r.totalScore || 0}</td>
                                    {isThirdTerm && (
                                        <>
                                            <td className="px-4 py-3 text-center text-slate-500 font-semibold">{r.secondTermTotal || r.totalScore}</td>
                                            <td className="px-4 py-3 text-center text-slate-500 font-semibold">{r.firstTermTotal || r.totalScore}</td>
                                            <td className="px-4 py-3 text-center text-sky-700 font-black">{r.classAverage || r.totalScore}</td>
                                        </>
                                    )}
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block px-2 py-0.5 font-black rounded-lg text-xs bg-sky-50 text-sky-700">
                                            {r.grade || 'C'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-[10px] font-black uppercase text-slate-500">{r.teacherRemark || 'GOOD'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-xl border text-center text-xs font-bold text-slate-600">
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Offered</span>
                    <span className="text-slate-950 font-black">{totalSubjects}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Obtainable</span>
                    <span className="text-slate-950 font-black">{totalMarksObtainable}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Obtained</span>
                    <span className="text-slate-950 font-black">{totalMarksObtained.toFixed(0)}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Percentage</span>
                    <span className="text-slate-950 font-black">{scorePercentage}%</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Attendance</span>
                    <span className="text-slate-950 font-black">{remarks.daysPresent || 122}/{remarks.daysOpen || 122}</span>
                </div>
            </div>

            {/* Quran Memorization */}
            {templateCode !== '002' && data.quranMemorization && (
                <div className="border border-sky-200 rounded-2xl p-5 bg-sky-50/20 space-y-2 text-xs">
                    <h3 className="text-xs font-black text-sky-700 uppercase tracking-wider border-b border-sky-100 pb-2">
                        QUR'AN MEMORIZATION EVALUATION
                    </h3>
                    <div className="grid grid-cols-3 gap-4 font-bold text-slate-700">
                        <div>
                            <span className="text-[9px] uppercase tracking-wider block text-slate-400">Juz</span>
                            <span>{data.quranMemorization.juzId}</span>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase tracking-wider block text-slate-400">Read Ability</span>
                            <span>{data.quranMemorization.readingAbility}</span>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase tracking-wider block text-slate-400">Remark</span>
                            <span>{data.quranMemorization.remark}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Ratings & Comments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Affective/Psychomotor domains */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">RATINGS</h3>
                    <div className="space-y-2 text-xs">
                        {affectiveTraits.length > 0 ? (
                            affectiveTraits.slice(0, 5).map((t: any) => (
                                <div key={t.name} className="flex justify-between items-center">
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">{t.name}</span>
                                    <span className="font-black text-sky-700 uppercase text-[10px]">{t.score === 5 ? 'A' : t.score === 4 ? 'B' : 'C'}</span>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">Punctuality</span>
                                    <span className="font-black text-sky-700 uppercase text-[10px]">A</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">Neatness</span>
                                    <span className="font-black text-sky-700 uppercase text-[10px]">A</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Comments block */}
                <div className="space-y-4 text-xs font-bold text-slate-600">
                    <div>
                        <span className="text-[9px] uppercase tracking-wider block text-slate-400">Teacher comment</span>
                        <p className="text-xs font-semibold text-slate-700 italic mt-1 bg-slate-50 rounded-xl p-3 border">
                            {remarks.classTeacherComment || "GOOD EFFORT. KEEP STRIVING."}
                        </p>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase tracking-wider block text-slate-400">Next term begins</span>
                        <p className="text-xs font-extrabold text-sky-600 mt-1">{remarks.nextTermStarts || "APRIL 28, 2025"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const K12ReportCard003 = ({ data, term }: { data: any, term: string }) => {
    const { student, results } = data;
    const termNumber = parseInt(term);
    const isThirdTerm = termNumber === 3;
    const currentTermResults = results.filter((r: any) => r.semester === termNumber || !r.semester);

    const remarks = data.remarks || {};
    const totalSubjects = currentTermResults.length;
    const totalMarksObtainable = totalSubjects * 100;
    const totalMarksObtained = currentTermResults.reduce((s: number, r: any) => s + (r.totalScore || 0), 0);
    const scorePercentage = totalMarksObtainable > 0 ? Math.round((totalMarksObtained / totalMarksObtainable) * 100) : 0;

    return (
        <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-6 text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {/* Logo in center below name */}
            <div className="text-center pb-6 border-b space-y-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{data.session ? 'Rowel Institution' : 'THE INSTITUTION NAME'}</h1>
                <p className="text-slate-400 text-xs italic">Learning for Excellence</p>
                <div className="flex justify-center py-2">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border shrink-0">
                        <School className="w-8 h-8 text-slate-600" />
                    </div>
                </div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mt-2">
                    {data.rubric ? data.rubric.name : `${termNumber === 1 ? "FIRST TERM" : termNumber === 2 ? "SECOND TERM" : "THIRD TERM"} REPORT SHEET`}
                </h2>
            </div>

            {/* Student metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 rounded-xl p-4">
                <div>
                    <span className="text-slate-400 uppercase font-bold block">Student Name</span>
                    <span className="font-extrabold text-slate-800 text-sm uppercase">{student.name}</span>
                </div>
                <div>
                    <span className="text-slate-400 uppercase font-bold block">Matric / Adm No</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">{student.admissionNumber || student.matricNumber}</span>
                </div>
                <div>
                    <span className="text-slate-400 uppercase font-bold block">Class Level</span>
                    <span className="font-bold text-slate-700 uppercase">{student.currentLevel} {student.groupName || ''}</span>
                </div>
                <div>
                    <span className="text-slate-400 uppercase font-bold block">Class Size</span>
                    <span className="font-bold text-slate-700">{data.studentsInClassDivisionCount || 6}</span>
                </div>
            </div>

            {/* Purpose Statement */}
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-xs leading-relaxed text-sky-800">
                <p className="font-bold mb-1">Purpose Statement</p>
                The purpose of this report sheet is to communicate the pupil’s progress towards learning standards and demonstrating work and life skills. This feedback will support a partnership among pupils, parents and teachers in setting goals and monitoring progress towards meeting the established standards.
            </div>

            {/* Subjects table */}
            <div className="overflow-hidden border rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white uppercase text-[9px] tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Subject Name</th>
                            {data.rubric?.columnsConfig ? (
                                data.rubric.columnsConfig.map((col: any) => (
                                    <th key={col.id} className="px-4 py-3 text-center">{col.name} ({col.maxScore})</th>
                                ))
                            ) : (
                                <>
                                    <th className="px-4 py-3 text-center">Test (40)</th>
                                    <th className="px-4 py-3 text-center">Exam (60)</th>
                                </>
                            )}
                            <th className="px-4 py-3 text-center">Total (100)</th>
                            {isThirdTerm && (
                                <>
                                    <th className="px-4 py-3 text-center">2nd Term</th>
                                    <th className="px-4 py-3 text-center">1st Term</th>
                                    <th className="px-4 py-3 text-center">Ann Avg</th>
                                </>
                            )}
                            <th className="px-4 py-3 text-center">Grade</th>
                            <th className="px-4 py-3 text-center">Highest</th>
                            <th className="px-4 py-3 text-center">Lowest</th>
                            <th className="px-4 py-3 text-center">Average</th>
                            <th className="px-4 py-3 text-center">Position</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentTermResults.map((r: any, i: number) => {
                            const testVal = r.test1 !== undefined ? r.test1 : (r.caScore || 0);

                            return (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-bold text-slate-800 uppercase">{r.title}</td>
                                    {data.rubric?.columnsConfig ? (
                                        data.rubric.columnsConfig.map((col: any) => {
                                            let val = 0;
                                            if (col.isExam) val = r.examScore || 0;
                                            else if (col.id === 'ca1' || col.name.toLowerCase().includes('1st') || col.name.toLowerCase().includes('test')) val = testVal;
                                            else val = r.caScore || 0;
                                            return <td key={col.id} className="px-4 py-3 text-center">{val}</td>;
                                        })
                                    ) : (
                                        <>
                                            <td className="px-4 py-3 text-center">{testVal}</td>
                                            <td className="px-4 py-3 text-center">{r.examScore || 0}</td>
                                        </>
                                    )}
                                    <td className="px-4 py-3 text-center font-bold text-slate-900">{r.totalScore || 0}</td>
                                    {isThirdTerm && (
                                        <>
                                            <td className="px-4 py-3 text-center text-slate-500">{r.secondTermTotal || r.totalScore}</td>
                                            <td className="px-4 py-3 text-center text-slate-500">{r.firstTermTotal || r.totalScore}</td>
                                            <td className="px-4 py-3 text-center text-indigo-600 font-bold">{r.classAverage || r.totalScore}</td>
                                        </>
                                    )}
                                    <td className="px-4 py-3 text-center font-bold text-indigo-600">{r.grade || 'C'}</td>
                                    <td className="px-4 py-3 text-center font-medium text-slate-600">{r.highestScore || r.totalScore}</td>
                                    <td className="px-4 py-3 text-center font-medium text-slate-600">{r.lowestScore || r.totalScore}</td>
                                    <td className="px-4 py-3 text-center font-medium text-slate-600">{r.classAverage || r.totalScore}</td>
                                    <td className="px-4 py-3 text-center font-mono">{r.rankClass || '1/6'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border text-center text-xs">
                <div>
                    <span className="text-slate-400 block font-bold">No. of Subjects</span>
                    <span className="font-extrabold text-slate-800">{totalSubjects}</span>
                </div>
                <div>
                    <span className="text-slate-400 block font-bold">Obtainable</span>
                    <span className="font-extrabold text-slate-800">{totalMarksObtainable}</span>
                </div>
                <div>
                    <span className="text-slate-400 block font-bold">Obtained</span>
                    <span className="font-extrabold text-slate-800">{totalMarksObtained.toFixed(0)}</span>
                </div>
                <div>
                    <span className="text-slate-400 block font-bold">Average</span>
                    <span className="font-extrabold text-indigo-600">{scorePercentage}%</span>
                </div>
            </div>

            {/* Comments and remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 text-xs">
                <div className="bg-slate-50/50 p-3 rounded-lg border">
                    <span className="text-slate-400 block font-bold uppercase text-[9px] mb-1">Teacher comment</span>
                    <p className="italic text-slate-700">{remarks.classTeacherComment || "GOOD WORK."}</p>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-lg border">
                    <span className="text-slate-400 block font-bold uppercase text-[9px] mb-1">HOS comment</span>
                    <p className="italic text-slate-700">{remarks.headTeacherComment || "AN EXCELLENT PERFORMANCE."}</p>
                </div>
            </div>
        </div>
    );
};

export const CaramotSchool004ReportCard = ({ data, term }: { data: any, term: string }) => {
    const { student, results } = data;
    const termNumber = parseInt(term);
    const isThirdTerm = termNumber === 3;
    const currentTermResults = results.filter((r: any) => r.semester === termNumber || !r.semester);

    const remarks = data.remarks || {};
    const behaviors = data.behaviors || [];

    const totalSubjects = currentTermResults.length;
    const totalMarksObtained = currentTermResults.reduce((s: number, r: any) => s + (r.totalScore || 0), 0);
    const scorePercentage = totalSubjects > 0 ? Math.round((totalMarksObtained / (totalSubjects * 100)) * 100) : 0;

    return (
        <div className="bg-white p-8 border-[6px] border-blue-700 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-6 text-[#2d2d6c]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {/* Header banner */}
            <div className="flex justify-between items-center pb-6 border-b-2 border-blue-700/20">
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-white border border-blue-700/30 rounded-full flex items-center justify-center shrink-0 shadow-md">
                        {student.imageUrl ? (
                            <img src={student.imageUrl} alt="School Logo" className="w-20 h-20 object-cover" />
                        ) : (
                            <School className="w-12 h-12 text-blue-700" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-blue-600 tracking-wider">CARAMOT SCHOOL</h1>
                        <p className="text-slate-500 font-medium text-xs">Creche • Nursery • Primary / Basic Education</p>
                        <p className="text-slate-400 font-bold text-[10px] tracking-wider mt-0.5">Tel: 0803-XXXX-XXX | E-mail: info@caramotschools.com</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-black">
                        {termNumber === 1 ? "FIRST TERM" : termNumber === 2 ? "SECOND TERM" : "THIRD TERM"}
                    </div>
                    <p className="text-slate-500 text-xs font-bold mt-1">{data.session || "2024/2025"}</p>
                </div>
            </div>

            {/* Layout split: Left major (subject grid), Right minor (skills & scale) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-6">
                    {/* Personal data */}
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-blue-100 grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-slate-400 block font-bold">NAME:</span>
                            <span className="font-extrabold text-blue-900">{student.name}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-bold">CLASS:</span>
                            <span className="font-bold text-slate-700">{student.currentLevel} {student.groupName || ''}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-bold">MATRIC NO:</span>
                            <span className="font-bold text-slate-700">{student.admissionNumber || student.matricNumber}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-bold">PERCENTAGE:</span>
                            <span className="font-extrabold text-blue-700">{scorePercentage}%</span>
                        </div>
                    </div>

                    {/* Table grid */}
                    <div className="overflow-hidden border border-blue-200 rounded-xl shadow-sm bg-white">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-blue-600 text-white uppercase text-[9px] tracking-wider">
                                <tr>
                                    <th className="px-3 py-3" rowSpan={2}>Subject</th>
                                    <th className="px-3 py-3 text-center" colSpan={3}>Assessment (100)</th>
                                    {isThirdTerm && (
                                        <>
                                            <th className="px-3 py-3 text-center" rowSpan={2}>2nd Term</th>
                                            <th className="px-3 py-3 text-center" rowSpan={2}>1st Term</th>
                                            <th className="px-3 py-3 text-center" rowSpan={2}>Ann Avg</th>
                                        </>
                                    )}
                                    <th className="px-3 py-3 text-center" rowSpan={2}>Grade</th>
                                </tr>
                                <tr className="bg-blue-500">
                                    <th className="px-1 py-1 text-center">Test1 (20)</th>
                                    <th className="px-1 py-1 text-center">Test2 (20)</th>
                                    <th className="px-1 py-1 text-center">Exam (60)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {currentTermResults.map((r: any, i: number) => {
                                    const test1Val = r.test1 !== undefined ? r.test1 : (r.caScore ? Math.round(r.caScore / 2) : 0);
                                    const test2Val = r.test2 !== undefined ? r.test2 : (r.caScore ? r.caScore - test1Val : 0);

                                    return (
                                        <tr key={i}>
                                            <td className="px-3 py-2.5 font-bold uppercase text-slate-800">{r.title}</td>
                                            <td className="px-3 py-2.5 text-center">{test1Val}</td>
                                            <td className="px-3 py-2.5 text-center">{test2Val}</td>
                                            <td className="px-3 py-2.5 text-center">{r.examScore || 0}</td>
                                            {isThirdTerm && (
                                                <>
                                                    <td className="px-3 py-2.5 text-center text-slate-500">{r.secondTermTotal || r.totalScore}</td>
                                                    <td className="px-3 py-2.5 text-center text-slate-500">{r.firstTermTotal || r.totalScore}</td>
                                                    <td className="px-3 py-2.5 text-center font-bold">{r.classAverage || r.totalScore}</td>
                                                </>
                                            )}
                                            <td className="px-3 py-2.5 text-center font-black">{r.grade || 'C'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Skills/Traits */}
                    <div className="border border-blue-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                        <h3 className="text-xs font-black border-b border-blue-100 pb-1 uppercase tracking-wider">SKILLS</h3>
                        <div className="space-y-1 text-[10px]">
                            {behaviors.slice(0, 6).map((b: any) => (
                                <div key={b.name} className="flex justify-between">
                                    <span className="font-bold text-slate-600 uppercase">{b.name}</span>
                                    <span className="font-black text-blue-700">{b.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grading key */}
                    <div className="border border-blue-200 rounded-xl p-4 bg-white space-y-1 text-[10px]">
                        <h4 className="font-black border-b pb-1">GRADE SCALE</h4>
                        <div className="space-y-0.5 font-medium text-slate-500">
                            <div className="flex justify-between"><span>80 - 100</span><span>Excellent</span></div>
                            <div className="flex justify-between"><span>70 - 79</span><span>Very Good</span></div>
                            <div className="flex justify-between"><span>60 - 69</span><span>Good</span></div>
                            <div className="flex justify-between"><span>50 - 59</span><span>Pass</span></div>
                            <div className="flex justify-between"><span>0 - 49</span><span>Fail</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Remarks footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-blue-100 text-xs">
                <div className="space-y-2">
                    <div>
                        <span className="text-[9px] uppercase tracking-wider block text-slate-400">Class Teacher remark</span>
                        <p className="italic font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border">{remarks.classTeacherComment || "GOOD PERFORMANCE."}</p>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase tracking-wider block text-slate-400">Next term resumption</span>
                        <p className="font-extrabold text-blue-600 mt-1">{remarks.nextTermStarts || "APRIL 28, 2025"}</p>
                    </div>
                </div>
                <div>
                    <div>
                        <span className="text-[9px] uppercase tracking-wider block text-slate-400">Head Teacher remark</span>
                        <p className="italic font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border">{remarks.headTeacherComment || "KEEP STRIVING."}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AdaptiveReportCard005 = ({ data, term }: { data: any, term: string }) => {
    const { student, results } = data;
    const termNumber = parseInt(term);
    const isThirdTerm = termNumber === 3;
    const currentTermResults = results.filter((r: any) => r.semester === termNumber || !r.semester);

    const remarks = data.remarks || {};
    const totalSubjects = currentTermResults.length;
    const totalMarksObtainable = totalSubjects * 100;
    const totalMarksObtained = currentTermResults.reduce((s: number, r: any) => s + (r.totalScore || 0), 0);
    const scorePercentage = totalMarksObtainable > 0 ? Math.round((totalMarksObtained / totalMarksObtainable) * 100) : 0;

    // Detect pre-primary class
    const isPrePrimary = /creche|nursery|pre\s*school|reception/i.test(student.currentLevel?.toString() || "");

    if (isPrePrimary) {
        return (
            <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-6 text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <div className="text-center pb-6 border-b">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{data.session ? 'THE INSTITUTION' : 'THE SCHOOL NAME'}</h1>
                    <p className="text-slate-400 text-xs mt-1">Nurturing Young Minds</p>
                    <h2 className="text-lg font-black text-indigo-600 mt-3">PRE-PRIMARY PROGRESS REPORT</h2>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 rounded-xl p-4">
                    <div><span className="text-slate-400 block">Name:</span> <span className="font-bold text-sm uppercase">{student.name}</span></div>
                    <div><span className="text-slate-400 block">Class:</span> <span className="font-bold text-sm uppercase">{student.currentLevel}</span></div>
                </div>

                {/* Textual development remarks */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900 border-b pb-1">AREAS OF ASSESSMENT</h3>
                    <div className="space-y-3">
                        {currentTermResults.map((r: any, idx: number) => (
                            <div key={idx} className="bg-slate-50/50 p-3 rounded-lg border">
                                <span className="font-bold block text-slate-800 text-xs mb-1 uppercase">{r.title}</span>
                                <p className="text-xs text-slate-600 italic leading-relaxed">{r.teacherRemark || "Demonstrating satisfactory progress and development traits."}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Principal comment & Resumption */}
                <div className="border-t pt-4 text-xs space-y-2">
                    <div>
                        <span className="text-[9px] uppercase tracking-wider block text-slate-400">Head Teacher comment</span>
                        <p className="italic text-slate-700 mt-0.5">{remarks.headTeacherComment || "Satisfactory development. Keep it up."}</p>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase tracking-wider block text-slate-400">Next term resumption</span>
                        <p className="font-bold text-indigo-600">{remarks.nextTermStarts || "April 28, 2025"}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Primary school class layout
    return (
        <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-6 text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <div className="text-center pb-6 border-b">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{data.session ? 'THE INSTITUTION' : 'THE SCHOOL NAME'}</h1>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">PRIMARY REPORT CARD</h2>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 rounded-xl p-4">
                <div><span className="text-slate-400 block">Name:</span> <span className="font-bold text-sm uppercase">{student.name}</span></div>
                <div><span className="text-slate-400 block">Class:</span> <span className="font-bold text-sm uppercase">{student.currentLevel} {student.groupName || ''}</span></div>
            </div>

            {/* Table */}
            <div className="overflow-hidden border rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white uppercase text-[9px] tracking-wider">
                        <tr>
                            <th className="px-4 py-3" rowSpan={2}>Subject</th>
                            <th className="px-4 py-3 text-center" colSpan={3}>Continuous (40)</th>
                            <th className="px-4 py-3 text-center" rowSpan={2}>Exam (60)</th>
                            {isThirdTerm && (
                                <>
                                    <th className="px-4 py-3 text-center" rowSpan={2}>2nd Term</th>
                                    <th className="px-4 py-3 text-center" rowSpan={2}>1st Term</th>
                                    <th className="px-4 py-3 text-center" rowSpan={2}>Ann Avg</th>
                                </>
                            )}
                            <th className="px-4 py-3 text-center" rowSpan={2}>Grade</th>
                        </tr>
                        <tr className="bg-slate-800">
                            <th className="px-2 py-1 text-center">Test1 (20)</th>
                            <th className="px-2 py-1 text-center">Test2 (20)</th>
                            <th className="px-2 py-1 text-center">Total (40)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentTermResults.map((r: any, i: number) => {
                            const test1Val = r.test1 !== undefined ? r.test1 : (r.caScore ? Math.round(r.caScore / 2) : 0);
                            const test2Val = r.test2 !== undefined ? r.test2 : (r.caScore ? r.caScore - test1Val : 0);

                            return (
                                <tr key={i}>
                                    <td className="px-4 py-2.5 font-bold uppercase text-slate-800">{r.title}</td>
                                    <td className="px-4 py-2.5 text-center">{test1Val}</td>
                                    <td className="px-4 py-2.5 text-center">{test2Val}</td>
                                    <td className="px-4 py-2.5 text-center font-semibold">{r.caScore || 0}</td>
                                    <td className="px-4 py-2.5 text-center">{r.examScore || 0}</td>
                                    {isThirdTerm && (
                                        <>
                                            <td className="px-4 py-2.5 text-center text-slate-500">{r.secondTermTotal || r.totalScore}</td>
                                            <td className="px-4 py-2.5 text-center text-slate-500">{r.firstTermTotal || r.totalScore}</td>
                                            <td className="px-4 py-2.5 text-center font-bold">{r.classAverage || r.totalScore}</td>
                                        </>
                                    )}
                                    <td className="px-4 py-2.5 text-center font-black text-indigo-600">{r.grade || 'C'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border text-center text-xs">
                <div><span className="text-slate-400 block">Obtainable</span> <span className="font-bold text-slate-800">{totalMarksObtainable}</span></div>
                <div><span className="text-slate-400 block">Obtained</span> <span className="font-bold text-slate-800">{totalMarksObtained.toFixed(0)}</span></div>
                <div><span className="text-slate-400 block">Percentage</span> <span className="font-bold text-indigo-600">{scorePercentage}%</span></div>
            </div>

            {/* Comments footer */}
            <div className="border-t pt-4 text-xs space-y-2">
                <div><span className="text-slate-400 block uppercase text-[9px] font-bold">Teacher comment</span> <p className="italic text-slate-700">{remarks.classTeacherComment || "GOOD WORK."}</p></div>
                <div><span className="text-slate-400 block uppercase text-[9px] font-bold">Head Teacher comment</span> <p className="italic text-slate-700">{remarks.headTeacherComment || "KEEP STRIVING."}</p></div>
                <div><span className="text-slate-400 block uppercase text-[9px] font-bold">Next term resumption</span> <p className="font-bold text-indigo-600">{remarks.nextTermStarts || "April 28, 2025"}</p></div>
            </div>
        </div>
    );
};

export const MinimalistReportCard006 = ({ data, term }: { data: any, term: string }) => {
    const { student, results } = data;
    const termNumber = parseInt(term);
    const currentTermResults = results.filter((r: any) => r.semester === termNumber || !r.semester);

    const remarks = data.remarks || {};
    const behaviors = data.behaviors || [];

    return (
        <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-6 text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <div className="text-center pb-6 border-b space-y-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{data.session ? 'THE INSTITUTION' : 'THE SCHOOL NAME'}</h1>
                <p className="text-slate-400 text-xs italic">{remarks.nextTermStarts ? 'Nurturing Leaders' : 'Motto Text'}</p>
            </div>

            {/* Metadata list */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                <div><span className="text-slate-400 block">Name:</span> <span className="font-bold uppercase text-slate-800">{student.name}</span></div>
                <div><span className="text-slate-400 block">Class:</span> <span className="font-bold uppercase text-slate-800">{student.currentLevel}</span></div>
                <div><span className="text-slate-400 block">Term:</span> <span className="font-bold uppercase text-slate-800">{termNumber === 1 ? 'First Term' : termNumber === 2 ? 'Second Term' : 'Third Term'}</span></div>
                <div><span className="text-slate-400 block">Opened:</span> <span className="font-bold text-slate-800">{remarks.daysOpen || 122}</span></div>
                <div><span className="text-slate-400 block">Present:</span> <span className="font-bold text-slate-800">{remarks.daysPresent || 122}</span></div>
                <div><span className="text-slate-400 block">Absent:</span> <span className="font-bold text-slate-800">{remarks.daysAbsent || 0}</span></div>
            </div>

            {/* Table */}
            <div className="overflow-hidden border rounded-xl shadow-sm bg-white">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white uppercase text-[9px] tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3 text-center">CA</th>
                            <th className="px-4 py-3 text-center">Exam</th>
                            <th className="px-4 py-3 text-center">Total</th>
                            <th className="px-4 py-3 text-center">Grade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentTermResults.map((r: any, i: number) => (
                            <tr key={i}>
                                <td className="px-4 py-2.5 font-bold uppercase text-slate-800">{r.title}</td>
                                <td className="px-4 py-2.5 text-center">{r.caScore || 0}</td>
                                <td className="px-4 py-2.5 text-center">{r.examScore || 0}</td>
                                <td className="px-4 py-2.5 text-center font-bold text-slate-900">{r.totalScore || 0}</td>
                                <td className="px-4 py-2.5 text-center font-black text-indigo-600">{r.grade || 'C'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Traits & Comments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4 text-xs">
                {/* Traits list */}
                <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b pb-1">TRAITS & REMARKS</h3>
                    {behaviors.slice(0, 5).map((b: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                            <span className="font-medium text-slate-500 uppercase">{b.name}</span>
                            <span className="font-bold text-slate-800">{b.score}</span>
                        </div>
                    ))}
                </div>

                {/* Comments */}
                <div className="space-y-4">
                    <div>
                        <span className="text-[9px] uppercase tracking-wider block text-slate-400">Class Teacher signature</span>
                        <p className="italic text-slate-700 font-medium bg-slate-50 p-3 rounded-lg border mt-1">Signed online by class teacher.</p>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase tracking-wider block text-slate-400">Principal's comments</span>
                        <p className="italic text-slate-700 font-medium bg-slate-50 p-3 rounded-lg border mt-1">{remarks.headTeacherComment || "KEEP IT UP."}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TertiarySemesterResultCard = ({ data, term }: { data: any, term: string }) => {
    const { student, results, summaries } = data;
    const termNumber = parseInt(term);
    const currentTermResults = results.filter((r: any) => r.semester === termNumber || !r.semester);

    // Support both direct summary object and summaries array
    const summary = data.summary || (summaries && summaries.find((s: any) => s.semester === term.toString())) || { gpa: 0, cgpa: 0, tcr: 0, tce: 0 };
    const tcr = summary.tcr || 0;
    const tce = summary.tce || 0;
    const gpa = summary.gpa || 0;
    const cgpa = summary.cgpa || 0;
    const twgp = currentTermResults.reduce((s: number, r: any) => s + ((r.gp || r.gradePoint || 0) * (r.units || r.creditUnits || 0)), 0);

    return (
        <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-6 text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {/* Header */}
            <div className="text-center border-b pb-6 space-y-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">OFFICIAL SEMESTER RESULT SLIP</h1>
                <p className="text-slate-400 text-xs font-bold mt-1">TERM/SEMESTER {term} • SESSION {data.session || "2024/2025"}</p>
            </div>

            {/* Profile */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] mb-0.5">STUDENT NAME</span>
                    <span className="font-extrabold text-slate-800 text-sm uppercase">{student.name}</span>
                </div>
                <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] mb-0.5">MATRIC / ADM NO</span>
                    <span className="font-bold text-slate-800 text-sm font-mono uppercase">{student.matricNumber || student.admissionNumber}</span>
                </div>
                <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] mb-0.5">DEPARTMENT</span>
                    <span className="font-bold text-slate-700 text-sm uppercase">{student.department || 'N/A'}</span>
                </div>
                <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] mb-0.5">PROGRAMME</span>
                    <span className="font-bold text-slate-700 text-sm uppercase">{student.programme || 'N/A'}</span>
                </div>
                <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] mb-0.5">LEVEL</span>
                    <span className="font-bold text-slate-700 text-sm">{student.currentLevel || student.level || 100} LEVEL</span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white uppercase text-[9px] tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Course Code</th>
                            <th className="px-4 py-3">Course Title</th>
                            <th className="px-4 py-3 text-center">Credit Units</th>
                            <th className="px-4 py-3 text-center">Score</th>
                            <th className="px-4 py-3 text-center">Grade</th>
                            <th className="px-4 py-3 text-center">Grade Point</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentTermResults.map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-900 font-mono uppercase">{r.code}</td>
                                <td className="px-4 py-3 text-slate-700 font-medium">{r.title}</td>
                                <td className="px-4 py-3 text-center font-bold text-slate-600">{r.units || r.creditUnits || 0}</td>
                                <td className="px-4 py-3 text-center font-bold text-slate-600">{r.totalScore || r.score || 0}</td>
                                <td className="px-4 py-3 text-center font-black text-indigo-600">{r.grade || 'N/A'}</td>
                                <td className="px-4 py-3 text-center font-mono font-bold text-slate-600">{(r.gp || r.gradePoint || 0).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Performance Summary Footer */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center text-xs font-bold text-slate-600">
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Total Registered (TCR)</span>
                    <span className="text-slate-950 font-black text-sm">{tcr}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Total Earned (TCE)</span>
                    <span className="text-slate-950 font-black text-sm">{tce}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Weighted Points (TWGP)</span>
                    <span className="text-slate-950 font-black text-sm">{twgp.toFixed(2)}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Semester GPA (SGPA)</span>
                    <span className="text-indigo-600 font-black text-sm">{gpa.toFixed(2)}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400">Cumulative GPA (CGPA)</span>
                    <span className="text-emerald-600 font-black text-sm">{cgpa.toFixed(2)}</span>
                </div>
            </div>

            {/* Approval Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100 text-center text-xs font-semibold text-slate-500">
                <div className="space-y-4">
                    <div className="h-12 flex items-center justify-center">
                        <span className="text-[10px] text-slate-300 italic">Signed Digitally</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2">
                        <p className="font-bold text-slate-800">HEAD OF DEPARTMENT (HOD)</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Official Stamp / Signature</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="h-12 flex items-center justify-center">
                        <span className="text-[10px] text-slate-300 italic">Signed Digitally</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2">
                        <p className="font-bold text-slate-800">DEAN OF FACULTY</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Official Stamp / Signature</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const K12_REPORT_TEMPLATES: Record<string, React.FC<{ data: any; term: string; templateCode?: string }>> = {
    '002': RowelSchools002ReportCard,
    '002a': RowelSchools002ReportCard,
    '002b': RowelSchools002ReportCard,
    '003': K12ReportCard003,
    '004': CaramotSchool004ReportCard,
    '005': AdaptiveReportCard005,
    '006': MinimalistReportCard006,
    '001a': RowelSchoolsReportCard,
    '001': RowelSchoolsReportCard,
    'rowel_schools': RowelSchoolsReportCard,
    'tertiary_semester': TertiarySemesterResultCard,
    'default': DefaultK12ReportCard
};

export const K12ReportCard = ({ data, term, templateCode = 'rowel_schools' }: { data: ResultData, term: string, templateCode?: string }) => {
    const Template = K12_REPORT_TEMPLATES[templateCode] || K12_REPORT_TEMPLATES['default'];
    return <Template data={data} term={term} templateCode={templateCode} />;
};
