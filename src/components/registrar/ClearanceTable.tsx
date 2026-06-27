"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateClearanceStatus } from "@/actions/registrar_clearance";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function ClearanceTable({ clearances }: { clearances: any[] }) {
    const router = useRouter();
    const [processing, setProcessing] = useState<number | null>(null);

    const handleUpdate = async (id: number, status: string) => {
        setProcessing(id);
        const result = await updateClearanceStatus(id, "registrar", status);
        if (result.success) {
            toast.success("Status updated");
            router.refresh();
        } else {
            toast.error(result.error || "Update failed");
        }
        setProcessing(null);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-medium">
                    <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3 text-center">Library</th>
                        <th className="px-4 py-3 text-center">Bursary</th>
                        <th className="px-4 py-3 text-center">Department</th>
                        <th className="px-4 py-3 text-center">Registrar</th>
                        <th className="px-4 py-3">Overall Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {clearances.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                                <div className="font-medium text-slate-900">{c.studentName}</div>
                                <div className="text-slate-500 text-xs">{c.studentMatricNo}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                                <StatusBadge status={c.libraryStatus} />
                            </td>
                            <td className="px-4 py-3 text-center">
                                <StatusBadge status={c.bursaryStatus} />
                            </td>
                            <td className="px-4 py-3 text-center">
                                <StatusBadge status={c.departmentStatus} />
                            </td>
                            <td className="px-4 py-3 text-center">
                                <StatusBadge status={c.registrarStatus} />
                            </td>
                            <td className="px-4 py-3">
                                <Badge variant={c.status === 'cleared' ? 'default' : c.status === 'rejected' ? 'destructive' : 'secondary'}>
                                    {c.status}
                                </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                                {c.registrarStatus === 'pending' && (
                                    <div className="flex justify-end gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                            onClick={() => handleUpdate(c.id, 'cleared')}
                                            disabled={processing === c.id}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => handleUpdate(c.id, 'rejected')}
                                            disabled={processing === c.id}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {clearances.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-slate-500">
                                No clearance requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'cleared') return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Cleared</Badge>;
    if (status === 'rejected') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
    return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Pending</Badge>;
}
