"use client";

import { useState, useEffect } from "react";
import { getMatriculatedStudents } from "@/actions/matriculation";
import { getProgrammes } from "@/actions/programmes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Search, School } from "lucide-react";
import { formatLevel } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function MatriculationRegisterPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [programmes, setProgrammes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [programmeId, setProgrammeId] = useState<number | "">("");
    const [level, setLevel] = useState<number | "">("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [progs, data] = await Promise.all([
                getProgrammes(),
                getMatriculatedStudents()
            ]);
            setProgrammes(progs);
            setStudents(data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleFilter = async () => {
        setLoading(true);
        try {
            const data = await getMatriculatedStudents({
                programmeId: programmeId ? Number(programmeId) : undefined,
                level: level ? Number(level) : undefined
            });
            setStudents(data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredStudents = students.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (s.firstName?.toLowerCase() || "").includes(q) ||
            (s.lastName?.toLowerCase() || "").includes(q) ||
            (s.otherNames?.toLowerCase() || "").includes(q) ||
            (s.matriculationNumber?.toLowerCase() || "").includes(q)
        );
    });

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none">
            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Matriculation Register</h1>
                    <p className="text-slate-500 font-medium mt-1">View and print the official register for student signatures.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest text-xs rounded-xl h-10 px-6">
                        <Printer className="w-4 h-4 mr-2" />
                        Print Register
                    </Button>
                </div>
            </div>

            {/* Filters - Hidden on Print */}
            <Card className="p-4 border-slate-200 shadow-sm rounded-2xl print:hidden">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Programme</label>
                        <select 
                            className="flex h-10 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={programmeId}
                            onChange={(e) => setProgrammeId(e.target.value as any)}
                        >
                            <option value="">All Programmes</option>
                            {programmes.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Level</label>
                        <select 
                            className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={level}
                            onChange={(e) => setLevel(e.target.value as any)}
                        >
                            <option value="">All Levels</option>
                            <option value="100">ND 1</option>
                            <option value="200">ND 2</option>
                            <option value="300">HND 1</option>
                            <option value="400">HND 2</option>
                        </select>
                    </div>
                    <div className="space-y-1 flex-1 min-w-[200px]">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                placeholder="Search by name or matric number..." 
                                className="pl-9 h-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button onClick={handleFilter} disabled={loading} variant="outline" className="h-10 px-6 font-bold uppercase tracking-widest text-xs">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Filter"}
                    </Button>
                </div>
            </Card>

            {/* Print Header (Only visible on print) */}
            <div className="hidden print:block text-center mb-8 pb-4 border-b-2 border-slate-800">
                <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex flex-col items-center justify-center border border-slate-300">
                        <School className="w-8 h-8 text-slate-700" />
                    </div>
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tight">Federal School of Statistics, Ibadan</h1>
                <h2 className="text-lg font-bold uppercase tracking-widest mt-1">Official Matriculation Register</h2>
                <div className="mt-3 flex justify-center gap-6 text-sm font-bold text-slate-600 uppercase">
                    <span>Programme: {programmeId ? programmes.find(p => p.id === Number(programmeId))?.name : "ALL"}</span>
                    <span>Level: {level ? formatLevel(Number(level)) : "ALL"}</span>
                </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none print:border-none print:rounded-none">
                <table className="w-full text-left text-sm print:text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-black text-[10px] border-b border-slate-200 print:bg-transparent print:border-black">
                        <tr>
                            <th className="px-6 py-4 print:px-2 print:py-2">S/N</th>
                            <th className="px-6 py-4 print:px-2 print:py-2">Matriculation Number</th>
                            <th className="px-6 py-4 print:px-2 print:py-2">Student Name</th>
                            <th className="px-6 py-4 print:px-2 print:py-2">Programme</th>
                            <th className="px-6 py-4 print:px-2 print:py-2">Level</th>
                            <th className="px-6 py-4 print:px-2 print:py-2">Signature</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                        {loading && filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                                </td>
                            </tr>
                        ) : filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">
                                    No students found matching criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map((s, index) => (
                                <tr key={s.id} className="hover:bg-slate-50 print:break-inside-avoid">
                                    <td className="px-6 py-4 print:px-2 print:py-3 font-medium text-slate-500">{index + 1}</td>
                                    <td className="px-6 py-4 print:px-2 print:py-3 font-bold text-indigo-700 print:text-black font-mono tracking-tight">{s.matriculationNumber}</td>
                                    <td className="px-6 py-4 print:px-2 print:py-3 font-black text-slate-800 uppercase">
                                        {`${s.lastName || ""} ${s.firstName || ""} ${s.otherNames || ""}`.trim()}
                                    </td>
                                    <td className="px-6 py-4 print:px-2 print:py-3 font-semibold text-slate-600 uppercase text-xs">
                                        {s.programmeName || "N/A"} 
                                        {s.studyMode === 'part-time' || s.studyMode === 'dpp' ? ' (DPP)' : ''}
                                    </td>
                                    <td className="px-6 py-4 print:px-2 print:py-3 font-bold text-slate-500">
                                        {formatLevel(s.currentLevel)}
                                    </td>
                                    <td className="px-6 py-4 print:px-2 print:py-3">
                                        <div className="w-32 border-b border-dashed border-slate-300 print:border-black h-6"></div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Print Footer */}
            <div className="hidden print:flex justify-between mt-12 pt-8 text-sm font-bold uppercase tracking-widest text-slate-800">
                <div className="text-center">
                    <div className="w-48 border-b border-black mb-2 h-8"></div>
                    Registry Sign/Date
                </div>
                <div className="text-center">
                    <div className="w-48 border-b border-black mb-2 h-8"></div>
                    Bursary Sign/Date
                </div>
            </div>
        </div>
    );
}
