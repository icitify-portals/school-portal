"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    FileText,
    Globe,
    Trash2,
    ChevronRight,
    Search,
    Loader2,
    Database,
    CheckSquare,
    Square,
    BookOpen
} from "lucide-react";
import Link from "next/link";
import { getFormTemplates, saveFormTemplate, deleteFormTemplate, bulkDeleteFormTemplates, getTemplateProgrammes, linkProgrammesToTemplate } from "@/actions/admission_v2";
import { getFeeStructures } from "@/actions/bursary";
import { seedAdmissionTemplates } from "@/actions/admission_seeder";
import { getProgrammes } from "@/actions/programmes";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdmissionBuilderPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [linkModalTemplateId, setLinkModalTemplateId] = useState<number | null>(null);
    const [allProgrammes, setAllProgrammes] = useState<any[]>([]);
    const [templateProgrammeIds, setTemplateProgrammeIds] = useState<number[]>([]);
    const [savingLinks, setSavingLinks] = useState(false);

    const openLinkModal = async (templateId: number) => {
        const [progs, linked] = await Promise.all([
            getProgrammes(),
            getTemplateProgrammes(templateId),
        ]);
        setAllProgrammes(progs);
        setTemplateProgrammeIds(linked.map((p: any) => p.id));
        setLinkModalTemplateId(templateId);
    };

    const handleSaveLinks = async () => {
        if (!linkModalTemplateId) return;
        setSavingLinks(true);
        const res = await linkProgrammesToTemplate(linkModalTemplateId, templateProgrammeIds);
        if (res.success) {
            toast.success("Programmes linked successfully!");
            setLinkModalTemplateId(null);
        } else {
            toast.error(res.error || "Failed to link programmes");
        }
        setSavingLinks(false);
    };

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
        applicationFee: "0",
        processingFee: "0",
        flowType: "form_first"
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

    const [togglingId, setTogglingId] = useState<number | null>(null);
    const handleToggleActive = async (template: any) => {
        setTogglingId(template.id);
        const res = await saveFormTemplate({ ...template, id: template.id, isActive: !template.isActive });
        if (res.success) {
            toast.success(!template.isActive ? `"${template.name}" is now live.` : `"${template.name}" taken offline.`);
            fetchTemplates();
        } else {
            toast.error(res.error || "Failed to update template status");
        }
        setTogglingId(null);
    };

    const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

    const handleDuplicate = async (template: any) => {
        if (!confirm(`Duplicate "${template.name}"? This will copy all sections and fields.`)) return;
        setDuplicatingId(template.id);
        const res = await cloneFormTemplate(template.id);
        if (res.success) {
            toast.success(`"${template.name}" duplicated successfully!`);
            fetchTemplates();
        } else {
            toast.error(res.error || "Failed to duplicate template");
        }
        setDuplicatingId(null);
    };

    const handleDelete = async (template: any) => {
        if (!confirm(`Delete "${template.name}"? This will also remove all its sections and fields.`)) return;
        setDeletingId(template.id);
        const res = await deleteFormTemplate(template.id);
        if (res.success) {
            toast.success(`"${template.name}" deleted.`);
            setSelectedIds(prev => prev.filter(id => id !== template.id));
            fetchTemplates();
        } else {
            toast.error(res.error || "Failed to delete template");
        }
        setDeletingId(null);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.length} template(s) and all their sections/fields?`)) return;
        setBulkDeleting(true);
        const res = await bulkDeleteFormTemplates(selectedIds);
        if (res.success) {
            toast.success(`${selectedIds.length} template(s) deleted.`);
            setSelectedIds([]);
            fetchTemplates();
        } else {
            toast.error(res.error || "Failed to delete templates");
        }
        setBulkDeleting(false);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredTemplates.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTemplates.map(t => t.id));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await saveFormTemplate({
            ...newData,
            feeStructureId: newData.feeStructureId ? parseInt(newData.feeStructureId) : null,
            startDate: new Date(newData.startDate),
            endDate: new Date(newData.endDate),
            applicationFee: parseFloat(newData.applicationFee),
            processingFee: parseFloat(newData.processingFee),
            isActive: true
        });
        if (res.success) {
            toast.success(`"${newData.name}" template created successfully!`);
            setShowCreateModal(false);
            setNewData({
                name: "",
                level: "primary",
                slug: "",
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                feeStructureId: "",
                applicationFee: "0",
                processingFee: "0",
                flowType: "form_first"
            });
            fetchTemplates();
        } else {
            toast.error(res.error || "Failed to create template");
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

            {selectedIds.length > 0 && (
                <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
                    <span className="text-sm font-bold text-red-700">{selectedIds.length} selected</span>
                    <Button
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-xs flex gap-2"
                    >
                        {bulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Delete Selected
                    </Button>
                    <Button
                        onClick={() => setSelectedIds([])}
                        variant="ghost"
                        className="text-slate-500 font-bold text-xs"
                    >
                        Clear
                    </Button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="text-center p-20 text-slate-400 font-bold">
                    {search ? `No templates matching "${search}"` : "No templates yet. Click 'New Form Template' to create one."}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <Card key={template.id} className={cn(
                            "border-none shadow-xl rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500",
                            selectedIds.includes(template.id) && "ring-2 ring-indigo-500"
                        )}>
                            <CardHeader className={cn(
                                "p-8 text-white relative",
                                template.level === 'primary' ? 'bg-blue-600' :
                                template.level === 'secondary' ? 'bg-emerald-600' : 'bg-rose-600'
                            )}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleSelect(template.id)}
                                            className="text-white/80 hover:text-white transition-colors"
                                        >
                                            {selectedIds.includes(template.id) ? (
                                                <CheckSquare className="w-5 h-5" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                                            {template.level} LEVEL
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDuplicate(template)}
                                            disabled={duplicatingId === template.id}
                                            className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
                                            title="Duplicate template"
                                        >
                                            {duplicatingId === template.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Layers className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(template)}
                                            disabled={deletingId === template.id}
                                            className="text-white/60 hover:text-red-200 transition-colors disabled:opacity-50"
                                            title="Delete template"
                                        >
                                            {deletingId === template.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActive(template)}
                                            disabled={togglingId === template.id}
                                            title={template.isActive ? "Click to take this form offline" : "Click to activate this form"}
                                            className="disabled:opacity-60"
                                        >
                                            {togglingId === template.id ? (
                                                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Saving
                                                </span>
                                            ) : template.isActive ? (
                                                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full hover:bg-black/30 transition-colors">
                                                    Draft
                                                </span>
                                            )}
                                        </button>
                                    </div>
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
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">App. Fee</p>
                                        <p className="text-lg font-black text-slate-900">₦{parseFloat(template.applicationFee || "0").toLocaleString()}</p>
                                        {parseFloat(template.processingFee || "0") > 0 && (
                                            <p className="text-[10px] font-bold text-indigo-600">+ ₦{parseFloat(template.processingFee).toLocaleString()} processing</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => openLinkModal(template.id)}
                                            variant="outline"
                                            className="rounded-2xl border-slate-200 text-slate-600 font-black px-4 py-4 flex gap-2 text-[10px] uppercase tracking-widest"
                                        >
                                            <BookOpen className="w-4 h-4" /> Programmes
                                        </Button>
                                        <Link href={`/admin/admission/forms/${template.id}`}>
                                            <Button className="rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black px-6 py-4 flex gap-2 transition-all">
                                                Design <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
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
                            <CardTitle className="text-2xl font-black italic uppercase">Initialize Form Template</CardTitle>
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
                                        value={newData.flowType}
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
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Processing Fee (₦) <span className="text-indigo-500">— Paystack</span></label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                        value={newData.processingFee}
                                        onChange={(e) => setNewData({...newData, processingFee: e.target.value})}
                                    />
                                    <p className="text-[9px] font-bold text-slate-500 px-1">Payable via Paystack after application fee is confirmed</p>
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

            {linkModalTemplateId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase">Link Programmes</CardTitle>
                            <p className="text-slate-300 text-sm font-medium mt-1">Select which programmes are available for this form</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4 bg-white max-h-[60vh] overflow-y-auto">
                            {allProgrammes.length === 0 ? (
                                <p className="text-slate-400 text-center py-8">No programmes found. <Link href="/admin/programmes" className="text-indigo-600 underline">Create programmes first.</Link></p>
                            ) : (
                                allProgrammes.map((prog: any) => {
                                    const isSelected = templateProgrammeIds.includes(prog.id);
                                    return (
                                        <div
                                            key={prog.id}
                                            onClick={() => setTemplateProgrammeIds(prev =>
                                                isSelected ? prev.filter(id => id !== prog.id) : [...prev, prog.id]
                                            )}
                                            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                                                isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${
                                                isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                            }`}>
                                                {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900">{prog.name}</p>
                                                <p className="text-xs text-slate-500">{prog.code} — {prog.department?.name || 'No department'} ({prog.durationYears || 4} yrs)</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setLinkModalTemplateId(null)}
                                    className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveLinks}
                                    disabled={savingLinks}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                >
                                    {savingLinks ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
