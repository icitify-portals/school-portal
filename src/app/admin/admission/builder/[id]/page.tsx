"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Plus, 
    GripVertical, 
    Trash2, 
    Settings, 
    ChevronLeft,
    Save,
    Eye,
    Check,
    X,
    Type,
    List,
    Calendar,
    FileUp,
    Hash,
    Mail,
    Phone,
    Layout,
    CheckSquare,
    CircleDot,
    Clock,
    LinkIcon
} from "lucide-react";
import Link from "next/link";
import { 
    getFormTemplate, 
    saveFormTemplate, 
    saveFormSection, 
    deleteFormSection,
    saveFormField,
    deleteFormField,
    updateFieldsOrder,
    updateSectionsOrder
} from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";

const FIELD_TYPES = [
    { label: "Short Text", value: "text", icon: Type },
    { label: "Long Text", value: "textarea", icon: Layout },
    { label: "Select List", value: "select", icon: List },
    { label: "Nationality Dropdown", value: "nationality", icon: List },
    { label: "State of Origin Dropdown", value: "state", icon: List },
    { label: "L.G.A Dropdown", value: "lga", icon: List },
    { label: "Date", value: "date", icon: Calendar },
    { label: "Number", value: "number", icon: Hash },
    { label: "Email", value: "email", icon: Mail },
    { label: "Phone", value: "phone", icon: Phone },
    { label: "Time", value: "time", icon: Clock },
    { label: "URL", value: "url", icon: LinkIcon },
    { label: "Radio Buttons", value: "radio", icon: CircleDot },
    { label: "Checkbox (Single)", value: "checkbox", icon: CheckSquare },
    { label: "Checkbox Group", value: "checkbox_group", icon: CheckSquare },
    { label: "File Upload", value: "file", icon: FileUp },
    { label: "O-Level Result Grid", value: "olevel_result", icon: Layout },
];

