"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMatriculatedApplicants } from "@/actions/admission_v2";
import { Loader2, FileText, Printer, Hash, ShieldCheck } from "lucide-react";

export default function MatriculatedLettersBoard() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMatriculatedApplicants(60)
            .then((res) => {
                if (res.success) setData(res.data || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Card className="p-10 flex justify-center items-center border border-white/40 shadow-2xl bg-white/60 backdrop-blur-3xl rounded-[3rem]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </Card>
        );
    }

    if (data.length === 0) return null;

    return (
        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
            <div className="px-8 py-6 border-b border-white/40 bg-white/40 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-700">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-wider text-slate-800">Issued Admission Letters</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matriculated candidates — view or print official admission letters</p>
                    </div>
                </div>
                <span className="md:ml-auto px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">
                    <ShieldCheck className="w-3.5 h-3.5" /> {data.length} Matriculated
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Applicant</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Form No.</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Matric Number</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Programme</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 bg-white/20">
                        {data.map((row) => (
                            <tr key={row.applicationId} className="hover:bg-white/60 transition-colors">
                                <td className="px-8 py-5">
                                    <p className="text-sm font-black text-slate-800 uppercase">{row.applicantName}</p>
                                    {row.programmeType && (
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{row.programmeType} Programme</p>
                                    )}
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-xs font-bold text-slate-500 font-mono">{row.formNumber || row.applicationNumber || '—'}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-mono text-xs font-black">
                                        <Hash className="w-3.5 h-3.5" /> {row.matricNumber}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-xs font-bold text-slate-600 uppercase">{row.programmeName || '—'}</p>
                                    {row.departmentName && (
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {row.departmentName} ({row.departmentCode})
                                        </p>
                                    )}
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <Button
                                        onClick={() => window.open(`/admin/admission/v2/${row.applicationId}/letter`, '_blank')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-2xl inline-flex gap-2 items-center"
                                    >
                                        <Printer className="w-4 h-4" /> View / Print Letter
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}