"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Filter, Loader2, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BroadsheetViewer({ 
    groups, 
    sessions, 
    initialData,
    currentFilters 
}: { 
    groups: any[]; 
    sessions: any[]; 
    initialData: any;
    currentFilters: { groupId?: number, sessionId?: number, semester?: number };
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [groupId, setGroupId] = useState<string>(currentFilters.groupId?.toString() || "");
    const [sessionId, setSessionId] = useState<string>(currentFilters.sessionId?.toString() || "");
    const [semester, setSemester] = useState<string>(currentFilters.semester?.toString() || "");

    const handleLoad = () => {
        if (!groupId || !sessionId || !semester) return;
        setLoading(true);
        router.push(`/admin/exams-records/broadsheet?group=${groupId}&session=${sessionId}&semester=${semester}`);
    };

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <Card className="-200 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
                    <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Academic Session</label>
                        <Select value={sessionId} onValueChange={setSessionId}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Select Session" /></SelectTrigger>
                            <SelectContent>
                                {sessions.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Class / Cohort</label>
                        <Select value={groupId} onValueChange={setGroupId}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Select Class" /></SelectTrigger>
                            <SelectContent>
                                {groups.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Semester</label>
                        <Select value={semester} onValueChange={setSemester}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Select Semester" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">First Semester</SelectItem>
                                <SelectItem value="2">Second Semester</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button 
                        onClick={handleLoad} 
                        disabled={!groupId || !sessionId || !semester || loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                        Load Broadsheet
                    </Button>
                </CardContent>
            </Card>

            {/* Content Area */}
            {!initialData && !loading && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Database className="w-12 h-12 mb-4 text-slate-300" />
                    <p className="font-bold uppercase tracking-widest text-xs">Select filters to load broadsheet</p>
                </div>
            )}

            {initialData && (
                <Card className="-200 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                        <div>
                            <h2 className="font-black tracking-widest uppercase text-sm">Official Master Broadsheet</h2>
                            <p className="text-slate-400 text-xs mt-1">Class ID: {initialData.classId} • Term: {initialData.termId}</p>
                        </div>
                        <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                    </div>
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-sm text-left border-collapse min-w-max">
                            <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 border-r border-slate-200 sticky left-0 bg-slate-100 z-10 w-12 text-center">#</th>
                                    <th className="px-4 py-3 border-r border-slate-200 sticky left-12 bg-slate-100 z-10 w-64">Matric / Name</th>
                                    {initialData.courses.map((course: any) => (
                                        <th key={course.courseId} className="px-4 py-3 border-r border-slate-200 text-center whitespace-nowrap">
                                            {course.courseCode} <br/>
                                            <span className="text-[10px] text-slate-500 font-normal">({course.creditUnits} Units)</span>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 border-r border-slate-200 text-center">TGP</th>
                                    <th className="px-4 py-3 border-r border-slate-200 text-center">TCU</th>
                                    <th className="px-4 py-3 border-r border-slate-200 text-center">GPA</th>
                                    <th className="px-4 py-3 text-center">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {initialData.rows.map((row: any, index: number) => (
                                    <tr key={row.studentId} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 text-center text-slate-500 font-medium">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-200 sticky left-12 bg-white group-hover:bg-slate-50">
                                            <div className="font-bold text-slate-900">{row.studentMatric}</div>
                                            <div className="text-xs text-slate-500">{row.studentName}</div>
                                        </td>
                                        {initialData.courses.map((course: any) => {
                                            const scoreObj = row.scores[course.courseId];
                                            if (!scoreObj) return <td key={course.courseId} className="px-4 py-3 border-r border-slate-200 text-center text-slate-300">-</td>;
                                            
                                            return (
                                                <td key={course.courseId} className="px-4 py-3 border-r border-slate-200 text-center">
                                                    <div className="font-medium text-slate-900">{scoreObj.totalScore}</div>
                                                    <div className={`text-xs font-bold ${scoreObj.grade === 'F' ? 'text-red-500' : 'text-slate-500'}`}>
                                                        {scoreObj.grade}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 border-r border-slate-200 text-center font-mono">{row.totalGradePoints}</td>
                                        <td className="px-4 py-3 border-r border-slate-200 text-center font-mono">{row.totalCreditUnits}</td>
                                        <td className="px-4 py-3 border-r border-slate-200 text-center font-bold font-mono text-indigo-700 bg-indigo-50/50">
                                            {row.gpa.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                row.academicStanding === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 
                                                row.academicStanding === 'PROBATION' ? 'bg-amber-100 text-amber-700' : 
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {row.academicStanding}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {initialData.rows.length === 0 && (
                            <div className="p-8 text-center text-slate-500">
                                No results compiled for this selection yet.
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
