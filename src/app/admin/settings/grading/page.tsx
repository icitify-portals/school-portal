"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    GraduationCap,
    Plus,
    Trash2,
    Save,
    Calendar,
    Settings2,
    Trophy,
    History,
    CheckCircle2,
    XCircle,
    Copy,
    Zap
} from "lucide-react";
import {
    getGradingSystems,
    createGradingSystem,
    setGradePoints,
    setDegreeClassifications,
    assignGradingSystemToSession,
    seedGradingSystem
} from "@/actions/grading";
import { getAcademicSessions } from "@/actions/portal";
import { getSystemSettings, updateSystemSetting } from "@/actions/system-settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as Tabs from "@radix-ui/react-tabs";

export default function GradingSystemsPage() {
    const [systems, setSystems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSystem, setSelectedSystem] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newSystem, setNewSystem] = useState({ name: "", scale: 4, description: "" });

    // Editor states
    const [points, setPoints] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [academicSessionsList, setAcademicSessionsList] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<number | "">("");
    const [defaultProration, setDefaultProration] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [gsData, sessionsData, settingsData] = await Promise.all([
            getGradingSystems(),
            getAcademicSessions(),
            getSystemSettings()
        ]);
        setSystems(gsData);
        setAcademicSessionsList(sessionsData);
        
        const proration = settingsData.find(s => s.key === 'grading.default_proration')?.value === 'true';
        setDefaultProration(proration);

        if (gsData.length > 0 && !selectedSystem) {
            handleSelectSystem(gsData[0]);
        }
        setLoading(false);
    };

    const handleSelectSystem = (sys: any) => {
        setSelectedSystem(sys);
        setPoints(sys.points || []);
        setClasses(sys.classifications || []);
    };

    const handleCreate = async () => {
        if (!newSystem.name) return toast.error("Name is required");
        const res = await createGradingSystem(newSystem);
        if (res.success) {
            toast.success("Grading system created");
            setIsCreating(false);
            setNewSystem({ name: "", scale: 4, description: "" });
            loadData();
        }
    };

    const handleSavePoints = async () => {
        if (!selectedSystem) return;
        const res = await setGradePoints(selectedSystem.id, points);
        if (res.success) toast.success("Grade points updated");
        else toast.error(res.error || "Failed to update");
    };

    const handleSaveClasses = async () => {
        if (!selectedSystem) return;
        const res = await setDegreeClassifications(selectedSystem.id, classes);
        if (res.success) toast.success("Classifications updated");
        else toast.error(res.error || "Failed to update");
    };

    const handleAssignSession = async () => {
        if (!selectedSystem || !selectedSessionId) {
            return toast.error("Please select a session and a grading system");
        }
        const res = await assignGradingSystemToSession(Number(selectedSessionId), selectedSystem.id);
        if (res.success) {
            const sessionName = academicSessionsList.find(s => s.id === Number(selectedSessionId))?.name || "selected session";
            toast.success(`System assigned to ${sessionName}`);
            loadData();
        }
    };

    const handleUpdateProrationPolicy = async (val: boolean) => {
        setDefaultProration(val);
        const res = await updateSystemSetting('grading.default_proration', String(val));
        if (res?.success !== false) {
            toast.success(`Proration default set to ${val ? 'ON' : 'OFF'}`);
        }
    };

    const handleSeed = async () => {
        const res = await seedGradingSystem();
        if (res.success) {
            toast.success("Standard NUC 4.0 system seeded successfully");
            loadData();
        } else {
            toast.error(res.error || "Failed to seed");
        }
    };

    const addPointRow = () => {
        setPoints([...points, { letterGrade: "", minMark: 0, maxMark: 100, points: "0.00", description: "" }]);
    };

    const addClassRow = () => {
        setClasses([...classes, { name: "", minCgpa: "0.00", maxCgpa: "4.00" }]);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Loading Grading Systems...</div>;

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 pb-20">
            <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase tracking-tight">
                        <GraduationCap className="w-12 h-12 text-indigo-600" />
                        Grading Infrastructure
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Dynamic GPA/CGPA computation & degree classification</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={handleSeed}
                        variant="ghost"
                        className="text-slate-400 hover:text-indigo-600 font-black px-6 py-7 rounded-2xl flex gap-3 uppercase text-[10px] tracking-widest border border-dashed border-slate-200 hover:border-indigo-200"
                    >
                        <Zap className="w-5 h-5" /> Seed NUC Defaults
                    </Button>
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-7 rounded-2xl shadow-2xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex gap-3 uppercase text-xs tracking-widest"
                    >
                        <Plus className="w-5 h-5" /> Define New Scale
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar: List of Systems */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Available Systems</h3>
                    {systems.map(sys => (
                        <button
                            key={sys.id}
                            onClick={() => handleSelectSystem(sys)}
                            className={cn(
                                "w-full text-left p-6 rounded-2xl transition-all group flex flex-col gap-2 relative overflow-hidden",
                                selectedSystem?.id === sys.id
                                    ? "bg-slate-900 text-white shadow-2xl scale-105 z-10"
                                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-black italic uppercase text-sm tracking-tight">{sys.name}</span>
                                <span className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] font-black",
                                    selectedSystem?.id === sys.id ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                                )}>
                                    {sys.scale}.0
                                </span>
                            </div>
                            <p className={cn("text-[9px] font-bold uppercase tracking-widest truncate",
                                selectedSystem?.id === sys.id ? "text-white/40" : "text-slate-400"
                            )}>
                                {sys.sessions?.length || 0} Years Assigned
                            </p>
                            {selectedSystem?.id === sys.id && (
                                <div className="absolute right-0 bottom-0 opacity-10">
                                    <GraduationCap className="w-16 h-16 -mr-4 -mb-4" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Editor Area */}
                <div className="lg:col-span-3">
                    {selectedSystem ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Tabs.Root defaultValue="points" className="space-y-6">
                                <Tabs.List className="flex bg-slate-100/50 p-2 rounded-2xl w-fit border border-slate-200/50 backdrop-blur-sm">
                                    <Tabs.Trigger value="points" className="px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 text-slate-400 flex items-center gap-2">
                                        <Settings2 className="w-4 h-4" /> Grade Points
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="classes" className="px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 text-slate-400 flex items-center gap-2">
                                        <Trophy className="w-4 h-4" /> degree class
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="assignment" className="px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 text-slate-400 flex items-center gap-2">
                                        <History className="w-4 h-4" /> session mapping
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="policies" className="px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 text-slate-400 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> Global Policies
                                    </Tabs.Trigger>
                                </Tabs.List>

                                <Tabs.Content value="points" className="space-y-6 outline-none">
                                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden">
                                        <CardHeader className="p-10 bg-slate-900 text-white flex flex-row justify-between items-center">
                                            <div>
                                                <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Grade Calculation Rules</CardTitle>
                                                <p className="text-white/40 font-bold uppercase tracking-widest text-[9px] mt-1">Map percentage scores to quality points</p>
                                            </div>
                                            <Button onClick={addPointRow} variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl font-black uppercase text-[10px] tracking-widest px-6">
                                                <Plus className="w-4 h-4 mr-2" /> Add Level
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-100">
                                                            <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Grade</th>
                                                            <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Score Range</th>
                                                            <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Points</th>
                                                            <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {points.map((p, i) => (
                                                            <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                                                <td className="px-8 py-6">
                                                                    <Input
                                                                        value={p.letterGrade}
                                                                        onChange={e => {
                                                                            const n = [...points];
                                                                            n[i].letterGrade = e.target.value;
                                                                            setPoints(n);
                                                                        }}
                                                                        className="w-20 rounded-xl font-black text-center text-indigo-600 border-slate-200"
                                                                    />
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <Input
                                                                            type="number"
                                                                            value={isNaN(p.minMark) ? "" : p.minMark}
                                                                            onChange={e => {
                                                                                const n = [...points];
                                                                                n[i].minMark = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                                                setPoints(n);
                                                                            }}
                                                                            className="w-24 rounded-xl font-bold border-slate-200"
                                                                        />
                                                                        <span className="text-slate-300 font-bold">—</span>
                                                                        <Input
                                                                            type="number"
                                                                            value={isNaN(p.maxMark) ? "" : p.maxMark}
                                                                            onChange={e => {
                                                                                const n = [...points];
                                                                                n[i].maxMark = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                                                setPoints(n);
                                                                            }}
                                                                            className="w-24 rounded-xl font-bold border-slate-200"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <Input
                                                                        type="number" step="0.01"
                                                                        value={p.points}
                                                                        onChange={e => {
                                                                            const n = [...points];
                                                                            n[i].points = e.target.value;
                                                                            setPoints(n);
                                                                        }}
                                                                        className="w-24 rounded-xl font-black text-emerald-600 border-slate-200"
                                                                    />
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <Button
                                                                        onClick={() => setPoints(points.filter((_, idx) => idx !== i))}
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {points.length === 0 && (
                                                <div className="p-20 text-center opacity-40">
                                                    <p className="font-black italic uppercase text-slate-400">No Grading Rules Defined</p>
                                                </div>
                                            )}
                                            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end">
                                                <Button
                                                    onClick={handleSavePoints}
                                                    className="bg-slate-900 hover:bg-slate-950 text-white font-black px-12 py-7 rounded-[1.5rem] shadow-2xl flex gap-3 uppercase text-xs tracking-widest"
                                                >
                                                    <Save className="w-5 h-5" /> Commit Ruleset
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Tabs.Content>

                                <Tabs.Content value="classes" className="space-y-6 outline-none">
                                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden">
                                        <CardHeader className="p-10 bg-indigo-600 text-white flex flex-row justify-between items-center">
                                            <div>
                                                <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Honours Classification</CardTitle>
                                                <p className="text-white/60 font-bold uppercase tracking-widest text-[9px] mt-1">Define award categories based on CGPA</p>
                                            </div>
                                            <Button onClick={addClassRow} variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl font-black uppercase text-[10px] tracking-widest px-6">
                                                <Plus className="w-4 h-4 mr-2" /> New Category
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-slate-50">
                                                {classes.map((c, i) => (
                                                    <div key={i} className="p-8 flex items-center gap-8 group hover:bg-slate-50/50 transition-all">
                                                        <div className="flex-1 space-y-2">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Classification Name</label>
                                                            <Input
                                                                value={c.name}
                                                                onChange={e => {
                                                                    const n = [...classes];
                                                                    n[i].name = e.target.value;
                                                                    setClasses(n);
                                                                }}
                                                                className="rounded-2xl border-slate-200 py-6 font-black italic uppercase tracking-tight"
                                                                placeholder="e.g. FIRST CLASS HONOURS"
                                                            />
                                                        </div>
                                                        <div className="w-48 space-y-2">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Min CGPA</label>
                                                            <Input
                                                                type="number" step="0.01"
                                                                value={c.minCgpa}
                                                                onChange={e => {
                                                                    const n = [...classes];
                                                                    n[i].minCgpa = e.target.value;
                                                                    setClasses(n);
                                                                }}
                                                                className="rounded-2xl border-slate-200 py-6 font-black text-amber-600"
                                                            />
                                                        </div>
                                                        <div className="w-48 space-y-2">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Max CGPA</label>
                                                            <Input
                                                                type="number" step="0.01"
                                                                value={c.maxCgpa}
                                                                onChange={e => {
                                                                    const n = [...classes];
                                                                    n[i].maxCgpa = e.target.value;
                                                                    setClasses(n);
                                                                }}
                                                                className="rounded-2xl border-slate-200 py-6 font-black text-emerald-600"
                                                            />
                                                        </div>
                                                        <Button
                                                            onClick={() => setClasses(classes.filter((_, idx) => idx !== i))}
                                                            variant="ghost"
                                                            className="text-rose-500 hover:bg-rose-50 p-6 rounded-2xl"
                                                        >
                                                            <Trash2 className="w-6 h-6" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end">
                                                <Button
                                                    onClick={handleSaveClasses}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-7 rounded-[1.5rem] shadow-2xl flex gap-3 uppercase text-xs tracking-widest"
                                                >
                                                    <Save className="w-5 h-5" /> Save Classifications
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Tabs.Content>

                                <Tabs.Content value="assignment" className="space-y-6 outline-none">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                                            <CardHeader className="p-10 border-b border-slate-50">
                                                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Assign to Academic Session</CardTitle>
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">Bind this system to students joining in a specific session</p>
                                            </CardHeader>
                                            <CardContent className="p-10 space-y-6">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Target Session</label>
                                                    <div className="flex gap-4">
                                                        <select
                                                            value={selectedSessionId}
                                                            onChange={e => setSelectedSessionId(e.target.value === "" ? "" : Number(e.target.value))}
                                                            className="rounded-2xl border border-slate-200 p-4 font-black text-sm flex-1 bg-white"
                                                        >
                                                            <option value="">Select Session...</option>
                                                            {academicSessionsList.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                        <Button
                                                            onClick={handleAssignSession}
                                                            disabled={!selectedSessionId}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-8 rounded-2xl shadow-xl flex gap-3 uppercase text-[10px] tracking-widest disabled:opacity-50"
                                                        >
                                                            Map System
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-slate-900 text-white">
                                            <CardHeader className="p-10 border-b border-white/10">
                                                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Current Mappings</CardTitle>
                                                <p className="text-white/40 font-bold uppercase tracking-widest text-[9px] mt-1">Active deployments for this grading scale</p>
                                            </CardHeader>
                                            <CardContent className="p-10">
                                                <div className="space-y-4">
                                                    {(selectedSystem.sessions || []).map((s: any) => {
                                                        const sessionInfo = academicSessionsList.find(sess => sess.id === s.sessionId);
                                                        return (
                                                            <div key={s.id} className="flex justify-between items-center p-6 bg-white/5 rounded-[1.5rem] border border-white/10">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-3 bg-white/10 rounded-xl">
                                                                        <Calendar className="w-5 h-5" />
                                                                    </div>
                                                                    <span className="font-black italic text-lg uppercase">{sessionInfo?.name || "UNKNOWN SESSION"} ADMITTEES</span>
                                                                </div>
                                                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                                            </div>
                                                        );
                                                    })}
                                                    {(selectedSystem.sessions || []).length === 0 && (
                                                        <div className="p-10 text-center opacity-30 italic font-black uppercase">No Mappings Found</div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </Tabs.Content>

                                <Tabs.Content value="policies" className="space-y-6 outline-none">
                                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                                        <CardHeader className="p-10 border-b border-slate-50">
                                            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Institution Grading Policies</CardTitle>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">Configure automated rules for special cases and missed assessments</p>
                                        </CardHeader>
                                        <CardContent className="p-10 space-y-8">
                                            <div className="flex items-center justify-between p-8 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-900 text-lg">Default Proration (Pro-rata)</h4>
                                                    <p className="text-sm text-slate-500 max-w-xl">
                                                        When enabled, annual results for students who join mid-session or miss assessments for genuine reasons will be calculated based on what they actually completed, rather than penalizing them with zeros.
                                                        <br />
                                                        This affects both term totals (scaling CA/Exams) and annual averages (using dynamic divisors).
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                                                    <Button 
                                                        onClick={() => handleUpdateProrationPolicy(true)}
                                                        variant={defaultProration ? "default" : "ghost"}
                                                        className={cn("h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all", defaultProration ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400")}
                                                    >
                                                        Enabled
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleUpdateProrationPolicy(false)}
                                                        variant={!defaultProration ? "default" : "ghost"}
                                                        className={cn("h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all", !defaultProration ? "bg-slate-900 text-white shadow-lg" : "text-slate-400")}
                                                    >
                                                        Disabled
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Tabs.Content>
                            </Tabs.Root>
                        </div>
                    ) : (
                        <div className="p-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-6">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem]">
                                <Settings2 className="w-20 h-20 text-slate-200" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-300 italic uppercase italic">Select or Define a System</h3>
                                <p className="text-slate-300 font-bold text-sm mt-2 uppercase tracking-widest">Configure your institution's academic standards</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in zoom-in duration-300">
                        <CardHeader className="p-10 bg-slate-900 text-white">
                            <CardTitle className="text-3xl font-black italic uppercase tracking-tight text-center">Define Infrastructure</CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">System Name</label>
                                <Input
                                    placeholder="e.g. NUC Standard Scale"
                                    value={newSystem.name}
                                    onChange={e => setNewSystem({ ...newSystem, name: e.target.value })}
                                    className="rounded-2xl border-slate-200 py-6 font-black uppercase italic"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Scale Type</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-slate-200 font-black text-sm"
                                        value={newSystem.scale}
                                        onChange={e => setNewSystem({ ...newSystem, scale: parseInt(e.target.value) })}
                                    >
                                        <option value={4}>4.0 Point</option>
                                        <option value={5}>5.0 Point</option>
                                        <option value={7}>7.0 Point</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Type</label>
                                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                                        <input type="checkbox" className="w-5 h-5 rounded-lg" />
                                        <span className="text-xs font-black uppercase text-slate-600">Global Default</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <Button onClick={() => setIsCreating(false)} variant="ghost" className="flex-1 py-7 rounded-2xl font-black uppercase text-xs tracking-widest">Discard</Button>
                                <Button onClick={handleCreate} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-7 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Initialize</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
