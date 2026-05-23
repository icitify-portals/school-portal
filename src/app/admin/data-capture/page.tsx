"use client";

import { useState } from "react";
import {
    Upload,
    FileText,
    Users,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowRight,
    ShieldCheck,
    Sparkles,
    Trash2,
    Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { extractProspectusData, commitCapturedData } from "@/actions/admin-data-capture";
import { cn } from "@/lib/utils";

export default function DataCapturePage() {
    const [step, setStep] = useState<"upload" | "review" | "success">("upload");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);
    const [capturedData, setCapturedData] = useState<{ courses: any[], lecturers: any[] }>({ courses: [], lecturers: [] });
    const [fileName, setFileName] = useState("");

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);

        const formData = new FormData();
        formData.append("file", file);

        const res = await extractProspectusData(formData);

        if (res.success && res.data) {
            setCapturedData(res.data);
            setStep("review");
            toast.success("AI Analysis Complete");
        } else {
            toast.error(res.error || "Failed to process document");
        }
        setIsProcessing(false);
    }

    async function handleCommit() {
        setIsCommitting(true);
        const res = await commitCapturedData(capturedData);
        if (res.success) {
            setStep("success");
            toast.success("Data successfully synchronized to database");
        } else {
            toast.error(res.error || "Failed to commit data");
        }
        setIsCommitting(false);
    }

    const removeItem = (type: 'courses' | 'lecturers', index: number) => {
        setCapturedData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const updateItem = (type: 'courses' | 'lecturers', index: number, field: string, value: any) => {
        setCapturedData(prev => {
            const newList = [...prev[type]];
            newList[index] = { ...newList[index], [field]: value };
            return { ...prev, [type]: newList };
        });
    };

    if (step === "success") {
        return (
            <div className="p-12 max-w-4xl mx-auto text-center space-y-8 animate-in zoom-in duration-500">
                <div className="w-32 h-32 bg-emerald-100 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
                    <ShieldCheck className="w-16 h-16 text-emerald-600" />
                </div>
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Intelligence Synchronized</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                        Your institution's prospectus data has been successfully ingested and committed to the core database.
                    </p>
                </div>
                <div className="flex justify-center gap-6 mt-12">
                    <Button onClick={() => setStep("upload")} className="h-14 px-8 bg-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                        Process Another Document
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/admin/courses'} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                        Goto Course Manager
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI-Powered Core Extraction</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Robust Data Capture</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Prospectus Ingestion & Automated Synchronization</p>
                </div>
                {step === "review" && (
                    <Button
                        onClick={handleCommit}
                        disabled={isCommitting}
                        className="h-16 px-12 bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[10px] flex gap-3 transition-all hover:scale-105"
                    >
                        {isCommitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <Save className="w-5 h-5" /> Commit to Database
                            </>
                        )}
                    </Button>
                )}
            </div>

            {step === "upload" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Upload Card */}
                    <Card className="border-none shadow-2xl rounded-[3rem] p-12 bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-indigo-100/50" />

                        <div className="space-y-8 relative">
                            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200">
                                <Upload className="w-8 h-8 text-white" />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Ingest Document</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-loose">
                                    Upload a PDF, JPEG, Excel, or Word prospectus. Our AI core will intelligently extract all academic and personnel data.
                                </p>
                            </div>

                            <div className="relative border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 text-center transition-all hover:border-indigo-200 hover:bg-slate-50/50">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    disabled={isProcessing}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv,.docx"
                                />
                                <div className="space-y-4">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                        {isProcessing ? <Loader2 className="w-6 h-6 animate-spin text-indigo-600" /> : <FileText className="w-6 h-6 text-slate-400" />}
                                    </div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                        {isProcessing ? "Analyzing Document Architecture..." : "Click or Drop Prospectus Here"}
                                    </p>
                                </div>
                            </div>

                            {/* Sample Links */}
                            <div className="pt-4 border-t border-slate-50">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Test Assets / Samples</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <a href="/samples/courses_sample.csv" download className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 hover:bg-slate-100 transition-all border border-transparent hover:border-indigo-100">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                        <span className="text-[9px] font-bold text-slate-600">Courses CSV</span>
                                    </a>
                                    <a href="/samples/staff_sample.csv" download className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 hover:bg-slate-100 transition-all border border-transparent hover:border-indigo-100">
                                        <Users className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[9px] font-bold text-slate-600">Staff CSV</span>
                                    </a>
                                    <a href="/samples/prospectus_sample.md" download className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 hover:bg-slate-100 transition-all border border-transparent hover:border-indigo-100">
                                        <BookOpen className="w-4 h-4 text-amber-500" />
                                        <span className="text-[9px] font-bold text-slate-600">Prospectus Doc</span>
                                    </a>
                                    <a href="/samples/students_sample.csv" download className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 hover:bg-slate-100 transition-all border border-transparent hover:border-indigo-100">
                                        <Users className="w-4 h-4 text-purple-500" />
                                        <span className="text-[9px] font-bold text-slate-600">Students CSV</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Info Section */}
                    <div className="space-y-8 flex flex-col justify-center">
                        <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50 space-y-4">
                            <h4 className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-indigo-600">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" /> Multimodal Engine
                            </h4>
                            <p className="text-[11px] font-bold text-slate-600 uppercase leading-relaxed tracking-tight">
                                Gemini 1.5 Flash processing enabled. Supports vision-based extraction for tables and OCR from complex document layouts.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { icon: BookOpen, label: "Full Curriculums" },
                                { icon: Users, label: "Lecturer Directory" },
                                { icon: Sparkles, label: "Auto-Mapping" },
                                { icon: ShieldCheck, label: "Data Integrity" },
                            ].map((item, i) => (
                                <div key={i} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 flex items-center gap-4 transition-all hover:scale-105">
                                    <item.icon className="w-5 h-5 text-indigo-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div >
            ) : (
                <div className="animate-in slide-in-from-right-12 duration-700">
                    <Tabs defaultValue="courses" className="space-y-8">
                        <div className="flex items-center justify-between gap-8">
                            <TabsList className="bg-slate-100 h-16 p-2 rounded-2xl flex-1">
                                <TabsTrigger value="courses" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">
                                    <BookOpen className="w-4 h-4 mr-2" /> Extracted Courses ({capturedData.courses.length})
                                </TabsTrigger>
                                <TabsTrigger value="lecturers" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">
                                    <Users className="w-4 h-4 mr-2" /> Extracted Personnel ({capturedData.lecturers.length})
                                </TabsTrigger>
                                <TabsTrigger value="raw" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">
                                    <FileText className="w-4 h-4 mr-2" /> Raw Intel
                                </TabsTrigger>
                            </TabsList>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing</p>
                                <p className="text-xs font-bold text-slate-900 truncate max-w-[200px] italic">{fileName}</p>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 border-none shadow-xl bg-indigo-600 text-white rounded-[2rem] space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Items</p>
                                <h4 className="text-3xl font-black tracking-tighter">{capturedData.courses.length + capturedData.lecturers.length}</h4>
                            </Card>
                            <Card className="p-6 border-none shadow-xl bg-white rounded-[2rem] space-y-2 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course Load</p>
                                <h4 className="text-3xl font-black tracking-tighter text-slate-900">{capturedData.courses.length}</h4>
                            </Card>
                            <Card className="p-6 border-none shadow-xl bg-white rounded-[2rem] space-y-2 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personnel Found</p>
                                <h4 className="text-3xl font-black tracking-tighter text-slate-900">{capturedData.lecturers.length}</h4>
                            </Card>
                        </div>

                        <TabsContent value="courses">
                            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                                <ScrollArea className="h-[600px] w-full">
                                    <div className="p-8 space-y-4">
                                        <table className="w-full">
                                            <thead className="border-b border-slate-50">
                                                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                    <th className="px-4 py-6 text-left">Code</th>
                                                    <th className="px-4 py-6 text-left">Title</th>
                                                    <th className="px-4 py-6 text-left">Units</th>
                                                    <th className="px-4 py-6 text-left">Level</th>
                                                    <th className="px-4 py-6 text-left">Sem.</th>
                                                    <th className="px-4 py-6 text-left">Status</th>
                                                    <th className="px-4 py-6 text-left">Dept. Code</th>
                                                    <th className="px-4 py-6 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 italic">
                                                {capturedData.courses.map((course, i) => (
                                                    <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                value={course.code}
                                                                onChange={(e) => updateItem('courses', i, 'code', e.target.value)}
                                                                className="h-10 rounded-xl font-black text-[11px] uppercase border-transparent group-hover:border-slate-200"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                value={course.name}
                                                                onChange={(e) => updateItem('courses', i, 'name', e.target.value)}
                                                                className="h-10 rounded-xl font-bold text-[11px] border-transparent group-hover:border-slate-200"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                type="number"
                                                                value={course.creditUnits}
                                                                onChange={(e) => updateItem('courses', i, 'creditUnits', e.target.value)}
                                                                className="h-10 w-16 rounded-xl font-bold text-[11px] border-transparent group-hover:border-slate-200"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                type="number"
                                                                value={course.level}
                                                                onChange={(e) => updateItem('courses', i, 'level', e.target.value)}
                                                                className="h-10 w-16 rounded-xl font-bold text-[11px] border-transparent group-hover:border-slate-200"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                value={course.semester}
                                                                onChange={(e) => updateItem('courses', i, 'semester', e.target.value)}
                                                                className="h-10 w-12 rounded-xl font-bold text-[11px] border-transparent group-hover:border-slate-200"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <select
                                                                value={course.status}
                                                                onChange={(e) => updateItem('courses', i, 'status', e.target.value)}
                                                                className="h-10 w-24 rounded-xl font-bold text-[11px] border-transparent bg-transparent group-hover:border-slate-200 focus:outline-none"
                                                            >
                                                                <option value="compulsory">Compulsory</option>
                                                                <option value="elective">Elective</option>
                                                                <option value="required">Required</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                value={course.departmentCode}
                                                                onChange={(e) => updateItem('courses', i, 'departmentCode', e.target.value)}
                                                                className="h-10 w-24 rounded-xl font-black text-[11px] uppercase border-transparent group-hover:border-slate-200"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeItem('courses', i)}
                                                                className="text-slate-300 hover:text-rose-500 rounded-xl"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </ScrollArea>
                            </Card>
                        </TabsContent>

                        <TabsContent value="lecturers">
                            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                                <ScrollArea className="h-[600px] w-full">
                                    <div className="p-8 space-y-4">
                                        <table className="w-full">
                                            <thead className="border-b border-slate-50">
                                                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                    <th className="px-4 py-6 text-left">First Name</th>
                                                    <th className="px-4 py-6 text-left">Last Name</th>
                                                    <th className="px-4 py-6 text-left">Job Title</th>
                                                    <th className="px-4 py-6 text-left">Email</th>
                                                    <th className="px-4 py-6 text-left">Dept. Code</th>
                                                    <th className="px-4 py-6 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 italic">
                                                {capturedData.lecturers.map((lecturer, i) => (
                                                    <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                value={lecturer.firstName}
                                                                onChange={(e) => updateItem('lecturers', i, 'firstName', e.target.value)}
                                                                className="h-10 rounded-xl font-bold text-[11px] border-transparent group-hover:border-slate-200"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                value={lecturer.lastName}
                                                                onChange={(e) => updateItem('lecturers', i, 'lastName', e.target.value)}
                                                                className="h-10 rounded-xl font-bold text-[11px] border-transparent group-hover:border-slate-200"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                value={lecturer.jobTitle}
                                                                onChange={(e) => updateItem('lecturers', i, 'jobTitle', e.target.value)}
                                                                className="h-10 rounded-xl font-bold text-[11px] border-transparent group-hover:border-slate-200"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                value={lecturer.email}
                                                                onChange={(e) => updateItem('lecturers', i, 'email', e.target.value)}
                                                                className="h-10 rounded-xl font-bold text-[11px] border-transparent group-hover:border-slate-200 lowercase"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <Input
                                                                value={lecturer.departmentCode}
                                                                onChange={(e) => updateItem('lecturers', i, 'departmentCode', e.target.value)}
                                                                className="h-10 w-24 rounded-xl font-black text-[11px] uppercase border-transparent group-hover:border-slate-200"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-6 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeItem('lecturers', i)}
                                                                className="text-slate-300 hover:text-rose-500 rounded-xl"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </ScrollArea>
                            </Card>
                        </TabsContent>

                        <TabsContent value="raw">
                            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-slate-900 p-8">
                                <ScrollArea className="h-[600px] w-full">
                                    <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
                                        {JSON.stringify(capturedData, null, 4)}
                                    </pre>
                                </ScrollArea>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )
            }
        </div >
    );
}
