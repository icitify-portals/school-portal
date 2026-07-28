"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isGraduatedStatus } from "@/lib/utils";
import { transitionToAlumni } from "@/actions/registrar_alumni";
import { toast } from "sonner";
import { UserCheck, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export function AlumniTransitionTable({ students }: { students: any[] }) {
    const router = useRouter();
    const [processing, setProcessing] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const handleTransition = async (id: number) => {
        if (!confirm("Are you sure? This will lock the student's profile and mark them as graduated.")) return;

        setProcessing(id);
        const result = await transitionToAlumni(id);
        if (result.success) {
            toast.success("Student transitioned to Alumni");
            router.refresh();
        } else {
            toast.error(result.error || "Transition failed");
        }
        setProcessing(null);
    };

    const filteredStudents = students.filter(s => 
        (s.studentName?.toLowerCase().includes(search.toLowerCase()) || '') ||
        (s.studentMatricNo?.toLowerCase().includes(search.toLowerCase()) || '') ||
        (s.departmentName?.toLowerCase().includes(search.toLowerCase()) || '')
    );

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search by name, matric no, or department..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="text-sm font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    {filteredStudents.length} Students
                </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-medium">
                    <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Clearance Status</th>
                        <th className="px-4 py-3">Current Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {paginatedStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                                <div className="font-medium text-slate-900">{s.studentName}</div>
                                <div className="text-slate-500 text-xs">{s.studentMatricNo}</div>
                            </td>
                            <td className="px-4 py-3">{s.departmentName || "N/A"}</td>
                            <td className="px-4 py-3">
                                <Badge variant={s.clearanceStatus === 'cleared' ? 'default' : 'secondary'}>
                                    {s.clearanceStatus || "None"}
                                </Badge>
                            </td>
                            <td className="px-4 py-3">
                                <Badge variant={isGraduatedStatus(s.status) ? 'outline' : 'default'} className={isGraduatedStatus(s.status) ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""}>
                                    {s.status}
                                </Badge>
                                {s.isProfileLocked && <Lock className="inline w-3 h-3 ml-2 text-slate-400" />}
                            </td>
                            <td className="px-4 py-3 text-right">
                                {!isGraduatedStatus(s.status) && s.clearanceStatus === 'cleared' && (
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleTransition(s.id)}
                                        disabled={processing === s.id}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Transition to Alumni
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-500">
                                No cleared students found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            </div>

            {totalPages > 1 && (
                <div className="p-4 flex items-center justify-between text-sm bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-slate-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1 px-2 font-medium text-slate-600">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
