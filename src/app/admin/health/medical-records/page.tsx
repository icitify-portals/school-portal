"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Stethoscope, Loader2, Search, FileText, CheckCircle2,
    XCircle, Download, Eye, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { getMedicalRecords } from "@/actions/medical-records";

const DEPARTMENTS = [
    { id: 54, name: "Computer Science" },
    { id: 55, name: "Artificial Intelligence" },
    { id: 56, name: "Networking & Cloud Computing" },
    { id: 57, name: "Statistics" },
    { id: 58, name: "Business Administration" },
    { id: 59, name: "Accountancy" },
];

export default function MedicalRecordsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDept, setFilterDept] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    const loadRecords = useCallback(async () => {
        setLoading(true);
        const res = await getMedicalRecords({
            departmentId: filterDept !== "all" ? parseInt(filterDept) : undefined,
            status: filterStatus !== "all" ? filterStatus : undefined,
            search: search || undefined,
            page,
            limit: pageSize,
        });
        if (res.success) {
            setRecords(res.data);
            setTotal(res.total);
        }
        setLoading(false);
    }, [filterDept, filterStatus, search, page]);

    useEffect(() => { loadRecords(); }, [loadRecords]);

    const totalPages = Math.ceil(total / pageSize);
    const submittedCount = records.filter(r => r.medicalFormSubmittedAt).length;
    const clearedCount = records.filter(r => r.healthStatus === 'cleared').length;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Medical Records</h1>
                            <p className="text-sm text-slate-500">Student health forms and clearance status</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-900">{total}</p>
                        <p className="text-xs text-slate-500">Total Students</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{submittedCount}</p>
                        <p className="text-xs text-slate-500">Form Submitted</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{clearedCount}</p>
                        <p className="text-xs text-slate-500">Cleared</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">{total - submittedCount}</p>
                        <p className="text-xs text-slate-500">Pending</p>
                    </CardContent></Card>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Search</Label>
                        <Input placeholder="Name or matric number..." value={search} onChange={e => setSearch(e.target.value)} className="h-10" />
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Department</Label>
                        <Select value={filterDept} onValueChange={setFilterDept}>
                            <SelectTrigger className="w-48 h-10"><SelectValue placeholder="All" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {DEPARTMENTS.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-36 h-10"><SelectValue placeholder="All" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="cleared">Cleared</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Matric</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Dept</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Health Status</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Form Submitted</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">No records found</td></tr>
                            ) : (
                                records.map((rec) => (
                                    <tr key={rec.studentId} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-3 text-sm font-medium text-slate-900">{rec.studentName}</td>
                                        <td className="p-3 text-sm font-mono text-slate-700">{rec.matricNumber || '-'}</td>
                                        <td className="p-3 text-sm text-slate-600">{rec.deptName || '-'}</td>
                                        <td className="p-3 text-center">
                                            <Badge className={`text-xs ${
                                                rec.healthStatus === 'cleared' ? 'bg-green-100 text-green-700' :
                                                rec.healthStatus === 'flagged' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>{rec.healthStatus || 'pending'}</Badge>
                                        </td>
                                        <td className="p-3 text-center">
                                            {rec.medicalFormSubmittedAt ? (
                                                <Badge className="bg-green-100 text-green-700 text-xs">
                                                    {new Date(rec.medicalFormSubmittedAt).toLocaleDateString('en-GB')}
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-700 text-xs">Pending</Badge>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Button size="sm" variant="outline" onClick={() => setSelected(rec)} className="gap-1">
                                                <Eye className="w-3 h-3" /> View
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <span className="text-sm text-slate-500">Page {page} of {totalPages} ({total} total)</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {selected && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900">Medical Record — {selected.studentName}</h3>
                                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><span className="text-slate-500">Matric:</span> <span className="font-mono font-bold">{selected.matricNumber}</span></div>
                                    <div><span className="text-slate-500">Department:</span> <span className="font-medium">{selected.deptName}</span></div>
                                    <div><span className="text-slate-500">Health Status:</span> <Badge className={`text-xs ml-1 ${selected.healthStatus === 'cleared' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{selected.healthStatus || 'pending'}</Badge></div>
                                    <div><span className="text-slate-500">Submitted:</span> <span className="font-medium">{selected.medicalFormSubmittedAt ? new Date(selected.medicalFormSubmittedAt).toLocaleDateString('en-GB') : 'Not submitted'}</span></div>
                                </div>
                                {selected.bloodGroup && <div><span className="text-slate-500">Blood Group:</span> <span className="font-bold">{selected.bloodGroup}</span></div>}
                                {selected.genotype && <div><span className="text-slate-500">Genotype:</span> <span className="font-bold">{selected.genotype}</span></div>}
                                {selected.allergies && <div><span className="text-slate-500">Allergies:</span> <span className="font-medium">{selected.allergies}</span></div>}
                                {selected.medicalHistory && <div><span className="text-slate-500">Medical History:</span> <span className="font-medium">{selected.medicalHistory}</span></div>}
                                {selected.currentMedications && <div><span className="text-slate-500">Current Medications:</span> <span className="font-medium">{selected.currentMedications}</span></div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}