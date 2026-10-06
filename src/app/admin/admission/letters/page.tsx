"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FileText, Save, Eye, Loader2, CheckCircle2, AlertCircle,
    Type, Code2, ChevronDown, Copy, Stamp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { saveDocumentTemplate, getDocumentTemplates } from "@/actions/result-management";
import dynamic from "next/dynamic";

const TiptapEditor = dynamic(() => import("@/components/cms/Editor"), { ssr: false });

const TEMPLATE_NAMES = [
    "Admission Letter - Full-Time ND",
    "Admission Letter - Full-Time HND",
    "Admission Letter - Daily Part-Time ND",
    "Admission Letter - Daily Part-Time HND",
];

const PLACEHOLDERS = [
    { label: "Candidate Name", key: "{{candidate_name}}" },
    { label: "Matric Number", key: "{{academic_number}}" },
    { label: "Number Label", key: "{{academic_number_label}}" },
    { label: "Institution", key: "{{institution_name}}" },
    { label: "Date", key: "{{date}}" },
    { label: "Admission Year", key: "{{admission_year}}" },
    { label: "Session", key: "{{academic_session}}" },
    { label: "Study Mode", key: "{{study_mode}}" },
    { label: "Mode of Entry", key: "{{mode_of_entry}}" },
    { label: "Programme", key: "{{programme_name}}" },
    { label: "Department", key: "{{department_name}}" },
    { label: "JAMB Reg No", key: "{{jamb_reg_no}}" },
    { label: "Ref No", key: "{{ref_no}}" },
    { label: "Resumption Date", key: "{{resumption_date}}" },
    { label: "Lecture Start", key: "{{lecture_start_date}}" },
    { label: "Acceptance Fee", key: "{{acceptance_fee}}" },
    { label: "Fee in Words", key: "{{acceptance_fee_words}}" },
];

const SAMPLE_DATA: Record<string, string> = {
    "{{candidate_name}}": "ADEWALE, John Oluwaseun",
    "{{academic_number}}": "FSS/COM/2026/ND/120577",
    "{{academic_number_label}}": "Matriculation Number",
    "{{institution_name}}": "Federal School of Statistics, Ibadan",
    "{{date}}": new Date().toLocaleDateString("en-GB"),
    "{{admission_year}}": "2026",
    "{{academic_session}}": "2026/2027",
    "{{study_mode}}": "Full-Time",
    "{{mode_of_entry}}": "JAMB",
    "{{programme_name}}": "ND Computer Science",
    "{{department_name}}": "Computer Science",
    "{{jamb_reg_no}}": "202660003248HI",
    "{{ref_no}}": "FSS/COM/2026/ND/120577",
    "{{resumption_date}}": "6th October, 2025",
    "{{lecture_start_date}}": "13th October, 2025",
    "{{acceptance_fee}}": "25,000",
    "{{acceptance_fee_words}}": "twenty-five thousand naira",
};

const DEFAULT_LETTER_HTML = `<p style="text-align: right;">Ref: {{ref_no}}</p>
<p style="text-align: right;">Date: {{date}}</p>

<p>The Registrar,</p>
<p>{{institution_name}}</p>
<p>P.M.B. 1017, Ibadan</p>

<p><strong>RE: OFFER OF PROVISIONAL ADMISSION INTO {{programme_name}} ({{study_mode}}) FOR {{academic_session}} ACADEMIC SESSION</strong></p>

<p>Dear <strong>{{candidate_name}}</strong>,</p>

<p>I am pleased to inform you that you have been offered provisional admission into the <strong>{{department_name}}</strong> Department of {{institution_name}} for the <strong>{{academic_session}}</strong> academic session to pursue the <strong>{{programme_name}}</strong> programme on a {{study_mode}} basis.</p>

<p>Your {{academic_number_label}} is: <strong>{{academic_number}}</strong></p>

<p>You are required to:</p>
<ol>
    <li>Pay an acceptance fee of <strong>₦{{acceptance_fee}} ({{acceptance_fee_words}})</strong> within two weeks of this letter.</li>
    <li>Resume on <strong>{{resumption_date}}</strong>.</li>
    <li>Commencement of lectures: <strong>{{lecture_start_date}}</strong>.</li>
    <li>Present original copies of all your credentials for verification.</li>
</ol>

<p>Please note that this admission is provisional and subject to verification of your credentials.</p>

<p>Congratulations and welcome to {{institution_name}}.</p>`;

