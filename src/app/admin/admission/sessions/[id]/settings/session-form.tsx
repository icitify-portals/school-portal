
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { upsertAdmissionSession } from "@/actions/admission-session";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, Trash2, GripVertical, Settings2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface DynamicField {
    id: string;
    label: string;
    type: 'text' | 'select' | 'textarea' | 'number';
    options?: string; // Comma separated for select
    required: boolean;
}

interface Props {
    session?: any;
    isNew: boolean;
}

export default function AdmissionSessionForm({ session, isNew }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: session?.id || null,
        name: session?.name || "",
        startDate: session?.startDate ? new Date(session.startDate).toISOString().slice(0, 16) : "",
        endDate: session?.endDate ? new Date(session.endDate).toISOString().slice(0, 16) : "",
        applicationFee: session?.applicationFee || "0.00",
        screeningMode: session?.screeningMode || "CBT",
        instructions: session?.instructions || "",
        logoUrl: session?.logoUrl || "",
        isActive: session?.isActive !== undefined ? session.isActive : true,
    });

    const [fields, setFields] = useState<DynamicField[]>(() => {
        if (!session?.dynamicFields) return [];
        try {
            const parsed = JSON.parse(session.dynamicFields);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const router = useRouter();
    const { toast } = useToast();

    const addField = () => {
        const newField: DynamicField = {
            id: Math.random().toString(36).substr(2, 9),
            label: "",
            type: "text",
            required: false
        };
        setFields([...fields, newField]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<DynamicField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await upsertAdmissionSession({
            ...formData,
            dynamicFields: JSON.stringify(fields)
        });

        if (res.success) {
            toast({
                title: "Success",
                description: `Admission session ${isNew ? 'created' : 'updated'} successfully.`,
            });
            router.push('/admin/admission/sessions');
        } else {
            toast({
                title: "Error",
                description: res.error || "Failed to save session.",
                variant: "destructive"
            });
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
                {/* Basic Settings */}
                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-indigo-500" /> Basic Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Session Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. 2024/2025 Post-UTME Regular"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="datetime-local"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="datetime-local"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fee">Application Fee (₦)</Label>
                                <Input
                                    id="fee"
                                    type="number"
                                    step="0.01"
                                    value={formData.applicationFee}
                                    onChange={e => setFormData({ ...formData, applicationFee: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mode">Screening Mode</Label>
                                <Select
                                    value={formData.screeningMode}
                                    onValueChange={v => setFormData({ ...formData, screeningMode: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CBT">CBT Examination</SelectItem>
                                        <SelectItem value="Interview">Physical Interview</SelectItem>
                                        <SelectItem value="Document Only">Document Screening Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="active"
                                checked={formData.isActive}
                                onCheckedChange={v => setFormData({ ...formData, isActive: v })}
                            />
                            <Label htmlFor="active">Accepting Applications</Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Branding & Instructions */}
                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" /> Instructions & Branding
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="space-y-2">
                            <Label htmlFor="logo">Branding Logo URL</Label>
                            <Input
                                id="logo"
                                value={formData.logoUrl}
                                onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instructions">Application Instructions</Label>
                            <Textarea
                                id="instructions"
                                value={formData.instructions}
                                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                placeholder="Guidelines for candidates..."
                                className="min-h-[150px]"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dynamic Field Builder */}
            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-5 w-5 text-emerald-500" /> Custom Form Fields
                    </CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addField}>
                        <Plus className="h-4 w-4 mr-2" /> Add Field
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    {fields.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed">
                            No custom fields added. Only standard profile data will be collected.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {fields.map((field) => (
                                <div key={field.id} className="flex gap-4 p-4 bg-slate-50 rounded-lg border group relative">
                                    <div className="flex-1 grid gap-4 md:grid-cols-4">
                                        <div className="md:col-span-2 space-y-1">
                                            <Label className="text-xs uppercase font-bold text-slate-400">Field Label</Label>
                                            <Input
                                                placeholder="e.g. State of Origin"
                                                value={field.label}
                                                onChange={e => updateField(field.id, { label: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs uppercase font-bold text-slate-400">Type</Label>
                                            <Select
                                                value={field.type}
                                                onValueChange={v => updateField(field.id, { type: v as any })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Short Text</SelectItem>
                                                    <SelectItem value="textarea">Long Text</SelectItem>
                                                    <SelectItem value="select">Dropdown Select</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-end justify-center pb-2">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id={`req-${field.id}`}
                                                    checked={field.required}
                                                    onCheckedChange={v => updateField(field.id, { required: v })}
                                                />
                                                <Label htmlFor={`req-${field.id}`} className="text-xs">Required</Label>
                                            </div>
                                        </div>
                                    </div>

                                    {field.type === 'select' && (
                                        <div className="absolute top-[100%] left-0 right-0 mt-1 z-10 p-2 bg-indigo-50 border border-indigo-100 rounded-md">
                                            <Label className="text-[10px] uppercase font-bold text-indigo-400">Options (Comma separated)</Label>
                                            <Input
                                                className="h-8 text-sm"
                                                placeholder="Option 1, Option 2, ..."
                                                value={field.options || ""}
                                                onChange={e => updateField(field.id, { options: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-400 hover:text-red-600 self-center"
                                        onClick={() => removeField(field.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pb-10">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px]" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {isNew ? 'Create Session' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
