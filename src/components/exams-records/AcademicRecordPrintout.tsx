"use client";

import { useEffect, useState } from "react";
import { getStudentAcademicRecord } from "@/actions/exams-records";
import { Loader2, Printer, GraduationCap, School, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { K12ReportCard } from "./ResultTemplates";

export default function AcademicRecordPrintout({ studentId }: { studentId: number }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [issuedDate, setIssuedDate] = useState<string>("");
    const [verificationCode, setVerificationCode] = useState<string>("");
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

    useEffect(() => {
        setIssuedDate(new Date().toLocaleDateString("en-US"));
        setVerificationCode(`ACAD-${studentId}-${Date.now().toString(36).toUpperCase()}`);
    }, [studentId]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await getStudentAcademicRecord(studentId);
            if (res.success) {
                setData(res.data);
            }
            setLoading(false);
        }
        load();
    }, [studentId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500 font-medium tracking-tight">Preparing academic record...</p>
            </div>
        );
    }

    if (!data) {
        return <div className="p-8 text-center text-red-500 font-bold">Record not found.</div>;
    }

    const { student, summaries, results } = data;
    const isK12 = student.academicTier === 'k12';

    // Group results by session and semester
    const groupedResults: Record<string, any[]> = {};
    results.forEach((r: any) => {
        const key = `${r.sessionName} - ${isK12 ? 'Term' : 'Semester'} ${r.semester}`;
        if (!groupedResults[key]) groupedResults[key] = [];
        groupedResults[key].push(r);
    });

    if (isK12 && selectedTerm) {
        return (
            <div className="max-w-[1600px] w-full mx-auto space-y-6">
                 <div className="flex justify-between items-center print:hidden">
                    <Button variant="ghost" onClick={() => setSelectedTerm(null)} className="gap-2 font-bold text-slate-500">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Summary
                    </Button>
                    <Button onClick={() => window.print()} className="bg-slate-900 gap-2 font-bold rounded-xl h-12 shadow-xl">
                        <Printer className="w-5 h-5" />
                        Print Report Card
                    </Button>
                </div>
                <K12ReportCard data={data} term={selectedTerm} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-sm rounded-2xl print:shadow-none print:p-0">
            {/* Print Control */}
            <div className="flex justify-end mb-8 print:hidden">
                <Button
                    onClick={() => window.print()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 h-12 px-6 shadow-lg shadow-indigo-200"
                >
                    <Printer className="w-5 h-5" />
                    Print Statement of Result
                </Button>
            </div>

            {/* Letterhead */}
            <div className="border-b-4 border-slate-900 pb-8 mb-8 text-center space-y-2">
                <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center">
                        <School className="w-12 h-12 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Academic Institution Name</h1>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm italic">Office of the Registrar (Exams & Records)</p>
                <h2 className="text-2xl font-black text-indigo-600 tracking-tight mt-4 uppercase">Statement of Academic Record</h2>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 p-8 bg-slate-50 rounded-2xl border border-slate-100 print:bg-transparent print:border-none print:px-0">
                <div className="space-y-4">
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                        <p className="text-xl font-extrabold text-slate-900 tracking-tight">{student.name}</p>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Matriculation Number</p>
                        <p className="text-lg font-black text-indigo-600 font-mono tracking-tighter">{student.matricNumber || 'N/A'}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Programme of Study</p>
                        <p className="text-lg font-bold text-slate-800">{student.programme}</p>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Department</p>
                        <p className="text-lg font-bold text-slate-800">{student.department}</p>
                    </div>
                </div>
            </div>

            {/* Academic History Loop */}
            <div className="space-y-12">
                {Object.entries(groupedResults).map(([sessionTitle, sessionResults]) => (
                    <div key={sessionTitle} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">{sessionTitle}</h3>
                            <div className="w-full h-px bg-slate-200" />
                            {isK12 && sessionResults[0]?.semester && (
                                <Button 
                                    size="sm" 
                                    onClick={() => setSelectedTerm(sessionResults[0].semester.toString())}
                                    className="print:hidden bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black rounded-lg border border-indigo-100 shadow-none px-4 h-9"
                                >
                                    View Full Report Card
                                </Button>
                            )}
                        </div>
                        <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">Course/Subject</th>
                                        {isK12 && <th className="px-6 py-4 text-center">CA</th>}
                                        {isK12 && <th className="px-6 py-4 text-center">Exam</th>}
                                        <th className="px-6 py-4 text-center">Total</th>
                                        <th className="px-6 py-4 text-center">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {sessionResults.map((r, i) => (
                                        <tr key={i} className="text-sm">
                                            <td className="px-6 py-4">
                                                <div className="font-black text-slate-900 tracking-tight">{r.title}</div>
                                                <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{r.code}</div>
                                            </td>
                                            {isK12 && <td className="px-6 py-4 text-center font-bold text-slate-600">{r.caScore}</td>}
                                            {isK12 && <td className="px-6 py-4 text-center font-bold text-slate-600">{r.examScore}</td>}
                                            <td className="px-6 py-4 text-center text-slate-900 font-black tracking-tight">{r.totalScore}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block w-8 h-8 leading-8 rounded-lg font-black text-xs ${r.grade === 'F' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                                    }`}>
                                                    {r.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Signatures */}
            <div className="mt-20 pt-10 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-12 text-center text-slate-400 font-bold text-xs uppercase tracking-[0.2em] print:mt-10">
                <div className="space-y-4">
                    <div className="w-48 h-px bg-slate-300 mx-auto" />
                    <p>Exams & Records Officer</p>
                </div>
                <div className="space-y-4">
                    <div className="w-48 h-px bg-slate-300 mx-auto" />
                    <p>Registrar (Academic)</p>
                </div>
            </div>

            <p className="mt-12 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest italic print:mt-8">
                Official statement of result. Issued on {issuedDate || "..."} - Verification Code: {verificationCode || "..."}
            </p>
        </div>
    );
}
