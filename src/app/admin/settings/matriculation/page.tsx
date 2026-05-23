"use client";

import { useState, useEffect } from "react";
import { getMatriculationSettings, saveMatriculationSetting, deleteMatriculationSetting } from "@/actions/matriculation";
import { getFaculties } from "@/actions/faculties";
import { getDepartments } from "@/actions/departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Edit2, ShieldAlert } from "lucide-react";

export default function MatriculationSettingsPage() {
    const [settings, setSettings] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    const [formData, setFormData] = useState({
        id: undefined as number | undefined,
        nomenclature: "Matriculation Number",
        format: "{DEPT_CODE}/{YEAR}/{SERIAL}",
        serialStart: 1,
        serialPadding: 3,
        facultyId: "",
        deptId: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sets, facs, depts] = await Promise.all([
                getMatriculationSettings(),
                getFaculties(),
                getDepartments()
            ]);
            setSettings(sets);
            setFaculties(facs);
            setDepartments(depts);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await saveMatriculationSetting({
            id: formData.id,
            nomenclature: formData.nomenclature,
            format: formData.format,
            serialStart: parseInt(formData.serialStart.toString()),
            serialPadding: parseInt(formData.serialPadding.toString()),
            facultyId: formData.facultyId ? parseInt(formData.facultyId) : undefined,
            deptId: formData.deptId ? parseInt(formData.deptId) : undefined,
        });
        if (res.success) {
            await loadData();
            setIsEditing(false);
            setFormData({
                id: undefined,
                nomenclature: "Matriculation Number",
                format: "{DEPT_CODE}/{YEAR}/{SERIAL}",
                serialStart: 1,
                serialPadding: 3,
                facultyId: "",
                deptId: "",
            });
        } else {
            alert(res.error || "Failed to save");
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This deletes the sequence tracker as well. Existing students will keep their numbers, but the next serial will reset if you recreate this rule.")) return;
        setLoading(true);
        await deleteMatriculationSetting(id);
        await loadData();
    };

    if (loading && settings.length === 0) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Matriculation Generator Config</h1>
                <p className="text-slate-500 font-medium mt-2">Manage dynamic formats for student matriculation numbers.</p>
            </div>

            {isEditing ? (
                <Card className="border-none shadow-sm ring-1 ring-slate-100">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg font-black text-slate-800">{formData.id ? "Edit Setting" : "Create New Setting"}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nomenclature</label>
                                    <Input 
                                        value={formData.nomenclature}
                                        onChange={e => setFormData({...formData, nomenclature: e.target.value})}
                                        placeholder="e.g. Admission Number"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Format String</label>
                                    <Input 
                                        value={formData.format}
                                        onChange={e => setFormData({...formData, format: e.target.value})}
                                        placeholder="{DEPT_CODE}/{YEAR}/{SERIAL}"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400">Available Tags: {'{YEAR}, {DEPT_CODE}, {FACULTY_CODE}, {UNIT_CODE}, {SERIAL}'}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Serial Start Number</label>
                                    <Input 
                                        type="number"
                                        value={formData.serialStart}
                                        onChange={e => setFormData({...formData, serialStart: parseInt(e.target.value)})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Serial Padding (Zeroes)</label>
                                    <Input 
                                        type="number"
                                        value={formData.serialPadding}
                                        onChange={e => setFormData({...formData, serialPadding: parseInt(e.target.value)})}
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400">E.g., 3 creates "001", 4 creates "0001"</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Specific Faculty Override (Optional)</label>
                                    <select 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.facultyId}
                                        onChange={e => setFormData({...formData, facultyId: e.target.value})}
                                    >
                                        <option value="">None (Applies to all)</option>
                                        {faculties.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Specific Dept Override (Optional)</label>
                                    <select 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.deptId}
                                        onChange={e => setFormData({...formData, deptId: e.target.value})}
                                    >
                                        <option value="">None (Applies to all)</option>
                                        {departments.filter(d => !formData.facultyId || d.facultyId.toString() === formData.facultyId).map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase text-xs tracking-widest rounded-xl" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Save Settings
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="font-bold uppercase text-xs tracking-widest rounded-xl">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <Button 
                            onClick={() => {
                                setFormData({
                                    id: undefined,
                                    nomenclature: "Matriculation Number",
                                    format: "{DEPT_CODE}/{YEAR}/{SERIAL}",
                                    serialStart: 1,
                                    serialPadding: 3,
                                    facultyId: "",
                                    deptId: "",
                                });
                                setIsEditing(true);
                            }}
                            className="bg-slate-900 hover:bg-black font-bold uppercase text-xs tracking-widest rounded-xl"
                        >
                            <Plus className="w-4 h-4 mr-2" /> New Override
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {settings.map((s) => (
                            <Card key={s.id} className="border-none shadow-sm ring-1 ring-slate-100 relative group overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-black text-slate-800">{s.nomenclature}</h3>
                                            <p className="text-xs text-slate-500 font-mono mt-1 bg-slate-100 px-2 py-1 rounded inline-block">{s.format}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => {
                                                setFormData({
                                                    id: s.id,
                                                    nomenclature: s.nomenclature || "",
                                                    format: s.format || "",
                                                    serialStart: s.serialStart || 1,
                                                    serialPadding: s.serialPadding || 3,
                                                    facultyId: s.facultyId ? s.facultyId.toString() : "",
                                                    deptId: s.deptId ? s.deptId.toString() : "",
                                                });
                                                setIsEditing(true);
                                            }}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(s.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-4 text-sm text-slate-600">
                                        <div className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-xs font-bold uppercase text-slate-400">Target</span>
                                            <span className="font-medium text-slate-700">
                                                {s.deptId ? `Dept: ${s.deptCode}` : s.facultyId ? `Faculty: ${s.facultyCode}` : s.unitId ? `Branch: ${s.unitName}` : "Global (Default)"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span className="text-xs font-bold uppercase text-slate-400">Start Serial</span>
                                            <span className="font-medium text-slate-700">{s.serialStart} (Pad {s.serialPadding})</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {settings.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-600">No Generators Configured</h3>
                            <p className="text-sm text-slate-400 mt-1">Create a global default or a specific department override to start.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
