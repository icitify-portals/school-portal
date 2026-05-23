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
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Home className="w-8 h-8 text-indigo-600" />
                        Departments
                    </h2>
                    <p className="text-slate-500 mt-1">Manage academic departments linked to faculties</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowImporter(!showImporter)}
                        variant="outline"
                        className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 border-slate-200 bg-white gap-2 shadow-sm"
                    >
                        {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                        {showImporter ? "Close Importer" : "Import Departments"}
                    </Button>
                    <Button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 gap-2 font-bold"
                    >
                        {isAdding ? "Cancel" : <><Plus className="w-4 h-4" /> Add Department</>}
                    </Button>
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

            <Card className="border-none shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Department Name</th>
                            <th className="px-6 py-4">Faculty</th>
                            <th className="px-6 py-4">Unit Limits (S/A)</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                </td>
                            </tr>
                        ) : depts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                                    No departments found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            depts.map((dept) => (
                                <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{dept.code}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{dept.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Landmark className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs text-slate-500 font-medium">{dept.faculty?.name || "Unassigned"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Semester: {dept.minUnitsSemester}-{dept.maxUnitsSemester}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Annual: {dept.minUnitsAnnual}-{dept.maxUnitsAnnual}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(dept)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Edit Requirements"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dept.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
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
    );
}
