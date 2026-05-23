"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, BookOpen, FileUp, X } from "lucide-react";
import { getProgrammes, createProgramme, deleteProgramme, bulkImportProgrammes } from "@/actions/programmes";
import { UniversalImporter } from "@/components/UniversalImporter";
import { getDepartments } from "@/actions/departments";

export default function ProgrammesPage() {
    const [programmes, setProgrammes] = useState<any[]>([]);
    const [depts, setDepts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [newName, setNewName] = useState("");
    const [selectedDept, setSelectedDept] = useState("");
    const [durationMonths, setDurationMonths] = useState("48");
    const [submitting, setSubmitting] = useState(false);
    const [showImporter, setShowImporter] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [progData, deptData] = await Promise.all([
            getProgrammes(),
            getDepartments()
        ]);
        setProgrammes(progData);
        setDepts(deptData);
        setLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDept) return alert("Please select a department");
        setSubmitting(true);
        const res = await createProgramme(newName, parseInt(selectedDept), parseInt(durationMonths));
        if (res.success) {
            setNewName("");
            setSelectedDept("");
            setDurationMonths("48");
            setIsAdding(false);
            fetchData();
        } else {
            alert(res.error);
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This will delete the programme.")) return;
        const res = await deleteProgramme(id);
        if (res.success) fetchData();
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Programmes</h2>
                    <p className="text-slate-500 mt-1">Manage degree programmes and courses of study</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowImporter(!showImporter)}
                        variant="outline"
                        className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 border-slate-200 bg-white gap-2 shadow-sm"
                    >
                        {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                        {showImporter ? "Close Importer" : "Import Programmes"}
                    </Button>
                    <Button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 gap-2 font-bold"
                    >
                        {isAdding ? "Cancel" : <><Plus className="w-4 h-4" /> Add Programme</>}
                    </Button>
                </div>
            </div>

            {showImporter && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <UniversalImporter
                        title="Bulk Programme Import"
                        description="Import multiple programmes. Columns: name, deptId, durationMonths."
                        templateColumns={["name", "deptId", "durationMonths"]}
                        onImport={bulkImportProgrammes}
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
                                <label className="text-xs font-bold text-slate-500 uppercase">Programme Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    placeholder="e.g. B.Sc. Computer Science"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white h-10"
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                >
                                    <option value="">Select Dept</option>
                                    {depts.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Duration (Months)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={durationMonths}
                                    onChange={(e) => setDurationMonths(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-slate-900 h-11 rounded-lg"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Programme"}
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
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Programme Name</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Duration</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                </td>
                            </tr>
                        ) : programmes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                    No programmes found.
                                </td>
                            </tr>
                        ) : (
                            programmes.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-mono text-slate-400">#{p.id}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{p.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-600">{p.department?.name || 'Unknown'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{p.durationMonths / 12} Years</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