export default function AdmissionLetterEditorPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedName, setSelectedName] = useState(TEMPLATE_NAMES[0]);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [html, setHtml] = useState(DEFAULT_LETTER_HTML);
    const [css, setCss] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    useEffect(() => {
        const t = templates.find((t) => t.name === selectedName);
        if (t) {
            setSelectedTemplate(t);
            setHtml(t.templateHtml || DEFAULT_LETTER_HTML);
            setCss(t.templateCss || "");
        } else {
            setSelectedTemplate(null);
            setHtml(DEFAULT_LETTER_HTML);
            setCss("");
        }
    }, [selectedName, templates]);

    async function loadTemplates() {
        setLoading(true);
        const res = await getDocumentTemplates();
        if (res.success) setTemplates((res as any).data || []);
        setLoading(false);
    }

    async function handleSave() {
        setSaving(true);
        const res = await saveDocumentTemplate({
            id: selectedTemplate?.id,
            name: selectedName,
            type: "admission_letter",
            level: "tertiary",
            html,
            css,
        });
        setSaving(false);
        if (res.success) {
            toast.success("Template saved successfully.");
            loadTemplates();
        } else {
            toast.error(res.error || "Failed to save template.");
        }
    }

    function insertPlaceholder(key: string) {
        setHtml((prev) => prev + key);
    }

    function previewHtml(): string {
        let preview = html;
        for (const [key, value] of Object.entries(SAMPLE_DATA)) {
            preview = preview.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
        }
        return preview;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                            <Stamp size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Admission Letter Templates</h1>
                            <p className="text-sm text-slate-500">Design and edit admission letter content for each programme type</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setPreviewMode(!previewMode)}
                            className="gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            {previewMode ? "Editor" : "Preview"}
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Template
                        </Button>
                    </div>
                </div>

                {/* Template Selector */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                        Select Template
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                        {TEMPLATE_NAMES.map((name) => {
                            const exists = templates.some((t) => t.name === name);
                            return (
                                <button
                                    key={name}
                                    onClick={() => setSelectedName(name)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        selectedName === name
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                >
                                    {name.replace("Admission Letter - ", "")}
                                    {!exists && (
                                        <span className="ml-2 w-2 h-2 bg-amber-400 rounded-full inline-block" title="Not yet created" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Editor Panel */}
                    <div className="lg:col-span-2 space-y-4">
                        {previewMode ? (
                            /* Preview Mode */
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                                    <Eye className="w-4 h-4" />
                                    <span>Live Preview with Sample Data</span>
                                </div>
                                <div className="border border-slate-200 rounded-xl p-8 bg-white">
                                    {/* Rendered exactly as AdmissionLetterService returns it.
                                        Wrapping it in a synthetic header showed a letterhead
                                        and "Admission Letter" title that students never receive,
                                        which is why this preview appeared to have two headers. */}
                                    {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
                                    <div
                                        className="admission-letter-preview"
                                        style={{
                                            fontFamily: "'Georgia', 'Times New Roman', serif",
                                            color: "#1e293b",
                                            lineHeight: 1.6,
                                            fontSize: "13px",
                                        }}
                                        dangerouslySetInnerHTML={{ __html: previewHtml() }}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Editor Mode */
                            <Tabs defaultValue="body" className="space-y-4">
                                <TabsList className="bg-white border border-slate-200 rounded-xl p-1">
                                    <TabsTrigger value="body" className="gap-2 rounded-lg">
                                        <Type className="w-4 h-4" /> Letter Body
                                    </TabsTrigger>
                                    <TabsTrigger value="css" className="gap-2 rounded-lg">
                                        <Code2 className="w-4 h-4" /> Custom CSS
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="body">
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                        <TiptapEditor value={html} onChange={setHtml} />
                                    </div>
                                </TabsContent>

                                <TabsContent value="css">
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                                        <textarea
                                            value={css}
                                            onChange={(e) => setCss(e.target.value)}
                                            className="w-full h-64 font-mono text-sm p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                                            placeholder="/* Custom CSS for the admission letter */"
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>

                    {/* Sidebar: Placeholders & Info */}
                    <div className="space-y-4">
                        {/* Placeholders */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Copy className="w-4 h-4" /> Insert Placeholder
                            </h3>
                            <p className="text-xs text-slate-400 mb-3">
                                Click to insert at the end of the editor. These are replaced with real data when the letter is generated.
                            </p>
                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                {PLACEHOLDERS.map((p) => (
                                    <button
                                        key={p.key}
                                        onClick={() => insertPlaceholder(p.key)}
                                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-between group"
                                    >
                                        <span>{p.label}</span>
                                        <code className="text-xs text-slate-400 group-hover:text-indigo-500 font-mono">
                                            {p.key}
                                        </code>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                            <h3 className="text-sm font-bold text-slate-700 mb-2">Template Status</h3>
                            {selectedTemplate ? (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Template exists and is active</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-amber-600">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Template not yet created. Save to create it.</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-500 space-y-2">
                            <p><strong>How it works:</strong></p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Each template is for a specific programme type (FT-ND, FT-HND, DPP-ND, DPP-HND)</li>
                                <li>Placeholders are replaced with real candidate data when the letter is generated</li>
                                <li>The header and footer are shared across all templates</li>
                                <li>Use the Preview tab to see how the letter looks with sample data</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}