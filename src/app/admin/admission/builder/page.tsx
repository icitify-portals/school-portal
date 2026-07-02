"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Plus, 
    FileText, 
    Calendar, 
    Globe, 
    Settings, 
    Trash2, 
    ChevronRight,
    Search,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { getFormTemplates, saveFormTemplate } from "@/actions/admission_v2";
import { getFeeStructures } from "@/actions/bursary";
import { seedAdmissionTemplates } from "@/actions/admission_seeder";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Sparkles, Database } from "lucide-react";

export default function AdmissionBuilderPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleSeed = async () => {
        setSeeding(true);
        const res = await seedAdmissionTemplates();
        if (res.success) {
            toast.success("Sample templates generated successfully!");
            fetchTemplates();
        } else {
            toast.error(res.error);
        }
        setSeeding(false);
    };
    const [newData, setNewData] = useState({
        name: "",
        level: "primary",
        slug: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        feeStructureId: "",
        applicationFee: "0"
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [templatesData, structuresData] = await Promise.all([
            getFormTemplates(),
            getFeeStructures()
        ]);
        setTemplates(templatesData);
        setFeeStructures(structuresData);
        setLoading(false);
    };

    const fetchTemplates = async () => {
        const data = await getFormTemplates();
        setTemplates(data);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await saveFormTemplate({
            ...newData,
            feeStructureId: newData.feeStructureId ? parseInt(newData.feeStructureId) : null,
            startDate: new Date(newData.startDate),
            endDate: new Date(newData.endDate),
            applicationFee: parseFloat(newData.applicationFee),
            isActive: true
        });
        if (res.success) {
            setShowCreateModal(false);
            fetchTemplates();
        }
    };

    const filteredTemplates = templates.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
                        <FileText className="w-10 h-10 text-indigo-600" />
                        ADMISSION BUILDER
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Design and deploy highly dynamic application forms</p>
                </div>
                <div className="flex gap-4">
                    <Button 
                        onClick={handleSeed}
                        disabled={seeding}
                        variant="outline"
                        className="border-slate-200 text-slate-600 font-black px-6 py-6 rounded-2xl shadow-sm transition-all flex gap-3 uppercase text-[10px] tracking-widest"
                    >
                        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Database className="w-4 h-4" /> Seed Sample Templates</>}
                    </Button>
                    <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-slate-900 text-white font-black px-6 py-6 rounded-2xl shadow-lg shadow-slate-100 transition-all hover:scale-105 flex gap-3 uppercase text-[10px] tracking-widest"
                    >
                        <Plus className="w-4 h-4" /> New Form Template
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                    className="w-full pl-12 pr-4 py-6 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-lg"
                    placeholder="Search templates by name or URL slug..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <Card key={template.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500">
                            <CardHeader className={cn(
                                "p-8 text-white relative",
                                template.level === 'primary' ? 'bg-blue-600' : 
                                template.level === 'secondary' ? 'bg-emerald-600' : 'bg-rose-600'
                            )}>
                                <div className="flex justify-between items-start">
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        {template.level} LEVEL
                                    </span>
                                    {template.isActive ? (
                                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full">
                                            Draft
                                        </span>
                                    )}
                                </div>
                                <CardTitle className="text-2xl font-black mt-4 italic uppercase">{template.name}</CardTitle>
                                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> /admission/{template.slug}
                                </p>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6 bg-white">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Date</p>
                                        <p className="text-xs font-bold text-slate-700">{format(new Date(template.startDate), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Date</p>
                                        <p className="text-xs font-bold text-slate-700">{format(new Date(template.endDate), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fee</p>
                                        <p className="text-lg font-black text-slate-900">₦{template.applicationFee.toLocaleString()}</p>
                                    </div>
                                    <Link href={`/admin/admission/builder/${template.id}`}>
                                        <Button className="rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black px-6 py-4 flex gap-2 transition-all">
                                            Design <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase italic">Initialize Form Template</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 bg-white">
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Form Name</label>
                                    <input 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. 2026/2027 Primary Intake"
                                        value={newData.name}
                                        onChange={(e) => setNewData({...newData, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Level</label>
                                        <select 
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                            value={newData.level}
                                            onChange={(e) => setNewData({...newData, level: e.target.value})}
                                        >
                                            <option value="primary">Primary</option>
                                            <option value="secondary">Secondary</option>
                                            <option value="tertiary">Tertiary</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">URL Slug</label>
                                        <input 
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="primary-2026"
                                            value={newData.slug}
                                            onChange={(e) => setNewData({...newData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Start Date</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={newData.startDate}
                                            onChange={(e) => setNewData({...newData, startDate: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">End Date</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={newData.endDate}
                                            onChange={(e) => setNewData({...newData, endDate: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Payment Structure</label>
                                    <select 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                        value={newData.feeStructureId}
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const selectedStruct = feeStructures.find(fs => fs.id.toString() === selectedId);
                                            setNewData({
                                                ...newData, 
                                                feeStructureId: selectedId,
                                                applicationFee: selectedStruct ? selectedStruct.totalAmount.toString() : "0"
                                            });
                                        }}
                                        required
                                    >
                                        <option value="">Select Bursary Fee Structure...</option>
                                        {feeStructures.map(fs => (
                                            <option key={fs.id} value={fs.id}>{fs.name} (₦{parseFloat(fs.totalAmount).toLocaleString()})</option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] font-bold text-slate-500 px-1">Links to Remita Split Payment Engine</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Intake Flow Configuration</label>
                                    <select 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                        // @ts-expect-error - TS2339: Auto-suppressed for build
                                        value={newData.flowType || "form_first"}
                                        // @ts-expect-error - TS2353: Auto-suppressed for build
                                        onChange={(e) => setNewData({...newData, flowType: e.target.value})}
                                        required
                                    >
                                        <option value="form_first">Form First (Pay before submission)</option>
                                        <option value="payment_first">Payment First (Pay before filling form)</option>
                                        <option value="free_form">Free Form (No payment required)</option>
                                    </select>
                                    <p className="text-[9px] font-bold text-slate-500 px-1">Controls the applicant portal experience</p>
                                </div>
                                <div className="space-y-2 hidden">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Application Fee (₦)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                        value={newData.applicationFee}
                                        onChange={(e) => setNewData({...newData, applicationFee: e.target.value})}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button 
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        Create Template
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
