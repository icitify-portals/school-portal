"use client";

import React, { useState } from "react";
import { 
    School, 
    Calendar, 
    LayoutGrid, 
    Plus, 
    Trash2, 
    Save, 
    RefreshCcw,
    Layers,
    Type,
    Clock,
    ChevronRight,
    Search
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
    updateBrandingSettings,
    updateSchoolSchedule, 
    addClassOrArm, 
    deleteStudentGroup,
    updateTerminology
} from "@/actions/settings";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
    units: any[];
    currentSession: any;
    initialSettings: Record<string, string>;
    classGroups: any[];
}

export default function InstitutionSettings({ units, currentSession, initialSettings, classGroups }: Props) {
    const [loading, setLoading] = useState(false);
    const [activeUnit, setActiveUnit] = useState<number>(units[0]?.id || 0);

    const handleSaveGeneral = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        try {
            const res = await updateBrandingSettings(data);
            if (res.success) {
                toast.success("Branding updated successfully");
            } else {
                toast.error(res.error || "Failed to update branding");
            }
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCalendar = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            const data = {
                sessionId: currentSession?.id,
                term: formData.get("term") as any,
                daysOpen: parseInt(formData.get("daysOpen") as string),
                termStart: formData.get("termStart") as string,
                termEnd: formData.get("termEnd") as string,
                nextTermStart: formData.get("nextTermStart") as string,
                unitId: activeUnit
            };
            const res = await updateSchoolSchedule(data);
            if (res.success) toast.success("Calendar updated");
            else toast.error(res.error || "Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleAddGroup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            const res = await addClassOrArm({
                unitId: activeUnit,
                name: formData.get("name") as string,
                level: parseInt(formData.get("level") as string),
                category: formData.get("category") as any,
                description: formData.get("description") as string
            });
            if (res.success) {
                toast.success("Group added");
                (e.target as HTMLFormElement).reset();
            } else toast.error(res.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async (id: number) => {
        if (!confirm("Are you sure you want to delete this group?")) return;
        setLoading(true);
        try {
            const res = await deleteStudentGroup(id);
            if (res.success) toast.success("Group deleted");
            else toast.error(res.error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTerminology = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            await Promise.all([
                updateTerminology(activeUnit, "arm_alias", formData.get("arm_alias") as string),
                updateTerminology(activeUnit, "class_alias", formData.get("class_alias") as string),
                updateTerminology(activeUnit, "arm_names", formData.get("arm_names") as string)
            ]);
            toast.success("Terminology updated");
        } catch (e) {
            toast.error("Failed to update terminology");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <School className="text-white w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Parameters</h1>
                        <p className="text-slate-500 font-medium text-sm">Configure school-wide structure, terminology, and calendar.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <div className="px-4 py-1.5 bg-white rounded-xl shadow-sm border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Active Session</span>
                        <span className="text-sm font-black text-slate-900">{currentSession?.name || "None"}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <RefreshCcw className="w-4 h-4 text-slate-400" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="structure" className="space-y-8">
                <TabsList className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 h-auto w-full md:w-auto grid grid-cols-2 md:flex gap-2">
                    <TabsTrigger value="structure" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all flex gap-2">
                        <Layers className="w-4 h-4" /> Structure
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-bold transition-all flex gap-2">
                        <Calendar className="w-4 h-4" /> Calendar
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold transition-all flex gap-2">
                        <Type className="w-4 h-4" /> Branding
                    </TabsTrigger>
                    <TabsTrigger value="publishing" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white font-bold transition-all flex gap-2">
                        <Save className="w-4 h-4" /> Publishing
                    </TabsTrigger>
                    <TabsTrigger value="terminology" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-rose-600 data-[state=active]:text-white font-bold transition-all flex gap-2">
                        <Plus className="w-4 h-4" /> Features
                    </TabsTrigger>
                </TabsList>

                {/* STRUCTURE TAB */}
                <TabsContent value="structure" className="mt-0 ring-offset-transparent focus-visible:outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Units Navigation */}
                        <div className="lg:col-span-4 space-y-4">
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <LayoutGrid className="w-5 h-5 text-indigo-600" /> Academic Levels
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-2">
                                    <div className="space-y-1">
                                        {units.map((unit) => (
                                            <button
                                                key={unit.id}
                                                onClick={() => setActiveUnit(unit.id)}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold ${
                                                    activeUnit === unit.id 
                                                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" 
                                                    : "hover:bg-slate-50 text-slate-600"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeUnit === unit.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                                                        <School className="w-4 h-4" />
                                                    </div>
                                                    <span>{unit.name}</span>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 transition-transform ${activeUnit === unit.id ? "rotate-90" : "opacity-0"}`} />
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100 bg-indigo-600 text-white">
                                <CardContent className="p-6 space-y-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg">Define Terminology</h3>
                                        <p className="text-white/70 text-sm font-medium">Use the Terminology tab to change "Arms" to "Houses" or "Groups" globally.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    Classes & Groups in <span className="text-indigo-600">{units.find(u => u.id === activeUnit)?.name}</span>
                                </h2>
                            </div>

                            {/* Quick Add Form */}
                            <Card className="border-none shadow-sm rounded-3xl ring-1 ring-slate-100 overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                    <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-widest">Quick Add Group</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <form onSubmit={handleAddGroup} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500">Name (e.g. Primary 1A)</Label>
                                            <Input name="name" required className="rounded-xl border-slate-200" placeholder="Name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500">Academic Level</Label>
                                            <Input name="level" type="number" required className="rounded-xl border-slate-200" placeholder="1" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500">Category</Label>
                                            <Select name="category" defaultValue="arm">
                                                <SelectTrigger className="rounded-xl border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="arm">Arm / Group</SelectItem>
                                                    <SelectItem value="class">General Class</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="submit" disabled={loading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10 font-bold">
                                            <Plus className="w-4 h-4 mr-2" /> Add
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {classGroups.filter(g => g.unitId === activeUnit).map((group) => (
                                    <Card key={group.id} className="border-none shadow-sm rounded-3xl group hover:shadow-md transition-all ring-1 ring-slate-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        {group.level}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900">{group.name}</h4>
                                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{group.description || "Active Group"}</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    onClick={() => handleDeleteGroup(group.id)}
                                                    disabled={loading}
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-xl text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase">Primary Arm: {group.primaryArm || "None"}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* CALENDAR TAB */}
                <TabsContent value="calendar" className="mt-0 ring-offset-transparent focus-visible:outline-none">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
                        <CardHeader className="bg-amber-50/50 border-b border-amber-100/50 p-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
                                    <Clock className="text-white w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-slate-900">Academic Schedule</CardTitle>
                                    <CardDescription className="text-slate-500 font-medium italic">Define term windows and operational days for reports.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleUpdateCalendar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700">Active Term</Label>
                                    <Select name="term" defaultValue="1">
                                        <SelectTrigger className="rounded-2xl border-slate-200 h-12 focus:ring-amber-500 bg-slate-50/50">
                                            <SelectValue placeholder="Select Term" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">First Term</SelectItem>
                                            <SelectItem value="2">Second Term</SelectItem>
                                            <SelectItem value="3">Third Term</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700">Total School Days</Label>
                                    <Input name="daysOpen" type="number" className="rounded-2xl border-slate-200 h-12 focus:ring-amber-500 bg-slate-50/50" placeholder="e.g. 105" />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700">Term Start Date</Label>
                                    <Input name="termStart" type="date" className="rounded-2xl border-slate-200 h-12 focus:ring-amber-500 bg-slate-50/50" />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700">Term End Date</Label>
                                    <Input name="termEnd" type="date" className="rounded-2xl border-slate-200 h-12 focus:ring-amber-500 bg-slate-50/50" />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700">Resumption Date (Next)</Label>
                                    <Input name="nextTermStart" type="date" className="rounded-2xl border-slate-200 h-12 focus:ring-amber-500 bg-slate-50/50" />
                                </div>

                                <div className="md:col-span-full flex justify-end pt-6">
                                    <Button type="submit" disabled={loading} className="rounded-2xl bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100 px-8 h-14 font-black text-lg gap-2">
                                        <Save className="w-5 h-5" /> Save Calendar Parameters
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* BRANDING TAB */}
                <TabsContent value="branding" className="mt-0 ring-offset-transparent focus-visible:outline-none">
                     <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
                        <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-8">
                            <CardTitle className="text-2xl font-black text-slate-900">Visual Identity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700">School Legal Name</Label>
                                    <Input name="INST_NAME" defaultValue={initialSettings?.portal_name || initialSettings?.INST_NAME} className="rounded-2xl border-slate-200 h-12 bg-slate-50/50" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700">Official Motto</Label>
                                    <Input name="INST_MOTTO" defaultValue={initialSettings?.school_motto || initialSettings?.INST_MOTTO} className="rounded-2xl border-slate-200 h-12 bg-slate-50/50" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700">Primary Branding Color</Label>
                                    <div className="flex gap-2">
                                        <Input name="COLOR_PRIMARY" type="color" defaultValue={initialSettings?.primary_color || initialSettings?.COLOR_PRIMARY || "#4f46e5"} className="w-20 rounded-xl h-12 p-1" />
                                        <Input name="COLOR_PRIMARY_TEXT" defaultValue={initialSettings?.primary_color || initialSettings?.COLOR_PRIMARY} className="rounded-2xl border-slate-200 h-12 bg-slate-50/50 flex-1" />
                                    </div>
                                </div>
                                <div className="md:col-span-full flex justify-end">
                                    <Button type="submit" disabled={loading} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 px-8 h-12 font-black gap-2">
                                        <Save className="w-5 h-5" /> Update Branding
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TERMINOLOGY TAB */}
                <TabsContent value="terminology" className="mt-0 ring-offset-transparent focus-visible:outline-none">
                     <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
                        <CardHeader className="bg-rose-50/50 border-b border-rose-100/50 p-8">
                            <CardTitle className="text-2xl font-black text-slate-900">Level Specific Terminology</CardTitle>
                            <CardDescription>Customize naming for {units.find(u => u.id === activeUnit)?.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSaveTerminology} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700">What do you call 'Classes'?</Label>
                                    <Input name="class_alias" defaultValue={initialSettings[`unit_${activeUnit}_class_alias`] || "Class"} className="rounded-2xl border-slate-200 h-12 bg-slate-50/50" placeholder="e.g. Grade, Form, Level" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700">What do you call 'Arms'?</Label>
                                    <Input name="arm_alias" defaultValue={initialSettings[`unit_${activeUnit}_arm_alias`] || "Arm"} className="rounded-2xl border-slate-200 h-12 bg-slate-50/50" placeholder="e.g. Group, House, Section" />
                                </div>
                                <div className="md:col-span-full space-y-3">
                                    <Label className="text-sm font-black text-slate-700">Predefined Arm Names (Semicolon separated)</Label>
                                    <Input name="arm_names" defaultValue={initialSettings[`unit_${activeUnit}_arm_names`] || "A ; B ; C ; D"} className="rounded-2xl border-slate-200 h-12 bg-slate-50/50" placeholder="e.g. Gold ; Silver ; Topaz" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">These will appear as suggestions when creating new groups.</p>
                                </div>
                                <div className="md:col-span-full flex justify-end">
                                    <Button type="submit" disabled={loading} className="rounded-2xl bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100 px-8 h-12 font-black gap-2">
                                        <Save className="w-5 h-5" /> Save Terminology
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
