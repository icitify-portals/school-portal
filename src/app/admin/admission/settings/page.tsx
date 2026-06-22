"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { syncJambDataFromApi, getProgrammesWithPolicy, updateAdmissionPolicy } from "@/actions/admission";
import { getAdmissionEngineSetting, saveAdmissionEngineSetting, getAllExaminationBodies, addExaminationBody, updateExaminationBody, deleteExaminationBody } from "@/actions/admission_v2";
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Save, Settings, Trash2, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function AdmissionSettingsPage() {
    const [apiKey, setApiKey] = useState("MOCK_JAMB_KEY_12345");
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [engineType, setEngineType] = useState<string>("multi_level");

    useEffect(() => {
        getAdmissionEngineSetting().then((val) => {
            setEngineType(val || "multi_level");
        });
    }, []);

    const handleSaveEngine = async (val: string) => {
        setEngineType(val);
        try {
            const res = await saveAdmissionEngineSetting(val);
            if (res.success) {
                toast.success("Admission engine pathway setting updated successfully!");
            } else {
                toast.error("Failed to update admission engine setting.");
            }
        } catch (err) {
            toast.error("An error occurred while updating the engine setting.");
        }
    };

    const handleSync = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await syncJambDataFromApi(year, apiKey);
            if (res.success) {
                setMessage({ type: 'success', text: res.message || "Sync successful" });
            } else {
                setMessage({ type: 'error', text: res.error || "Sync failed" });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "An unexpected error occurred" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Admission Settings</h1>
                <p className="text-slate-500">Manage external integrations and admission configurations.</p>
            </div>

            <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700 animate-pulse">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-900">Admission Engine Configuration</CardTitle>
                            <CardDescription className="text-slate-500 text-xs">Configure the global admission entry point and candidate routing pathway.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                id: "multi_level",
                                title: "Intelligent Selector",
                                description: "Multi-level routing for K-12 (Primary, Secondary) and all Tertiary applications.",
                                badge: "Recommended",
                                color: "border-indigo-500 bg-indigo-50/30 text-indigo-700 ring-2 ring-indigo-500/20",
                                defaultColor: "hover:border-slate-300 hover:bg-slate-50/50"
                            },
                            {
                                id: "jamb_only",
                                title: "JAMB CAPS Only",
                                description: "Strictly enforces University UTME caps profile claim & screening validations.",
                                badge: "JAMB Strict",
                                color: "border-emerald-500 bg-emerald-50/30 text-emerald-700 ring-2 ring-emerald-500/20",
                                defaultColor: "hover:border-slate-300 hover:bg-slate-50/50"
                            },
                            {
                                id: "direct_only",
                                title: "Direct Forms Only",
                                description: "Bypasses JAMB to serve flexible, highly-customizable direct portal intake forms.",
                                badge: "K-12 & Direct",
                                color: "border-amber-500 bg-amber-50/30 text-amber-700 ring-2 ring-amber-500/20",
                                defaultColor: "hover:border-slate-300 hover:bg-slate-50/50"
                            }
                        ].map((engine) => {
                            const isSelected = engineType === engine.id;
                            return (
                                <button
                                    key={engine.id}
                                    onClick={() => handleSaveEngine(engine.id)}
                                    className={`relative text-left p-5 rounded-xl border-2 transition-all duration-300 group flex flex-col justify-between h-44 ${
                                        isSelected 
                                            ? engine.color 
                                            : `border-slate-200 text-slate-700 ${engine.defaultColor}`
                                    }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-sm tracking-tight">{engine.title}</span>
                                            {engine.badge && (
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                    isSelected 
                                                        ? 'bg-white shadow-sm border border-slate-100' 
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {engine.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed font-normal">
                                            {engine.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold">
                                        {isSelected ? (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4 shrink-0" />
                                                Active Entry Mode
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                                                Click to activate →
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <AdmissionPolicyEditor />

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <RefreshCw className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                            <CardTitle>JAMB CAPS Integration</CardTitle>
                            <CardDescription>Sync candidate data directly from the Joint Admissions and Matriculation Board.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                                id="apiKey"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter JAMB API Key"
                            />
                            <p className="text-xs text-slate-500">Use 'MOCK_KEY' for testing simulation.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="year">Exam Year</Label>
                            <Input
                                id="year"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="YYYY"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {message.text}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSync} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Sync Candidates Now
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AdmissionPolicyEditor />
            <ExaminationBodiesManager />
        </div>
    );
}

function AdmissionPolicyEditor() {
    const [programmes, setProgrammes] = useState<any[]>([]);
    const [selectedProgId, setSelectedProgId] = useState<string>("");
    const [policy, setPolicy] = useState({ cutOffMark: 180, meritQuota: 45, catchmentAreas: "" });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        loadProgrammes();
    }, []);

    const loadProgrammes = async () => {
        const data = await getProgrammesWithPolicy();
        setProgrammes(data);
    };

    const handleProgChange = (id: string) => {
        setSelectedProgId(id);
        const prog = programmes.find(p => p.id.toString() === id);
        if (prog) {
            setPolicy({
                cutOffMark: prog.cutOffMark || 180,
                meritQuota: prog.meritQuota || 45,
                catchmentAreas: prog.catchmentAreas ? JSON.parse(prog.catchmentAreas).join(", ") : ""
            });
        }
    };

    const handleSave = async () => {
        if (!selectedProgId) return;
        setLoading(true);
        setMsg("");
        try {
            const areas = policy.catchmentAreas.split(",").map(s => s.trim()).filter(Boolean);
            const res = await updateAdmissionPolicy(parseInt(selectedProgId), {
                cutOffMark: policy.cutOffMark,
                meritQuota: policy.meritQuota,
                catchmentAreas: areas
            });

            if (res.success) {
                setMsg("Policy saved successfully.");
                loadProgrammes(); // Refresh
            } else {
                setMsg("Failed to save policy.");
            }
        } catch (e) {
            setMsg("Error saving policy.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admission Policy Configuration</CardTitle>
                <CardDescription>Set cut-off marks and catchment areas per programme.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Select Programme</Label>
                    <Select value={selectedProgId} onValueChange={handleProgChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a programme..." />
                        </SelectTrigger>
                        <SelectContent>
                            {programmes.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedProgId && (
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-4 border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cut-Off Mark</Label>
                                <Input
                                    type="number"
                                    value={policy.cutOffMark}
                                    onChange={(e) => setPolicy({ ...policy, cutOffMark: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Merit Quota (%)</Label>
                                <Input
                                    type="number"
                                    value={policy.meritQuota}
                                    onChange={(e) => setPolicy({ ...policy, meritQuota: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Catchment Areas (comma separated)</Label>
                            <Input
                                value={policy.catchmentAreas}
                                onChange={(e) => setPolicy({ ...policy, catchmentAreas: e.target.value })}
                                placeholder="e.g. Lagos, Ogun, Oyo"
                            />
                            <p className="text-xs text-slate-500">Candidates from these states will be considered under catchment policy.</p>
                        </div>

                        {msg && (
                            <div className="text-sm p-2 bg-slate-100 rounded text-slate-700">
                                {msg}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button onClick={handleSave} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Save Policy
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ExaminationBodiesManager() {
    const [bodies, setBodies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newBodyName, setNewBodyName] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        loadBodies();
    }, []);

    const loadBodies = async () => {
        setLoading(true);
        const data = await getAllExaminationBodies();
        setBodies(data);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!newBodyName.trim()) return;
        setIsAdding(true);
        const res = await addExaminationBody(newBodyName.trim());
        if (res.success) {
            toast.success("Examination body added!");
            setNewBodyName("");
            loadBodies();
        } else {
            toast.error(res.error);
        }
        setIsAdding(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this examination body?")) return;
        const res = await deleteExaminationBody(id);
        if (res.success) {
            toast.success("Examination body deleted!");
            loadBodies();
        } else {
            toast.error(res.error);
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        const res = await updateExaminationBody(id, !currentStatus);
        if (res.success) {
            toast.success("Status updated!");
            loadBodies();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Examination Bodies</CardTitle>
                <CardDescription>Manage the allowed examination bodies (e.g. WAEC, NECO) available for O-Level submission.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2">
                    <Input 
                        placeholder="e.g. WAEC" 
                        value={newBodyName} 
                        onChange={(e) => setNewBodyName(e.target.value)} 
                        className="max-w-sm"
                    />
                    <Button onClick={handleAdd} disabled={isAdding || !newBodyName.trim()}>
                        {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Add Body
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : (
                    <div className="border rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bodies.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">No examination bodies configured.</td>
                                    </tr>
                                ) : (
                                    bodies.map((body) => (
                                        <tr key={body.id} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{body.name}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleToggleStatus(body.id, body.isActive)}
                                                    className={body.isActive ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-100"}
                                                >
                                                    {body.isActive ? "Active" : "Inactive"}
                                                </Button>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(body.id)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
