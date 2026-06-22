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
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Landmark className="w-8 h-8 text-indigo-600" />
                        Faculty Management
                    </h2>
                    <p className="text-slate-500 mt-1">Manage institutional faculties</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowImporter(!showImporter)}
                        variant="outline"
                        className="rounded-xl font-bold text-xs uppercase tracking-widest h-10 border-slate-200 bg-white gap-2"
                    >
                        {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                        {showImporter ? "Close Importer" : "Import Faculties"}
                    </Button>
                    <Button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl h-10"
                    >
                        {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Faculty</>}
                    </Button>
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
                <Card className="mb-8 border-none shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardHeader>
                        <CardTitle className="text-lg">Register New Faculty</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Faculty Name (e.g. Science)"
                                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Code (e.g. SCI)"
                                className="w-full md:w-32 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 uppercase"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                            <Button type="submit" className="bg-slate-900 text-white font-bold">
                                Create Faculty
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {faculties.map((faculty) => (
                        <Card key={faculty.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase">
                                                {faculty.code}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                            {faculty.name}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(faculty.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {faculties.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No faculties registered yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
