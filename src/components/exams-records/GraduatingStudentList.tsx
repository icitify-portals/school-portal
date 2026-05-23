"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Loader2, FileText, Printer, GraduationCap, ArrowRight } from "lucide-react";
import { getGraduatingStudents } from "@/actions/exams-records";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function GraduatingStudentList() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        const res = await getGraduatingStudents();
        if (res.success) {
            setStudents(res.data || []);
        }
        setLoading(false);
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.matricNumber?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        placeholder="Search by name or matric number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        title="Filter by status"
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Students</option>
                        <option value="active">Final Year (Active)</option>
                        <option value="graduated">Graduated</option>
                    </select>
                    <Button onClick={fetchStudents} variant="outline" size="icon" className="rounded-xl">
                        <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Student Info</th>
                                <th className="px-6 py-4">Academic Status</th>
                                <th className="px-6 py-4">Department & Programme</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                                        <p className="mt-2 text-slate-500 text-sm">Loading records...</p>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No graduating students found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">{s.name}</span>
                                                <span className="text-xs text-slate-500 font-mono">{s.matricNumber || 'NO MATRIC'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={s.status === 'graduated' ? 'success' : 'default'} className="rounded-md">
                                                        {s.status === 'graduated' ? 'Graduated' : 'Final Year'}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400">Level {s.currentLevel}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-600">{s.programme}</span>
                                                <span className="text-xs text-slate-400 italic">{s.department}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/exams-records/record/${s.id}`)}
                                                    className="rounded-lg h-8 text-xs font-bold gap-1 border-slate-200"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    View Record
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => window.open(`/admin/exams-records/print/${s.id}`, '_blank')}
                                                    className="rounded-lg h-8 text-xs font-bold gap-1 bg-indigo-600 hover:bg-indigo-700"
                                                >
                                                    <Printer className="w-3 h-3" />
                                                    Statement
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
