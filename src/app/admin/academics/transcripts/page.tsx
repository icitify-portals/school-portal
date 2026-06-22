"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Loader2, FileText, ChevronLeft, Filter, GraduationCap, Building2, Building } from "lucide-react";
import { getTranscriptSearch, getTranscriptAction } from "@/actions/transcripts";
import { getFaculties } from "@/actions/faculties";
import { getDepartments } from "@/actions/departments";
import { TranscriptVisual } from "@/components/academics/TranscriptVisual";
import { TranscriptDownloader } from "@/components/academics/TranscriptDownloader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ResultEditor } from "@/components/academics/ResultEditor";
import { toast } from "sonner";

export default function AdminTranscriptExplorer() {
    const [students, setStudents] = useState<any[]>([]);
    const [facultiesList, setFacultiesList] = useState<any[]>([]);
    const [departmentsList, setDepartmentsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
    const [selectedDept, setSelectedDept] = useState<string>("all");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [transcriptData, setTranscriptData] = useState<any>(null);
    const [fetchingTranscript, setFetchingTranscript] = useState(false);
    const [editingResult, setEditingResult] = useState<any>(null);

    useEffect(() => {
        loadFilters();
        handleSearch();
    }, []);

    const loadFilters = async () => {
        const facs = await getFaculties();
        const depts = await getDepartments();
        setFacultiesList(facs);
        setDepartmentsList(depts);
    };

    const handleSearch = async () => {
        setLoading(true);
        const res = await getTranscriptSearch({
            facultyId: selectedFaculty === "all" ? undefined : parseInt(selectedFaculty),
            deptId: selectedDept === "all" ? undefined : parseInt(selectedDept),
            search: search || undefined
        });
        if (res.success) setStudents((res as any).data || []);
        setLoading(false);
    };

    const viewTranscript = async (student: any) => {
        setSelectedStudent(student);
        setFetchingTranscript(true);
        const res = await getTranscriptAction(student.student.id);
        if (res.success) setTranscriptData(res.data);
        else toast.error(res.error || "Failed to fetch transcript");
        setFetchingTranscript(false);
    };

    const handleEditSuccess = () => {
        if (selectedStudent) viewTranscript(selectedStudent);
    };

    if (selectedStudent && transcriptData) {
        return (
            <div className="min-h-screen bg-slate-50 p-8">
                <div className="max-w-[210mm] mx-auto space-y-6">
                    <Button
                        variant="ghost"
                        onClick={() => { setSelectedStudent(null); setTranscriptData(null); }}
                        className="mb-4 hover:bg-white no-print"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Explorer
                    </Button>

                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 no-print">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 rounded-xl">
                                <FileText className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900">Admin Transcript Services</h1>
                                <p className="text-xs text-slate-500 font-medium">Viewing record for {selectedStudent.user.name}</p>
                            </div>
                        </div>
                        <TranscriptDownloader fileName={`Transcript_${transcriptData.student.matricNumber.replace(/\//g, '_')}`} />
                    </div>
                    <TranscriptVisual
                        data={transcriptData}
                        onEditResult={(res) => setEditingResult(res)}
                    />

                    <ResultEditor
                        isOpen={!!editingResult}
                        onClose={() => setEditingResult(null)}
                        onSuccess={handleEditSuccess}
                        result={editingResult}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <GraduationCap className="w-10 h-10 text-indigo-600" />
                        Transcript Explorer
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Collate and verify academic records across all institutional units</p>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Faculty Filter
                            </label>
                            <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white font-bold rounded-xl h-12">
                                    <SelectValue placeholder="All Faculties" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Faculties</SelectItem>
                                    {facultiesList.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <Building className="w-3 h-3" /> Department Filter
                            </label>
                            <Select value={selectedDept} onValueChange={setSelectedDept}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white font-bold rounded-xl h-12">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departmentsList.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Registry</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    className="w-full pl-12 pr-4 h-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                                    placeholder="Name or Matriculation Number..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button
                                    onClick={handleSearch}
                                    className="absolute right-1.5 top-1.5 h-9 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[10px] uppercase font-black tracking-widest"
                                >
                                    Query
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-8 py-4">Student Identity</th>
                                    <th className="px-8 py-4">Academic Placement</th>
                                    <th className="px-8 py-4">Placement Level</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600 opacity-20" />
                                            <p className="text-slate-400 font-bold mt-4 uppercase text-[10px] tracking-widest">Accessing Registry Records...</p>
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No matching student records found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((s) => (
                                        <tr key={s.student.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600 text-sm group-hover:scale-110 transition-transform">
                                                        {s.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.user.name}</p>
                                                        <code className="text-[10px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded leading-none">
                                                            {s.student.matricNumber || "PENDING"}
                                                        </code>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{s.prog?.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-400 font-medium">{s.fac?.name}</span>
                                                        <Separator orientation="vertical" className="h-2 bg-slate-200" />
                                                        <span className="text-[10px] text-slate-400 font-medium">{s.dept?.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    Level {s.student.currentLevel}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <Button
                                                    onClick={() => viewTranscript(s)}
                                                    disabled={fetchingTranscript}
                                                    className="bg-slate-900 border-none hover:bg-indigo-600 rounded-xl px-6 h-10 font-black uppercase text-[10px] tracking-widest transition-all"
                                                >
                                                    {fetchingTranscript && selectedStudent?.id === s.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    ) : (
                                                        <FileText className="w-4 h-4 mr-2" />
                                                    )}
                                                    Query Result
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
