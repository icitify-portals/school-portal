"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Home, FileUp, X, Settings } from "lucide-react";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, bulkImportDepartments } from "@/actions/departments";
import { getFaculties } from "@/actions/faculties";
import { Landmark } from "lucide-react";
import { UniversalImporter } from "@/components/UniversalImporter";

export default function DepartmentsPage() {
    const [depts, setDepts] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newCode, setNewCode] = useState("");
    const [facultyId, setFacultyId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showImporter, setShowImporter] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingDept, setEditingDept] = useState<any>(null);
    const [editLimits, setEditLimits] = useState({
        minUnitsAnnual: 24,
        maxUnitsAnnual: 48,
        minUnitsSemester: 12,
        maxUnitsSemester: 24
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [deptData, facultyData] = await Promise.all([
            getDepartments(),
            getFaculties()
        ]);
        setDepts(deptData);
        setFaculties(facultyData);
        setLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!facultyId) return alert("Please select a faculty");
        setSubmitting(true);
        const res = await createDepartment(newName, newCode, parseInt(facultyId));
        if (res.success) {
            setNewName("");
            setNewCode("");
            setFacultyId("");
            setIsAdding(false);
            fetchData();
        } else {
            alert(res.error);
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this department?")) return;
        const res = await deleteDepartment(id);
        if (res.success) {
            fetchData();
        } else {
            alert(res.error);
        }
    };

    const handleUpdateLimits = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await updateDepartment(editingDept.id, editLimits);
        if (res.success) {
            setEditingDept(null);
            fetchData();
        } else {
            alert(res.error);
        }
        setSubmitting(false);
    };

    const openEdit = (dept: any) => {
        setEditingDept(dept);
        setEditLimits({
            minUnitsAnnual: dept.minUnitsAnnual || 24,
            maxUnitsAnnual: dept.maxUnitsAnnual || 48,
            minUnitsSemester: dept.minUnitsSemester || 12,
            maxUnitsSemester: dept.maxUnitsSemester || 24
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen pb-32">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Home className="w-12 h-12 text-emerald-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    Departments
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Manage academic departments linked to faculties
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-4 items-end">
                            <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner gap-2 flex-wrap">
                                <button
                                    onClick={() => setShowImporter(!showImporter)}
                                    className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap text-slate-300 hover:text-white hover:bg-white/10"
                                >
                                    {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                                    {showImporter ? "Close Importer" : "Import Departments"}
                                </button>
                                <button
                                    onClick={() => setIsAdding(!isAdding)}
                                    className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
                                        isAdding 
                                        ? "bg-white text-emerald-600 shadow-lg" 
                                        : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg"
                                    }`}
                                >
                                    {isAdding ? "Cancel" : <><Plus className="w-4 h-4" /> Add Department</>}
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Search departments..."
                                className="w-full md:w-64 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

            {showImporter && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <UniversalImporter
                        title="Bulk Department Import"
                        description="Import multiple departments. Columns needed: name, code, facultyId."
                        templateColumns={["name", "code", "facultyId"]}
                        onImport={bulkImportDepartments}
                        onComplete={() => {
                            fetchData();
                            setShowImporter(false);
                        }}
                    />
                </div>
            )}

            {isAdding && (
                <Card className="mb-8 border-none shadow-md bg-slate-50">
                    <CardContent className="pt-6">
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-2">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Faculty</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                                    value={facultyId}
                                    onChange={(e) => setFacultyId(e.target.value)}
                                >
                                    <option value="">Select Faculty</option>
                                    {faculties.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Department Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                                    placeholder="e.g. Computer Science"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Dept Code</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 uppercase"
                                    placeholder="e.g. CSC"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-slate-900 h-11 rounded-lg"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Department"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/40 border-b border-white/40">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Department Name</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Faculty</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Limits (S/A)</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" />
                                    </td>
                                </tr>
                            ) : depts.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.code.toLowerCase().includes(searchQuery.toLowerCase()) || (d.faculty?.name || "").toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                                                <Home className="w-10 h-10 text-emerald-300" />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">No Departments Found</h3>
                                            <p className="text-slate-500 font-medium">{searchQuery ? "Try a different search term." : "Add your first department to get started."}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                depts.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.code.toLowerCase().includes(searchQuery.toLowerCase()) || (d.faculty?.name || "").toLowerCase().includes(searchQuery.toLowerCase())).map((dept) => (
                                    <tr key={dept.id} className="hover:bg-white/60 transition-colors group">
                                        <td className="px-8 py-6">
                                            <span className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">{dept.code}</span>
                                        </td>
                                        <td className="px-8 py-6 text-lg font-black text-slate-800 tracking-tight">{dept.name}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 rounded-xl">
                                                    <Landmark className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{dept.faculty?.name || "Unassigned"}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-16">Semester</span>
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{dept.minUnitsSemester} - {dept.maxUnitsSemester}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-16">Annual</span>
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{dept.minUnitsAnnual} - {dept.maxUnitsAnnual}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(dept)}
                                                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl shadow-sm transition-all"
                                                    title="Edit Requirements"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dept.id)}
                                                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-xl shadow-sm transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {editingDept && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase italic">Registration Requirements</CardTitle>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{editingDept.name} ({editingDept.code})</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <form onSubmit={handleUpdateLimits} className="space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 border-b border-indigo-100 pb-2">Semester Load</h4>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Min Units</label>
                                            <input
                                                type="number"
                                                className="w-full h-12 rounded-2xl border border-slate-200 px-4 font-bold text-sm bg-slate-50"
                                                value={editLimits.minUnitsSemester}
                                                onChange={(e) => setEditLimits({ ...editLimits, minUnitsSemester: parseInt(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Max Units</label>
                                            <input
                                                type="number"
                                                className="w-full h-12 rounded-2xl border border-slate-200 px-4 font-bold text-sm bg-slate-50"
                                                value={editLimits.maxUnitsSemester}
                                                onChange={(e) => setEditLimits({ ...editLimits, maxUnitsSemester: parseInt(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 border-b border-emerald-100 pb-2">Annual Load</h4>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Min Units</label>
                                            <input
                                                type="number"
                                                className="w-full h-12 rounded-2xl border border-slate-200 px-4 font-bold text-sm bg-slate-50"
                                                value={editLimits.minUnitsAnnual}
                                                onChange={(e) => setEditLimits({ ...editLimits, minUnitsAnnual: parseInt(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Max Units</label>
                                            <input
                                                type="number"
                                                className="w-full h-12 rounded-2xl border border-slate-200 px-4 font-bold text-sm bg-slate-50"
                                                value={editLimits.maxUnitsAnnual}
                                                onChange={(e) => setEditLimits({ ...editLimits, maxUnitsAnnual: parseInt(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setEditingDept(null)}
                                        className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-slate-900 hover:bg-black text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Requirements"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
        </div>
    );
}