export default function AdmissionFormBuilder() {
    const params = useParams();
    const templateId = parseInt(params.id as string);
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<number | null>(null);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsData, setSettingsData] = useState({ name: "", slug: "" });
    
    const [sectionData, setSectionData] = useState({ title: "" });
    const [fieldData, setFieldData] = useState({
        label: "",
        type: "text",
        placeholder: "",
        isRequired: false,
        options: "",
        isSystemField: false,
        systemKey: ""
    });

    useEffect(() => {
        fetchTemplate();
    }, [templateId]);

    const fetchTemplate = async () => {
        setLoading(true);
        const data = await getFormTemplate(templateId);
        setTemplate(data);
        setSettingsData({ name: data?.name || "", slug: data?.slug || "" });
        if (data?.sections?.length > 0) {
            setActiveSection(data.sections[0].id);
        }
        setLoading(false);
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await saveFormTemplate({ id: templateId, ...template, name: settingsData.name, slug: settingsData.slug });
        if (res.success) {
            setShowSettingsModal(false);
            fetchTemplate();
            toast.success("Template settings updated!");
        } else {
            toast.error(res.error || "Failed to update template");
        }
    };

    const handleSaveSection = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await saveFormSection({ 
            templateId, 
            ...sectionData, 
            order: template.sections.length 
        });
        if (res.success) {
            setShowSectionModal(false);
            setSectionData({ title: "" });
            fetchTemplate();
            toast.success("Section added successfully");
        }
    };

    const handleSaveField = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSection) return;
        const section = template.sections.find((s: any) => s.id === activeSection);
        const res = await saveFormField({
            sectionId: activeSection,
            templateId,
            ...fieldData,
            order: section.fields.length
        });
        if (res.success) {
            setShowFieldModal(false);
            setFieldData({
                label: "", type: "text", placeholder: "", isRequired: false, options: "", isSystemField: false, systemKey: ""
            });
            fetchTemplate();
            toast.success("Field added successfully");
        }
    };

    const handleOnDragEnd = async (result: any) => {
        if (!result.destination || !activeSection) return;
        
        const sectionIndex = template.sections.findIndex((s: any) => s.id === activeSection);
        const items = Array.from(template.sections[sectionIndex].fields);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedFields = items.map((item: any, index: number) => ({
            id: item.id,
            order: index
        }));

        // Optimistic update
        const newTemplate = { ...template };
        newTemplate.sections[sectionIndex].fields = items;
        setTemplate(newTemplate);

        const res = await updateFieldsOrder(updatedFields, templateId);
        if (!res.success) {
            toast.error("Failed to save field order");
            fetchTemplate();
        }
    };

    const handleSectionDragEnd = async (result: any) => {
        if (!result.destination) return;
        
        const items = Array.from(template.sections);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedSections = items.map((item: any, index: number) => ({
            id: item.id,
            order: index
        }));

        // Optimistic update
        const newTemplate = { ...template, sections: items };
        setTemplate(newTemplate);

        const res = await updateSectionsOrder(updatedSections, templateId);
        if (!res.success) {
            toast.error("Failed to save sections order");
            fetchTemplate();
        } else {
            toast.success("Page order saved!");
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><Plus className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!template) return <div className="p-20 text-center">Template not found</div>;

    const currentSection = template.sections.find((s: any) => s.id === activeSection);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-[1600px] mx-auto px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/admission/builder">
                            <Button variant="ghost" className="rounded-2xl p-4 hover:bg-slate-100">
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-900 italic uppercase">{template.name}</h1>
                                <span className="px-3 py-0.5 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    Builder Mode
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {template.level} Admission • {template.sections.length} Sections • {template.sections.reduce((acc: number, s: any) => acc + s.fields.length, 0)} Fields
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={() => setShowSettingsModal(true)} variant="outline" className="rounded-2xl border-slate-200 font-black px-6 py-6 flex gap-2 uppercase text-[10px] tracking-widest">
                            <Settings className="w-4 h-4" /> Settings
                        </Button>
                        <Button variant="outline" className="rounded-2xl border-slate-200 font-black px-6 py-6 flex gap-2 uppercase text-[10px] tracking-widest">
                            <Eye className="w-4 h-4" /> Preview
                        </Button>
                        <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-6 flex gap-2 uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">
                            <Save className="w-4 h-4" /> Deploy Changes
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-8 py-10 grid grid-cols-12 gap-8">
                {/* Sidebar: Sections */}
                <div className="col-span-3 space-y-6">
                    <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Form Pages</h3>
                            <Button onClick={() => setShowSectionModal(true)} size="sm" className="rounded-xl bg-slate-900 text-white p-2">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <DragDropContext onDragEnd={handleSectionDragEnd}>
                            <Droppable droppableId="sections">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                        {template.sections.map((section: any, index: number) => (
                                            <Draggable key={section.id.toString()} draggableId={section.id.toString()} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="group/sec flex items-center gap-2"
                                                    >
                                                        <div {...provided.dragHandleProps} className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing">
                                                            <GripVertical className="w-4 h-4" />
                                                        </div>
                                                        <button
                                                            onClick={() => setActiveSection(section.id)}
                                                            className={cn(
                                                                "flex-1 flex items-center justify-between p-5 rounded-2xl transition-all font-bold text-sm text-left truncate",
                                                                activeSection === section.id 
                                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 -translate-x-1" 
                                                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                                            )}
                                                        >
                                                            <span className="truncate max-w-[130px]">{section.title}</span>
                                                            <ChevronLeft className={cn("w-4 h-4 transition-transform shrink-0", activeSection === section.id ? "rotate-180" : "opacity-0")} />
                                                        </button>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {template.sections.length === 0 && (
                                            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No sections yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-slate-900 text-white">
                        <h3 className="text-sm font-black uppercase tracking-widest italic mb-4">Age Eligibility</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            {template.minAge 
                                ? `Candidates must be at least ${template.minAge} years old to qualify.` 
                                : "No age restriction set for this template."}
                        </p>
                        <Button className="w-full mt-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black py-4 uppercase text-[9px] tracking-widest">
                            Edit Rules
                        </Button>
                    </Card>
                </div>

                {/* Main: Field Builder */}
                <div className="col-span-9 space-y-8">
                    {currentSection ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 italic uppercase">{currentSection.title}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure fields for this step</p>
                                </div>
                                <div className="flex gap-4">
                                    <Button onClick={() => setShowFieldModal(true)} className="rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black px-8 py-6 flex gap-3 uppercase text-xs tracking-widest shadow-xl">
                                        <Plus className="w-5 h-5" /> Add Field
                                    </Button>
                                    <Button onClick={async () => {
                                        if (confirm("Are you sure? This will delete all fields in this section.")) {
                                            await deleteFormSection(currentSection.id, templateId);
                                            fetchTemplate();
                                        }
                                    }} variant="ghost" className="rounded-2xl text-rose-500 hover:bg-rose-50 p-4">
                                        <Trash2 className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>

                            <DragDropContext onDragEnd={handleOnDragEnd}>
                                <Droppable droppableId="fields">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                            {currentSection.fields.map((field: any, index: number) => (
                                                <Draggable key={field.id.toString()} draggableId={field.id.toString()} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-xl hover:border-indigo-100 transition-all"
                                                        >
                                                            <div {...provided.dragHandleProps} className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-50 transition-colors">
                                                                <GripVertical className="w-6 h-6" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-lg font-black text-slate-900 italic uppercase">{field.label}</span>
                                                                    {field.isRequired && (
                                                                        <span className="text-rose-500 font-black text-xl">*</span>
                                                                    )}
                                                                    {field.isSystemField && (
                                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-lg text-[8px] font-black uppercase">System Core</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-6 mt-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <div className="w-1 h-1 bg-slate-300 rounded-full" /> {field.type} field
                                                                    </span>
                                                                    {field.placeholder && (
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                            <div className="w-1 h-1 bg-slate-300 rounded-full" /> Hint: {field.placeholder}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" className="rounded-xl hover:bg-slate-100 p-3">
                                                                    <Settings className="w-5 h-5 text-slate-400" />
                                                                </Button>
                                                                <Button 
                                                                    onClick={async () => {
                                                                        await deleteFormField(field.id, templateId);
                                                                        fetchTemplate();
                                                                    }}
                                                                    variant="ghost" 
                                                                    className="rounded-xl hover:bg-rose-50 p-3"
                                                                >
                                                                    <Trash2 className="w-5 h-5 text-rose-400" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {currentSection.fields.length === 0 && (
                                                <div className="py-32 text-center bg-white border-4 border-dashed border-slate-50 rounded-[3rem]">
                                                    <div className="max-w-xs mx-auto space-y-4">
                                                        <div className="p-6 bg-slate-50 rounded-2xl w-fit mx-auto">
                                                            <Plus className="w-10 h-10 text-slate-200" />
                                                        </div>
                                                        <h4 className="text-xl font-black text-slate-300 italic uppercase">Empty Section</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add your first field to this step of the application.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    ) : (
                        <div className="py-48 text-center bg-white border-none shadow-xl rounded-[3rem]">
                             <div className="max-w-md mx-auto space-y-6">
                                <Layout className="w-16 h-16 text-slate-100 mx-auto" />
                                <h2 className="text-3xl font-black text-slate-900 italic uppercase">Create a Page</h2>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs leading-relaxed">Start by adding a section to your form. These act as pages in the multi-step application process.</p>
                                <Button onClick={() => setShowSectionModal(true)} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-8 uppercase text-xs tracking-widest shadow-xl shadow-indigo-100">
                                    <Plus className="w-5 h-5 mr-3" /> Add First Section
                                </Button>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[3rem] overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase italic">Add Page Section</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 bg-white">
                            <form onSubmit={handleSaveSection} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Section Title</label>
                                    <input 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. Biodata & Personal Info"
                                        value={sectionData.title}
                                        onChange={(e) => setSectionData({ title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setShowSectionModal(false)} className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest">Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest">Create Section</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showFieldModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-xl border-none shadow-2xl rounded-[3rem] overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase italic">Configure New Field</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSaveField} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Label</label>
                                        <input 
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g. Current Class"
                                            value={fieldData.label}
                                            onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Field Type</label>
                                        <select 
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                            value={fieldData.type}
                                            onChange={(e) => setFieldData({ ...fieldData, type: e.target.value })}
                                        >
                                            {FIELD_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Placeholder / Hint</label>
                                    <input 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. Enter your current school name"
                                        value={fieldData.placeholder}
                                        onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
                                    />
                                </div>

                                {fieldData.type === 'select' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Options (Comma separated)</label>
                                        <textarea 
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                                            placeholder="Option 1, Option 2, Option 3"
                                            value={fieldData.options}
                                            onChange={(e) => setFieldData({ ...fieldData, options: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <input 
                                        type="checkbox"
                                        id="isRequired"
                                        className="w-5 h-5 rounded-lg accent-indigo-600"
                                        checked={fieldData.isRequired}
                                        onChange={(e) => setFieldData({ ...fieldData, isRequired: e.target.checked })}
                                    />
                                    <label htmlFor="isRequired" className="text-xs font-black uppercase tracking-widest text-slate-700 cursor-pointer">Required Field</label>
                                </div>

                                <div className="p-6 bg-indigo-50 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="checkbox"
                                            id="isSystemField"
                                            className="w-5 h-5 rounded-lg accent-indigo-600"
                                            checked={fieldData.isSystemField}
                                            onChange={(e) => setFieldData({ ...fieldData, isSystemField: e.target.checked })}
                                        />
                                        <label htmlFor="isSystemField" className="text-xs font-black uppercase tracking-widest text-indigo-700 cursor-pointer italic">Bind to System Identity</label>
                                    </div>
                                    {fieldData.isSystemField && (
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-indigo-400">System Key Mapper</label>
                                            <select 
                                                className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-black outline-none"
                                                value={fieldData.systemKey}
                                                onChange={(e) => setFieldData({ ...fieldData, systemKey: e.target.value })}
                                            >
                                                <option value="">Select identity mapping...</option>
                                                <option value="firstName">First Name</option>
                                                <option value="lastName">Last Name</option>
                                                <option value="dob">Date of Birth (Used for Age Calc)</option>
                                                <option value="gender">Gender</option>
                                                <option value="email">Email</option>
                                                <option value="phone">Phone Number</option>
                                                <option value="nin">National Identification Number (NIN)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                                    <Button type="button" variant="ghost" onClick={() => setShowFieldModal(false)} className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest">Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">Save Field</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
            {showSettingsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase">Form Template Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 bg-white">
                            <form onSubmit={handleSaveSettings} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Form Title</label>
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. 2026/2027 Admission"
                                        value={settingsData.name}
                                        onChange={(e) => setSettingsData({...settingsData, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Custom Public URL (Slug)</label>
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. primary-intake-2026"
                                        value={settingsData.slug}
                                        onChange={(e) => setSettingsData({...settingsData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                                        required
                                    />
                                    <p className="text-[10px] font-bold text-slate-500 px-1">Changes the URL users visit. Current URL: /admission/{template.slug}</p>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button 
                                        type="button" variant="ghost"
                                        onClick={() => setShowSettingsModal(false)}
                                        className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        Save Changes
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
