"use client";

import { useEffect, useState, useTransition } from "react";
import { 
    GraduationCap, Search, FileDown, Printer, SlidersHorizontal, 
    BookOpen, Layers, Users, X, Award, Eye, ClipboardList, CheckCircle
} from "lucide-react";
import { getResultFilterMetadata, getGeneratedResultsForClass } from "@/actions/exams-records";
import AcademicRecordPrintout from "@/components/exams-records/AcademicRecordPrintout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ResultViewsPage() {
    const [metadata, setMetadata] = useState<{ sessions: any[]; groups: any[]; levels: number[]; departments?: any[] } | null>(null);
    const [selectedSession, setSelectedSession] = useState<string>("1");
    const [selectedTerm, setSelectedTerm] = useState<string>("1");
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [selectedDept, setSelectedDept] = useState<string>("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Modal state for viewing report card
    const [viewingStudentId, setViewingStudentId] = useState<number | null>(null);

    // Dynamic checks
    const showDepartmentFilter = parseInt(selectedLevel) >= 10;

    // Initial metadata load
    useEffect(() => {
        async function loadMetadata() {
            const res = await getResultFilterMetadata();
            if (res.success && res.data) {
                setMetadata(res.data);
                if (res.data.sessions.length > 0) {
                    setSelectedSession(res.data.sessions[0].id.toString());
                }
                if (res.data.levels.length > 0) {
                    setSelectedLevel(res.data.levels[0].toString());
                }
            }
        }
        loadMetadata();
    }, []);

    // Filter arms matching selected level
    const filteredGroups = metadata?.groups.filter(g => g.level.toString() === selectedLevel) || [];

    // Auto-select first arm when level changes
    useEffect(() => {
        if (filteredGroups.length > 0) {
            setSelectedGroup(filteredGroups[0].id.toString());
        } else {
            setSelectedGroup("");
        }
    }, [selectedLevel]);

    const handleSearch = () => {
        if (!selectedSession || !selectedLevel) return;
        setLoading(true);
        startTransition(async () => {
            const res = await getGeneratedResultsForClass({
                sessionId: parseInt(selectedSession),
                semester: parseInt(selectedTerm),
                level: parseInt(selectedLevel),
                groupId: selectedGroup ? parseInt(selectedGroup) : undefined,
                deptId: showDepartmentFilter && selectedDept ? parseInt(selectedDept) : undefined
            });
            if (res.success && res.data) {
                setResults(res.data);
            } else {
                setResults([]);
            }
            setLoading(false);
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                        <Award className="w-10 h-10 text-indigo-600 animate-pulse" />
                        Result Views
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium tracking-tight">
                        Class-by-class terminal results, transcript verification, and PDF printable report cards
                    </p>
                </div>
            </div>

            {/* Premium Filter Dashboard Panel */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Result Engine Filters</h3>
                </div>

                <div className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 gap-6",
                    showDepartmentFilter ? "lg:grid-cols-5" : "lg:grid-cols-4"
                )}>
                    {/* Academic Session */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            Academic Session
                        </label>
                        <select 
                            value={selectedSession} 
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            {metadata?.sessions.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Academic Term */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                            Academic Term
                        </label>
                        <select 
                            value={selectedTerm} 
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            <option value="1">First Term</option>
                            <option value="2">Second Term</option>
                            <option value="3">Third Term</option>
                        </select>
                    </div>

                    {/* Level / Class */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            Class / Level
                        </label>
                        <select 
                            value={selectedLevel} 
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            {metadata?.levels.map((l) => (
                                <option key={l} value={l}>Class Level {l}</option>
                            ))}
                        </select>
                    </div>

                    {/* Class Arm / Group */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Class Arm / Group
                        </label>
                        <select 
                            value={selectedGroup} 
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            <option value="">All Arms</option>
                            {filteredGroups.map((g) => (
                                <option key={g.id} value={g.id}>Arm {g.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Department / Stream (For Senior Secondary level >= 10) */}
                    {showDepartmentFilter && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                                Senior Stream / Dept
                            </label>
                            <select 
                                value={selectedDept} 
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                            >
                                <option value="">All Streams</option>
                                {metadata?.departments?.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button 
                        onClick={handleSearch}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-14 rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-2"
                        disabled={loading}
                    >
                        <Search className="w-5 h-5" />
                        Generate Result Overview
                    </Button>
                </div>
            </div>

            {/* Results Grid / Table */}
            {results.length > 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="p-6 bg-slate-900 border-b border-slate-800 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black tracking-tight leading-none mb-1">Generated Results Overview</h3>
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Calculated rankings and averages for class level {selectedLevel}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-8 py-5">Student Details</th>
                                    <th className="px-8 py-5 text-center">Class Arm</th>
                                    {showDepartmentFilter && <th className="px-8 py-5 text-center">Senior Stream / Dept</th>}
                                    <th className="px-8 py-5 text-center">Average Score</th>
                                    <th className="px-8 py-5 text-center">Approval Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {results.map((r, i) => (
                                    <tr key={r.studentId} className="group hover:bg-slate-50 transition-all">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-slate-900 tracking-tight">{r.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{r.matricNumber || "N/A"}</div>
                                        </td>
                                        <td className="px-8 py-5 text-center font-bold text-slate-600">
                                            {r.groupName || "N/A"}
                                        </td>
                                        {showDepartmentFilter && (
                                            <td className="px-8 py-5 text-center font-bold text-indigo-600">
                                                {r.departmentName || "General / Common"}
                                            </td>
                                        )}
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-lg font-black text-slate-900 tabular-nums">
                                                {r.gpa || "0.00"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                r.approvalStatus === "published" 
                                                    ? "bg-emerald-50 text-emerald-600" 
                                                    : "bg-amber-50 text-amber-600"
                                            )}>
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                {r.approvalStatus || "Pending"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setViewingStudentId(r.studentId)}
                                                    className="font-bold border-slate-200 text-slate-600 rounded-xl h-10 px-4 gap-1.5 flex items-center shadow-sm hover:bg-slate-50 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Card
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center gap-4">
                    <ClipboardList className="w-12 h-12 text-slate-300" />
                    <div>
                        <h4 className="text-lg font-black text-slate-700 tracking-tight leading-none mb-1">No Results Loaded</h4>
                        <p className="text-slate-400 text-xs font-medium">Select dynamic session and class parameters to capture generated results</p>
                    </div>
                </div>
            )}

            {/* Modal for viewing individual student Report Card */}
            {viewingStudentId && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-8 animate-in fade-in duration-300">
                    <div className="bg-slate-50 w-full max-w-5xl rounded-[3rem] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center print:hidden">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-6 h-6 text-indigo-600" />
                                <span className="font-black text-slate-800 uppercase tracking-widest text-xs">Official Result Slip Preview</span>
                            </div>
                            <button 
                                onClick={() => setViewingStudentId(null)}
                                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body with Printable Area */}
                        <div className="p-8 md:p-12 overflow-y-auto flex-1">
                            <AcademicRecordPrintout studentId={viewingStudentId} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
