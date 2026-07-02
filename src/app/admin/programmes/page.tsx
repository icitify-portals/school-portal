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
    const [durationMonths, setDurationMonths] = useState("24");
    const [submitting, setSubmitting] = useState(false);
    const [showImporter, setShowImporter] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

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
            setDurationMonths("24");
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
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen pb-32">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex items-center gap-3 mb-2">
                        <BookOpen className="w-12 h-12 text-indigo-400" />
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                Programmes
                            </h1>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90 mt-1">
                                Manage degree programmes and courses of study
                            </p>
                        </div>
                    </div>
                    <div className="relative z-10 flex flex-col items-end gap-4 w-full md:w-auto">
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
                    <input
                        type="text"
                        placeholder="Search programmes..."
                        className="w-full md:w-64 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
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
                <Card className="mb-8 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6 p-6">
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

            <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
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
                        ) : programmes.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.department?.name || "").toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                    {searchQuery ? "Try a different search term." : "No programmes found."}
                                </td>
                            </tr>
                        ) : (
                            programmes.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.department?.name || "").toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
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
        </div>
    );
}
