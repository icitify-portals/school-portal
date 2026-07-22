"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Loader2, FileText, Printer, FileSearch, User } from "lucide-react";
import { searchAllStudents } from "@/actions/exams-records";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatLevel } from "@/lib/utils";

export default function GeneralStudentSearch() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!search.trim()) return;

        setLoading(true);
        const res = await searchAllStudents({ search });
        if (res.success) {
            setStudents(res.data || []);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        className="w-full pl-12 pr-4 h-14 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-lg font-medium"
                        placeholder="Search any student by name or matric number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button
                    type="submit"
                    disabled={loading || !search.trim()}
                    className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest text-xs gap-2 shadow-lg shadow-indigo-100"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
                    Lookup Student
                </Button>
            </form>

            {students.length > 0 && (
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-6 py-4">Student Identity</th>
                                    <th className="px-6 py-4">Current Record</th>
                                    <th className="px-6 py-4">Academic Path</th>
                                    <th className="px-6 py-4 text-right">Verification Tools</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.name}</span>
                                                    <span className="text-xs text-indigo-600 font-mono font-bold">{s.matricNumber || 'NO MATRIC'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={s.status === 'graduated' ? 'success' : 'outline'} className="rounded-md uppercase text-[9px] font-black">
                                                        {s.status}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400 font-bold">{formatLevel(s.currentLevel).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{s.programme || 'Unassigned'}</span>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{s.department}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/exams-records/record/${s.id}`)}
                                                    className="rounded-xl h-9 text-[10px] font-black uppercase tracking-widest gap-2 bg-white border-slate-200 hover:bg-slate-50"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    Review Results
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/exams-records/transcript/${s.id}`)}
                                                    className="rounded-xl h-9 text-[10px] font-black uppercase tracking-widest gap-2 bg-slate-900 hover:bg-black"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                    Transcript
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {!loading && search.trim() && students.length === 0 && (
                <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileSearch className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found for "{search}"</p>
                </div>
            )}
        </div>
    );
}
