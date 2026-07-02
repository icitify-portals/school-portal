"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Plus, Trash2, Loader2, Landmark, FileUp, X } from "lucide-react";
import { getFaculties, createFaculty, deleteFaculty, bulkImportFaculties } from "@/actions/faculties";
import { UniversalImporter } from "@/components/UniversalImporter";

export default function FacultiesPage() {
    const [faculties, setFaculties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({ name: "", code: "" });
    const [showImporter, setShowImporter] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchFaculties();
    }, []);

    const fetchFaculties = async () => {
        setLoading(true);
        const data = await getFaculties();
        setFaculties(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createFaculty(formData.name, formData.code);
        if (res.success) {
            setFormData({ name: "", code: "" });
            setIsAdding(false);
            fetchFaculties();
        } else {
            alert(res.error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This will fail if there are departments linked.")) return;
        const res = await deleteFaculty(id);
        if (res.success) fetchFaculties();
        else alert(res.error);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen pb-32">
            <div className="max-w-[1600px] w-full mx-auto space-y-6">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Landmark className="w-12 h-12 text-blue-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    Faculties
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Manage institutional faculties and umbrella colleges
                            </p>
                        </div>
                        <div className="flex flex-col gap-4 items-end">
                            <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner gap-2 flex-wrap">
                                <button
                                    onClick={() => setShowImporter(!showImporter)}
                                    className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap text-slate-300 hover:text-white hover:bg-white/10"
                                >
                                    {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                                    {showImporter ? "Close Importer" : "Import Faculties"}
                                </button>
                                <button
                                    onClick={() => setIsAdding(!isAdding)}
                                    className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
                                        isAdding 
                                        ? "bg-white text-blue-600 shadow-lg" 
                                        : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg"
                                    }`}
                                >
                                    {isAdding ? "Cancel" : <><Plus className="w-4 h-4" /> Add Faculty</>}
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Search faculties..."
                                className="w-full md:w-64 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {showImporter && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <UniversalImporter
                            title="Bulk Faculty Import"
                            description="Import multiple faculties at once. Columns needed: name, code."
                            templateColumns={["name", "code"]}
                            onImport={bulkImportFaculties}
                            onComplete={() => {
                                fetchFaculties();
                                setShowImporter(false);
                            }}
                        />
                    </div>
                )}

                {isAdding && (
                    <Card className="mb-8 border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-200/50 p-8">
                            <CardTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                                <Plus className="w-5 h-5 text-blue-500" />
                                Register New Faculty
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Faculty Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Science"
                                        className="w-full px-6 py-4 rounded-2xl border-none shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 text-slate-900 font-bold"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="w-full md:w-48 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Faculty Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. SCI"
                                        className="w-full px-6 py-4 rounded-2xl border-none shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 text-slate-900 font-bold uppercase"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl h-[56px] px-8 hover:bg-black w-full md:w-auto shadow-lg hover:-translate-y-1 transition-all">
                                        Create Faculty
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/40 backdrop-blur-3xl rounded-[2rem] overflow-hidden animate-pulse">
                                <CardContent className="h-32" />
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {faculties.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.code.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                            <div className="col-span-full p-12 text-center space-y-4 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-300">
                                <Landmark className="w-16 h-16 text-slate-300 mx-auto" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">No Faculties Found</h2>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                    {searchQuery ? "Try a different search term." : "Add your first faculty to begin structuring your institution."}
                                </p>
                            </div>
                        ) : (
                            faculties.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.code.toLowerCase().includes(searchQuery.toLowerCase())).map((faculty) => (
                                <Card key={faculty.id} className="group border border-white/40 shadow-md shadow-slate-200/50 bg-white/80 backdrop-blur-3xl rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors" />
                                    <CardContent className="p-4 relative z-10 flex flex-col h-full justify-between">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg flex items-center justify-center text-blue-300 shadow-md group-hover:scale-110 transition-transform">
                                                <Landmark className="w-4 h-4" />
                                            </div>
                                            <button
                                                onClick={() => handleDelete(faculty.id)}
                                                className="p-1.5 bg-white/50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md shadow-sm transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div>
                                            <div className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black tracking-widest rounded-full uppercase mb-1 shadow-sm">
                                                {faculty.code}
                                            </div>
                                            <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight italic uppercase line-clamp-2 leading-tight">
                                                {faculty.name}
                                            </h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
