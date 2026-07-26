"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users, Search, ArrowLeft, Loader2, ChevronLeft, ChevronRight,
    Download, Image as ImageIcon, FileText, User, Eye
} from "lucide-react";
import { getIdCardStudents } from "@/actions/id-cards";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

export default function IdCardsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<number | null>(null);

    // Preview modal
    const [previewStudent, setPreviewStudent] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getIdCardStudents({
                search,
                programmeType: typeFilter || undefined,
                page,
                pageSize: 50,
            });
            setStudents(res.students);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch {
            toast.error("Failed to load students");
        }
        setLoading(false);
    }, [search, typeFilter, page]);

    useEffect(() => {
        fetchData();
    }, [page, typeFilter]);

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };

    const downloadFile = async (url: string, filename: string) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch {
            toast.error("Download failed");
        }
    };

    const downloadAllForStudent = async (student: any) => {
        setDownloading(student.id);
        try {
            if (student.photo) {
                await downloadFile(student.photo, `photo_${student.matricNumber || student.id}.jpg`);
                await new Promise(r => setTimeout(r, 500));
            }
            if (student.signature) {
                await downloadFile(student.signature, `signature_${student.matricNumber || student.id}.jpg`);
                await new Promise(r => setTimeout(r, 500));
            }
            // Download form data as JSON
            const formJson = JSON.stringify(student.formData, null, 2);
            const blob = new Blob([formJson], { type: "application/json" });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `form_${student.matricNumber || student.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            toast.success("All files downloaded");
        } catch {
            toast.error("Download failed");
        }
        setDownloading(null);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/registrar">
                        <Button variant="ghost" className="rounded-xl text-slate-500 font-bold">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">ID Card Assets</h1>
                        <p className="text-slate-500 mt-1">Download student photographs, signatures, and application forms for ID card production.</p>
                    </div>
                </div>

                <Card className="border border-slate-200 rounded-2xl shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        placeholder="Search by name, matric no..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                            >
                                <option value="">All Types</option>
                                <option value="ND">ND</option>
                                <option value="HND">HND</option>
                            </select>
                            <Button
                                onClick={handleSearch}
                                className="rounded-xl bg-indigo-600 text-white font-bold text-sm px-5"
                            >
                                <Search className="w-4 h-4 mr-1" /> Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">#</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Matric No</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Dept</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Photo</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Signature</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((s, i) => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                                {(page - 1) * 50 + i + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-slate-800">{s.lastName} {s.firstName}</div>
                                                <div className="text-[10px] text-slate-400">{s.programmeType} · {s.programmeName}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.matricNumber ? (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black font-mono">
                                                        {s.matricNumber}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600">{s.deptName || "—"}</td>
                                            <td className="px-4 py-3">
                                                {s.photo ? (
                                                    <img
                                                        src={s.photo}
                                                        alt="Photo"
                                                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 cursor-pointer hover:scale-150 transition-transform"
                                                        onClick={() => setPreviewStudent(s)}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                                        <User className="w-5 h-5 text-slate-300" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.signature ? (
                                                    <img
                                                        src={s.signature}
                                                        alt="Signature"
                                                        className="w-14 h-8 object-contain border border-slate-200 rounded cursor-pointer hover:scale-150 transition-transform bg-white"
                                                        onClick={() => setPreviewStudent(s)}
                                                    />
                                                ) : (
                                                    <div className="w-14 h-8 bg-slate-100 rounded flex items-center justify-center">
                                                        <span className="text-[8px] text-slate-300">No sig</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <Button
                                                        onClick={() => setPreviewStudent(s)}
                                                        variant="ghost"
                                                        className="h-8 px-2 text-[10px] font-bold text-slate-500"
                                                    >
                                                        <Eye className="w-3 h-3 mr-1" /> View
                                                    </Button>
                                                    {s.photo && (
                                                        <Button
                                                            onClick={() => downloadFile(s.photo, `photo_${s.matricNumber || s.id}.jpg`)}
                                                            variant="ghost"
                                                            className="h-8 px-2 text-[10px] font-bold text-indigo-600"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                    {s.signature && (
                                                        <Button
                                                            onClick={() => downloadFile(s.signature, `signature_${s.matricNumber || s.id}.jpg`)}
                                                            variant="ghost"
                                                            className="h-8 px-2 text-[10px] font-bold text-emerald-600"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                            <span className="text-xs text-slate-500">
                                Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    variant="outline"
                                    className="h-8 w-8 p-0 rounded-lg"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="px-3 py-1 text-xs font-bold text-slate-600">{page}/{totalPages}</span>
                                <Button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    variant="outline"
                                    className="h-8 w-8 p-0 rounded-lg"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Preview Modal */}
                {previewStudent && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewStudent(null)}>
                        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-lg text-slate-900">
                                        {previewStudent.lastName} {previewStudent.firstName}
                                    </h3>
                                    <button onClick={() => setPreviewStudent(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {previewStudent.matricNumber} · {previewStudent.deptName}
                                </p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Photograph</label>
                                        {previewStudent.photo ? (
                                            <div className="space-y-2">
                                                <img
                                                    src={previewStudent.photo}
                                                    alt="Photo"
                                                    className="w-40 h-40 object-cover rounded-2xl border border-slate-200 shadow-sm"
                                                />
                                                <Button
                                                    onClick={() => downloadFile(previewStudent.photo, `photo_${previewStudent.matricNumber || previewStudent.id}.jpg`)}
                                                    variant="outline"
                                                    className="rounded-xl border-slate-200 text-xs font-bold"
                                                >
                                                    <Download className="w-3 h-3 mr-1" /> Download Photo
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="w-40 h-40 bg-slate-100 rounded-2xl flex items-center justify-center">
                                                <User className="w-12 h-12 text-slate-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Signature</label>
                                        {previewStudent.signature ? (
                                            <div className="space-y-2">
                                                <img
                                                    src={previewStudent.signature}
                                                    alt="Signature"
                                                    className="w-48 h-20 object-contain rounded-xl border border-slate-200 bg-white p-2"
                                                />
                                                <Button
                                                    onClick={() => downloadFile(previewStudent.signature, `signature_${previewStudent.matricNumber || previewStudent.id}.jpg`)}
                                                    variant="outline"
                                                    className="rounded-xl border-slate-200 text-xs font-bold"
                                                >
                                                    <Download className="w-3 h-3 mr-1" /> Download Signature
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="w-48 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
                                                <span className="text-xs text-slate-400">No signature</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Application Form Data</label>
                                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-60 overflow-y-auto">
                                        <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap">
                                            {JSON.stringify(previewStudent.formData, null, 2)}
                                        </pre>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            const json = JSON.stringify(previewStudent.formData, null, 2);
                                            const blob = new Blob([json], { type: "application/json" });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = `form_${previewStudent.matricNumber || previewStudent.id}.json`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                        variant="outline"
                                        className="rounded-xl border-slate-200 text-xs font-bold mt-2"
                                    >
                                        <Download className="w-3 h-3 mr-1" /> Download Form Data
                                    </Button>
                                </div>

                                <Button
                                    onClick={() => downloadAllForStudent(previewStudent)}
                                    disabled={downloading === previewStudent.id}
                                    className="w-full rounded-xl bg-indigo-600 text-white font-black text-sm uppercase tracking-wider py-4"
                                >
                                    {downloading === previewStudent.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Download className="w-4 h-4 mr-2" />
                                    )}
                                    Download All (Photo + Signature + Form)
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
