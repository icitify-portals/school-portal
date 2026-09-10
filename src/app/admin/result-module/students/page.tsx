"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2, Edit, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";
import { getStudents } from "@/actions/students";
import { getResultTemplateStudents, deleteStudentRm, createStudentRm, updateStudentRm, getDepartmentsList, getProgrammesList } from "@/actions/result-module";

export default function ResultModuleStudentsPage() {
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [selectedDept, setSelectedDept] = useState<string>("");
    const [selectedProg, setSelectedProg] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize] = useState(20);
    const [departments, setDepartments] = useState<any[]>([]);
    const [programmes, setProgrammes] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        matricNumber: "",
        deptId: "",
        programmeId: "",
    });
    const [downloadingList, setDownloadingList] = useState(false);

    const handleDownloadList = async () => {
        setDownloadingList(true);
        const res = await getResultTemplateStudents(selectedDept || selectedProg ? { departmentId: selectedDept ? Number(selectedDept) : undefined, programmeId: selectedProg ? Number(selectedProg) : undefined } : {});
        setDownloadingList(false);
        if (!res.success) return alert("Error: " + res.error);
        const rows = (res.data || []) as any[];
        if (!rows.length) return alert("No students found in the system.");
        const csv = Papa.unparse({
            fields: ["matric_number", "name", "programme"],
            data: rows.map(s => ({ matric_number: s.matricNumber, name: s.name, programme: s.programme })),
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "student_list.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        getDepartmentsList().then((r: any) => r.success && setDepartments(r.data || []));
        getProgrammesList().then((r: any) => r.success && setProgrammes(r.data || []));
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [search, selectedDept, selectedProg, currentPage]);

    const fetchStudents = async () => {
        setLoading(true);
        const data: any = await getStudents({ search, page: currentPage, pageSize, departmentId: selectedDept ? Number(selectedDept) : undefined, programmeId: selectedProg ? Number(selectedProg) : undefined });
        if (data.data) {
            setStudentsList(data.data);
            setTotalCount(data.totalCount || 0);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.deptId || !formData.programmeId) return alert("Department and Programme are required");
        
        if (editingStudent) {
            const res: any = await updateStudentRm(editingStudent.id, { ...formData, deptId: Number(formData.deptId), programmeId: Number(formData.programmeId) });
            if (res.success) {
                setEditingStudent(null);
                fetchStudents();
            } else alert(res.error);
        } else {
            const res: any = await createStudentRm({ ...formData, deptId: Number(formData.deptId), programmeId: Number(formData.programmeId) });
            if (res.success) {
                setIsAdding(false);
                fetchStudents();
            } else alert(res.error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this student from the system?")) return;
        const res: any = await deleteStudentRm(id);
        if (res.success) fetchStudents();
        else alert(res.error);
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-6xl w-full mx-auto space-y-6">
                <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Users className="text-indigo-400" /> Result Module Students
                        </h1>
                        <p className="text-slate-400 mt-2">Manage student accounts and matriculation numbers.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleDownloadList} disabled={downloadingList} variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                            {downloadingList ? "Downloading..." : "Download Student List"}
                        </Button>
                        <Button onClick={() => { setFormData({ name: "", matricNumber: "", deptId: "", programmeId: "" }); setIsAdding(!isAdding); setEditingStudent(null); }} className="bg-indigo-600 hover:bg-indigo-700">
                            {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Student</>}
                        </Button>
                    </div>
                </div>

                <Card className="border-slate-200">
                    <CardContent className="p-4 flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Search name, matric, email..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-10" />
                        </div>
                        <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedProg(""); setCurrentPage(1); }} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white">
                            <option value="">All Departments</option>
                            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                        </select>
                        <select value={selectedProg} onChange={(e) => { setSelectedProg(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white">
                            <option value="">All Programmes</option>
                            {(selectedDept ? programmes.filter((p: any) => String(p.department?.id || p.deptId) === String(selectedDept)) : programmes).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <span className="text-xs font-bold text-slate-500 flex items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">{totalCount} students</span>
                    </CardContent>
                </Card>

                {(isAdding || editingStudent) && (
                    <Card className="shadow-lg border-none">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>{editingStudent ? "Edit Student" : "New Student"}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Matriculation Number</label>
                                    <Input required value={formData.matricNumber} onChange={e => setFormData({ ...formData, matricNumber: e.target.value.toUpperCase() })} placeholder="FSS/19/CS/..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Department *</label>
                                    <select required value={formData.deptId} onChange={e => setFormData({ ...formData, deptId: e.target.value, programmeId: "" })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
                                        <option value="">Select Department</option>
                                        {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Programme *</label>
                                    <select required value={formData.programmeId} onChange={e => setFormData({ ...formData, programmeId: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
                                        <option value="">Select Programme</option>
                                        {(formData.deptId ? programmes.filter((p: any) => String(p.department?.id || p.deptId) === String(formData.deptId)) : programmes).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <Button type="submit" className="bg-indigo-600">Save Student</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="text-center py-10">Loading students...</div>
                ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {studentsList.map((student: any) => (
                            <Card key={student.id} className="shadow hover:shadow-md transition-shadow">
                                <CardContent className="p-6 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-lg text-slate-800">{student.matricNumber || 'No Matric'}</h3>
                                        <p className="text-sm text-slate-600">{student.user?.name || student.name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-400">{student.programme?.name || 'No programme'} • {student.programme?.department?.name || ''}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" onClick={() => {
                                            setEditingStudent(student);
                                            setFormData({ name: student.user?.name || student.name || "", matricNumber: student.matricNumber || "", deptId: String(student.deptId || ""), programmeId: String(student.programmeId || "") });
                                            setIsAdding(false);
                                        }}>
                                            <Edit className="w-4 h-4 text-slate-600" />
                                        </Button>
                                        <Button size="icon" variant="outline" onClick={() => handleDelete(student.id)}>
                                            <Trash2 className="w-4 h-4 text-rose-500" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-600">Page {currentPage} of {totalPages} — {totalCount} total</span>
                        <div className="flex gap-2">
                            <Button variant="outline" disabled={currentPage===1} onClick={() => setCurrentPage(p=>Math.max(1,p-1))}>Prev</Button>
                            <Button variant="outline" disabled={currentPage===totalPages} onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))}>Next</Button>
                        </div>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}
