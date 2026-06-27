"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { transitionToAlumni } from "@/actions/registrar_alumni";
import { toast } from "sonner";
import { UserCheck, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export function AlumniTransitionTable({ students }: { students: any[] }) {
    const router = useRouter();
    const [processing, setProcessing] = useState<number | null>(null);

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

    return (
        <div className="overflow-x-auto">
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
                <tbody className="divide-y divide-slate-200">
                    {students.map((s) => (
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
                                <Badge variant={s.status === 'graduated' ? 'outline' : 'default'} className={s.status === 'graduated' ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""}>
                                    {s.status}
                                </Badge>
                                {s.isProfileLocked && <Lock className="inline w-3 h-3 ml-2 text-slate-400" />}
                            </td>
                            <td className="px-4 py-3 text-right">
                                {s.status !== 'graduated' && s.clearanceStatus === 'cleared' && (
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
                    {students.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-500">
                                No cleared students awaiting transition.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
