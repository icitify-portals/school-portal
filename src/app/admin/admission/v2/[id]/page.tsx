"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText, User, Mail, Phone, Calendar, CheckCircle2, XCircle, AlertCircle,
    Loader2, ArrowLeft, Printer, CreditCard, GraduationCap, BookOpen, Hash,
    Image as ImageIcon, ChevronDown, ChevronUp, Shield, ShieldAlert, ShieldCheck
} from "lucide-react";
import { getAdminV2ApplicationDetail, updateAdmissionStatus, confirmAdmissionPayment, confirmAcceptancePayment } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function V2ApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [app, setApp] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState("");
    const [showNotes, setShowNotes] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["__all__"]));
    const [isOLevelExpanded, setIsOLevelExpanded] = useState(true);

    useEffect(() => {
        const id = parseInt(params.id as string);
        if (isNaN(id)) return;
        getAdminV2ApplicationDetail(id).then(data => {
            setApp(data);
            setNotes(data?.admissionNotes || "");
            // Auto-expand all form sections
            if (data?.formStructure) {
                setExpandedSections(new Set(data.formStructure.map((s: any) => s.title)));
            }
            setLoading(false);
        });
    }, [params.id]);

    const handleStatusChange = async (status: string) => {
        if (!app) return;
        const reason = status === 'rejected' ? prompt("Enter rejection reason:") : notes;
        if (status === 'rejected' && !reason) { toast.error("Rejection reason is required"); return; }
        const res = await updateAdmissionStatus(app.id, status, reason || "");
        if (res.success) {
            toast.success(`Application ${status}`);
            const data = await getAdminV2ApplicationDetail(app.id);
            setApp(data);
        } else {
            toast.error(res.error || "Action failed");
        }
    };

    const handleConfirmPayment = async () => {
        if (!app) return;
        const ref = prompt("Enter payment transaction reference:");
        if (!ref) return;
        const res = await confirmAdmissionPayment(app.id, ref);
        if (res.success) {
            toast.success("Payment confirmed");
            const data = await getAdminV2ApplicationDetail(app.id);
            setApp(data);
        } else {
            toast.error(res.error);
        }
    };

    const handleConfirmAcceptance = async () => {
        if (!app) return;
        const ref = prompt("Enter acceptance fee transaction reference:");
        if (!ref) return;
        const res = await confirmAcceptancePayment(app.id, ref);
        if (res.success) {
            toast.success("Acceptance fee confirmed");
            const data = await getAdminV2ApplicationDetail(app.id);
            setApp(data);
        } else {
            toast.error(res.error);
        }
    };

    const toggleSection = (title: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title); else next.add(title);
            return next;
        });
    };

    // Fuzzy lookup: try exact label, then systemKey, then case-insensitive, then trimmed label
    const getFieldValue = (parsedData: any, field: any): any => {
        if (!parsedData) return undefined;
        // 1. Exact label match
        if (parsedData[field.label] !== undefined && parsedData[field.label] !== null && parsedData[field.label] !== '') return parsedData[field.label];
        // 2. System key match
        if (field.systemKey && parsedData[field.systemKey] !== undefined && parsedData[field.systemKey] !== null && parsedData[field.systemKey] !== '') return parsedData[field.systemKey];
        // 3. Case-insensitive / trimmed label scan
        const labelLower = (field.label || '').toLowerCase().trim();
        for (const key of Object.keys(parsedData)) {
            if (key.toLowerCase().trim() === labelLower) {
                const val = parsedData[key];
                if (val !== null && val !== undefined && val !== '') return val;
            }
        }
        // 4. Partial match (label contains key or key contains label)
        for (const key of Object.keys(parsedData)) {
            const keyLower = key.toLowerCase().trim();
            if (keyLower.includes(labelLower) || labelLower.includes(keyLower)) {
                const val = parsedData[key];
                if (val !== null && val !== undefined && val !== '') return val;
            }
        }
        return undefined;
    };

    const renderFieldValue = (value: any, field: any) => {
        if (value === null || value === undefined || value === "") return <span className="text-slate-300 italic">—</span>;

        // Try to parse broken JSON strings or extract labels
        if (typeof value === 'string') {
            // Check if it's a broken JSON array string like `[{"label":"Yes"`
            if (value.includes('"label":"')) {
                const match = value.match(/"label"\s*:\s*"([^"]+)"/);
                if (match && match[1]) {
                    value = match[1];
                }
            } else if (value.includes('"value":"')) {
                const match = value.match(/"value"\s*:\s*"([^"]+)"/);
                if (match && match[1]) {
                    value = match[1];
                }
            } else if (value.startsWith('[') || value.startsWith('{')) {
                try {
                    const parsed = JSON.parse(value);
                    value = parsed;
                } catch (e) {
                    // Try to fix broken array closure
                    try {
                        if (value.startsWith('[{') && !value.endsWith('}]')) {
                            const parsed = JSON.parse(value + '}]');
                            value = parsed;
                        }
                    } catch (e2) {}
                }
            }
        }

        // Handle images
        if (typeof value === 'string' && (value.startsWith('data:image') || field?.type === 'image' || field?.type === 'photo' || field?.type === 'signature')) {
            return (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                    <img src={value} alt={field?.label || 'Upload'} className="w-full h-full object-cover print-img" />
                </div>
            );
        }
        // Handle file links
        if (typeof value === 'string' && value.startsWith('http')) {
            // Check if it's an image (accounting for query params like in presigned URLs)
            if (value.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || field?.type === 'image' || field?.type === 'photo' || field?.type === 'signature') {
                return (
                    <div className="relative group">
                        <img src={value} alt="Upload" className="w-20 h-20 object-contain rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:scale-[3] transition-transform duration-200 hover:z-10 hover:shadow-xl bg-white print-img" />
                    </div>
                );
            }
            return <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">{value}</a>;
        }
        // Handle boolean
        if (typeof value === 'boolean') {
            return value
                ? <span className="text-emerald-600 font-bold">Yes</span>
                : <span className="text-slate-400">No</span>;
        }
        // Handle arrays (like subjects)
        if (Array.isArray(value)) {
            const joined = value.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return item.label || item.value || JSON.stringify(item);
                }
                return String(item);
            }).join(', ');
            return <span className="text-slate-600 font-medium">{joined}</span>;
        }
        // Handle objects
        if (typeof value === 'object') {
            if (value.label) return <span className="text-slate-800 font-medium">{String(value.label)}</span>;
            if (value.value) return <span className="text-slate-800 font-medium">{String(value.value)}</span>;
            return <span className="text-slate-400 font-mono text-xs">{JSON.stringify(value)}</span>;
        }
        return <span className="text-slate-800 font-medium">{String(value)}</span>;
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            draft: "bg-slate-100 text-slate-600 border-slate-200",
            submitted: "bg-blue-100 text-blue-700 border-blue-200",
            paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
            screened: "bg-purple-100 text-purple-700 border-purple-200",
            admitted: "bg-emerald-100 text-emerald-700 border-emerald-200",
            rejected: "bg-rose-100 text-rose-700 border-rose-200",
        };
        return (
            <span className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-2", colors[status] || "bg-slate-100 text-slate-600")}>
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    status === 'admitted' ? 'bg-emerald-500' :
                    status === 'rejected' ? 'bg-rose-500' :
                    status === 'paid' ? 'bg-emerald-500' :
                    status === 'submitted' ? 'bg-blue-500' : 'bg-slate-400'
                )} />
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!app) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-16 h-16 text-slate-300 mx-auto" />
                    <p className="text-xl font-bold text-slate-500">Application not found</p>
                    <Link href="/admin/admission/v2">
                        <Button className="rounded-xl bg-indigo-600 text-white font-bold">Back to Applications</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 10mm; size: A4 portrait; }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background: white !important;
                    }
                    .no-print, iframe#tawk_to_wrapper { display: none !important; }
                    .print-container { 
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .shadow-xl, .shadow-2xl, .backdrop-blur-3xl {
                        box-shadow: none !important;
                        backdrop-filter: none !important;
                        border: 1px solid #e2e8f0 !important;
                    }
                    .print-card {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        margin-bottom: 24px !important;
                    }
                    .print-layout {
                        display: block !important;
                    }
                    .print-col {
                        width: 100% !important;
                        display: block !important;
                        margin-bottom: 24px !important;
                    }
                    /* Ensure tables fit nicely */
                    table { page-break-inside: auto; width: 100% !important; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    
                    /* Fix Image Scaling in Print */
                    img { max-width: 100% !important; height: auto !important; }
                    .print-img { width: 5rem !important; height: 5rem !important; object-fit: contain !important; transform: none !important; }
                    .print-avatar { width: 100px !important; height: 100px !important; }
                    
                    /* Force display blocks in print */
                    .print-force-block { display: block !important; }
                }
            `}} />
            <div className="max-w-[1600px] w-full mx-auto space-y-8 print-container">
                <div className="flex items-center gap-4 no-print">
                    <Link href="/admin/admission/v2">
                        <Button variant="ghost" className="rounded-xl text-slate-500 font-bold">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    </Link>
                </div>

                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-emerald-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-32 h-32 md:w-40 md:h-40 relative rounded-2xl overflow-hidden border-4 border-slate-900 bg-slate-800 shadow-2xl flex-shrink-0 z-10 print-avatar">
                                {app.applicantPhoto ? (
                                    <img src={app.applicantPhoto} alt={app.applicantName} className="w-full h-full object-cover relative z-10" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center relative z-10">
                                        <User className="w-16 h-16 text-slate-600" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase italic">{app.applicantName}</h1>
                                <div className="flex items-center gap-4 mt-2 text-slate-300 text-sm">
                                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {app.formNumber || 'No form number'}</span>
                                    <span>{statusBadge(app.status)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 no-print">
                            <Button
                                onClick={() => window.print()}
                                className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black text-[10px] uppercase tracking-widest px-5 py-3 backdrop-blur-md"
                            >
                                <Printer className="w-4 h-4 mr-2" /> Print
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-layout">
                    <div className="lg:col-span-2 space-y-6 print-col">
                        <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden print-card">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                    <User className="w-5 h-5" /> Personal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(app.parsedData?.firstName || app.parsedData?.first_name) && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">First Name</p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.firstName || app.parsedData.first_name}</p>
                                        </div>
                                    )}
                                    {(app.parsedData?.lastName || app.parsedData?.last_name) && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Name</p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.lastName || app.parsedData.last_name}</p>
                                        </div>
                                    )}
                                    {app.parsedData?.surname && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Surname</p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.surname}</p>
                                        </div>
                                    )}
                                    {(app.parsedData?.middleName || app.parsedData?.middle_name) && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Middle Name</p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.middleName || app.parsedData.middle_name}</p>
                                        </div>
                                    )}
                                    {(app.parsedData?.email || app.parsedData?.email_address) && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                <Mail className="w-3 h-3 inline mr-1" /> Email
                                            </p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.email || app.parsedData.email_address}</p>
                                        </div>
                                    )}
                                    {app.parsedData?.phone && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                <Phone className="w-3 h-3 inline mr-1" /> Phone
                                            </p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.phone}</p>
                                        </div>
                                    )}
                                    {app.nin && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NIN</p>
                                            <p className="text-sm font-bold text-slate-800 font-mono">{app.nin}</p>
                                        </div>
                                    )}
                                    {(() => {
                                        let jambRegNo = app.jambRegNumber || "";
                                        if (!jambRegNo && app.parsedData) {
                                            for (const key of Object.keys(app.parsedData)) {
                                                if (key.toLowerCase().includes("jamb") && app.parsedData[key]) {
                                                    jambRegNo = String(app.parsedData[key]).trim();
                                                    break;
                                                }
                                            }
                                        }
                                        const isJambCandidate = app.applicationMode
                                            ? app.applicationMode === 'full_time'
                                            : (!!jambRegNo && !jambRegNo.toLowerCase().includes("temp") && !jambRegNo.toLowerCase().includes("direct"));
                                        const studyMode = app.applicationMode ? app.applicationMode : (isJambCandidate ? 'full_time' : 'part_time');

                                        return (
                                            <>
                                                {jambRegNo && (
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">JAMB Reg No</p>
                                                        <p className="text-sm font-bold text-slate-800 font-mono">{jambRegNo}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Study Mode</p>
                                                    <p className="text-sm font-bold text-slate-800 capitalize">
                                                        {studyMode.replace('_', ' ')}
                                                    </p>
                                                </div>
                                                {(app.programmeName && app.programmeName !== 'N/A') ? (
                                                    <div className="md:col-span-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Programme of Study</p>
                                                        <p className="text-sm font-bold text-slate-800">{app.programmeName}</p>
                                                    </div>
                                                ) : app.template?.name && (
                                                    <div className="md:col-span-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Template</p>
                                                        <p className="text-sm font-bold text-slate-800">{app.template.name}</p>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                        </Card>

                        {app.formStructure && app.formStructure.length > 0 && (
                            <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden print-card">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                        <FileText className="w-5 h-5" /> Application Form Data
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    {app.formStructure
                                        .filter((section: any) => {
                                            if (!section.fields || section.fields.length === 0) return false;
                                            // Check if all fields in this section are olevel fields
                                            const visibleFields = section.fields.filter((field: any) => {
                                                const label = field.label?.toLowerCase() || '';
                                                if (field.type === 'olevel' || label.includes('o-level') || label.includes('o/level') || label.includes('give your o-level')) {
                                                    return false;
                                                }
                                                return true;
                                            });
                                            return visibleFields.length > 0;
                                        })
                                        .map((section: any) => {
                                            const isExpanded = expandedSections.has(section.title) || expandedSections.has("__all__");
                                            return (
                                                <div key={section.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                                                    <button
                                                        onClick={() => toggleSection(section.title)}
                                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                                                    >
                                                        <span className="font-black text-sm text-slate-700 uppercase tracking-wider">{section.title}</span>
                                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                    </button>
                                                    <div className={cn(
                                                        "p-4 gap-4",
                                                        isExpanded ? "grid grid-cols-1 md:grid-cols-2" : "hidden print:grid print:grid-cols-2"
                                                    )}>
                                                            {section.fields.map((field: any) => {
                                                                // Skip rendering olevel fields here since they have their own section
                                                                if (field.type === 'olevel' || field.label?.toLowerCase().includes('o-level') || field.label?.toLowerCase().includes('o/level') || field.label?.toLowerCase().includes('give your o-level')) {
                                                                    return null;
                                                                }

                                                                let value = getFieldValue(app.parsedData, field);
                                                                if (!value && (field.type === 'image' || field.type === 'photo')) {
                                                                    value = app.parsedData?.passport_photo || app.parsedData?.passport || app.parsedData?.photo || app.parsedData?.image || app.parsedData?.['Photograph/camera'] || app.parsedData?.Photograph || '';
                                                                }
                                                                if (!value && field.type === 'signature') {
                                                                    value = app.parsedData?.signature || app.parsedData?.applicant_signature || app.parsedData?.Signature || '';
                                                                }
                                                                return (
                                                                    <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{field.label}</p>
                                                                        <div className="text-sm">{renderFieldValue(value, field.type)}</div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                            );
                                        })}
                                </CardContent>
                            </Card>
                        )}

                        {/* Raw submitted data — shows ALL fields including those not in formStructure */}
                        {app.parsedData && Object.keys(app.parsedData).filter(k => !k.startsWith('__')).length > 0 && (
                            <Card className="border border-amber-200 shadow-xl bg-amber-50/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden print-card no-print">
                                <button
                                    onClick={() => toggleSection('__raw__')}
                                    className="w-full flex items-center justify-between p-4 bg-amber-100 hover:bg-amber-200 transition-colors text-left"
                                >
                                    <span className="font-black text-sm text-amber-800 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Raw Submitted Data (All Fields)
                                    </span>
                                    {expandedSections.has('__raw__') ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
                                </button>
                                {expandedSections.has('__raw__') && (
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(app.parsedData)
                                            .filter(([k]) => !k.startsWith('__'))
                                            .map(([key, val]: [string, any]) => (
                                                <div key={key} className={typeof val === 'string' && val.length > 80 ? 'md:col-span-2' : ''}>
                                                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">{key}</p>
                                                    <div className="text-sm">{renderFieldValue(val, { label: key })}</div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </Card>
                        )}

                        {app.olevelData && app.olevelData.length > 0 && (
                            <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden print-card">
                                <button 
                                    onClick={() => setIsOLevelExpanded(!isOLevelExpanded)}
                                    className="w-full text-left bg-slate-50 border-b border-slate-100 p-6 hover:bg-slate-100 transition-colors flex items-center justify-between"
                                >
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                        <BookOpen className="w-5 h-5" /> O-Level Results
                                    </h3>
                                    {isOLevelExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                </button>
                                <CardContent className={cn("p-6 space-y-6", isOLevelExpanded ? "block" : "hidden print:block")}>
                                    {app.olevelData.map((sitting: any, index: number) => {
                                        const validSubjects = sitting.subjects?.filter((sub: any) => sub.subjectName || sub.subject || sub.name) || [];
                                        return <div key={sitting.id || index} className="space-y-3">
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-black text-[10px] uppercase tracking-widest">
                                                    Sitting {sitting.sittingNumber || sitting.sitting || 1}
                                                </span>
                                                <span className="font-bold text-slate-600">
                                                    {sitting.examBodyName || sitting.examType || sitting.exam_type || (sitting.examBodyId === "1" ? "WAEC" : sitting.examBodyId === "2" ? "NECO" : sitting.examBodyId === "3" ? "NABTEB" : sitting.examBodyId ? `Exam Body ${sitting.examBodyId}` : 'Unknown Exam')}
                                                </span>
                                                <span className="text-slate-400">{sitting.examYear || sitting.exam_year}</span>
                                                <span className="font-mono text-xs text-slate-400">{sitting.examNumber || sitting.exam_number}</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-200">
                                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</th>
                                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Grade</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {validSubjects.length > 0 ? validSubjects.map((sub: any, i: number) => {
                                                            return <tr key={sub.id || i} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2.5 font-medium text-slate-800 border-b border-slate-100">{sub.subjectName || sub.subject || sub.name}</td>
                                                                <td className="px-4 py-2.5 border-b border-slate-100">
                                                                    <span className="px-2.5 py-1 bg-slate-100 rounded-md font-bold text-xs font-mono">{sub.grade}</span>
                                                                </td>
                                                            </tr>
                                                        }) : (
                                                            <tr>
                                                                <td colSpan={2} className="px-4 py-6 text-center text-slate-400 italic">No subjects filled for this sitting</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    })}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6 print-col">
                        <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden print-card">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                    <CreditCard className="w-5 h-5" /> Payment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Fee</span>
                                    <span className="font-black text-slate-900">\u20A6{app.template?.applicationFee?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</span>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                        app.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                        "bg-amber-100 text-amber-700 border-amber-200"
                                    )}>
                                        {app.paymentStatus}
                                    </span>
                                </div>
                                {app.paymentReference && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref</span>
                                        <span className="font-mono text-xs font-bold text-slate-600">{app.paymentReference}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acceptance Fee</span>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                        app.acceptancePaymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                        app.acceptancePaymentStatus === 'not_applicable' ? "bg-slate-100 text-slate-500 border-slate-200" :
                                        "bg-amber-100 text-amber-700 border-amber-200"
                                    )}>
                                        {app.acceptancePaymentStatus?.replace('_', ' ') || 'pending'}
                                    </span>
                                </div>

                                <div className="pt-4 border-t border-slate-200 space-y-3">
                                    {app.paymentStatus !== 'paid' && (
                                        <Button
                                            onClick={handleConfirmPayment}
                                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-4"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Payment
                                        </Button>
                                    )}
                                    {app.status === 'admitted' && app.acceptancePaymentStatus !== 'paid' && app.acceptancePaymentStatus !== 'not_applicable' && (
                                        <Button
                                            onClick={handleConfirmAcceptance}
                                            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest py-4"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Acceptance Fee
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {app.userAccountInfo && (
                            <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden print-card">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                        <Shield className="w-5 h-5" /> User Account
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</span>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            app.userAccountInfo.status === 'active' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                            "bg-rose-100 text-rose-700 border-rose-200"
                                        )}>
                                            {app.userAccountInfo.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Verified</span>
                                        {app.userAccountInfo.emailVerified ? (
                                            <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                                                <ShieldCheck className="w-4 h-4" /> Yes
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-rose-600 font-bold text-sm">
                                                <ShieldAlert className="w-4 h-4" /> No
                                            </span>
                                        )}
                                    </div>
                                    {app.userAccountInfo.isLocked && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Locked Until</span>
                                            <span className="text-rose-600 font-bold text-xs">
                                                {format(new Date(app.userAccountInfo.lockoutUntil), 'MMM dd, yyyy HH:mm')}
                                            </span>
                                        </div>
                                    )}
                                    {app.userAccountInfo.failedLoginAttempts > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Failed Logins</span>
                                            <span className="text-amber-600 font-bold text-sm">{app.userAccountInfo.failedLoginAttempts}</span>
                                        </div>
                                    )}
                                    {app.userAccountInfo.requiresPasswordChange && (
                                        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Requires Password Reset</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</span>
                                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200 text-slate-600">
                                            {app.userAccountInfo.role}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered</span>
                                        <span className="text-sm font-bold text-slate-600">
                                            {app.userAccountInfo.createdAt ? format(new Date(app.userAccountInfo.createdAt), 'MMM dd, yyyy') : '—'}
                                        </span>
                                    </div>
                                    {app.userAccountInfo.lastLogin && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Login</span>
                                            <span className="text-sm font-bold text-slate-600">
                                                {format(new Date(app.userAccountInfo.lastLogin), 'MMM dd, yyyy HH:mm')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-slate-200">
                                        <Link href={`/admin/users?search=${encodeURIComponent(app.userAccountInfo.email)}`}>
                                            <Button variant="outline" className="w-full rounded-xl border-slate-300 text-slate-600 font-black text-[10px] uppercase tracking-widest py-3">
                                                View User Account
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden print-card">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                    <AlertCircle className="w-5 h-5" /> Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Admin Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                        placeholder="Add notes about this application..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    {app.status !== 'admitted' && app.status !== 'rejected' && (
                                        <>
                                            <Button
                                                onClick={() => handleStatusChange('admitted')}
                                                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-4"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Admit Applicant
                                            </Button>
                                            <Button
                                                onClick={() => handleStatusChange('rejected')}
                                                className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest py-4"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" /> Reject Applicant
                                            </Button>
                                        </>
                                    )}
                                    {(app.status === 'admitted' || app.status === 'rejected') && (
                                        <Button
                                            onClick={() => handleStatusChange('submitted')}
                                            variant="outline"
                                            className="w-full rounded-xl border-slate-300 text-slate-600 font-black text-[10px] uppercase tracking-widest py-4"
                                        >
                                            <AlertCircle className="w-4 h-4 mr-2" /> Reset to Submitted
                                        </Button>
                                    )}
                                    {app.status === 'submitted' && (
                                        <Button
                                            onClick={() => {
                                                if(confirm("Are you sure you want to reverse this submission? The applicant will need to resubmit their application.")) {
                                                    handleStatusChange('draft')
                                                }
                                            }}
                                            variant="outline"
                                            className="w-full rounded-xl border-amber-300 text-amber-600 font-black text-[10px] uppercase tracking-widest py-4 hover:bg-amber-50"
                                        >
                                            <AlertCircle className="w-4 h-4 mr-2" /> Reverse Submission to Draft
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden print-card">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                    <Hash className="w-5 h-5" /> Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</span>
                                    <span className="font-mono text-sm font-bold text-slate-600">#{app.id}</span>
                                </div>
                                {app.formNumber && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Form #</span>
                                        <span className="font-mono text-sm font-bold text-slate-600">{app.formNumber}</span>
                                    </div>
                                )}
                                {app.formHash && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Form Hash</span>
                                        <span className="font-mono text-[10px] font-bold text-slate-400 truncate max-w-[120px]" title={app.formHash}>{app.formHash.slice(0, 16)}...</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Template</span>
                                    <span className="text-sm font-bold text-slate-600">{app.templateName}</span>
                                </div>
                                {app.templateLevel && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</span>
                                        <span className="text-sm font-bold text-slate-600">{app.templateLevel}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted</span>
                                    <span className="text-sm font-bold text-slate-600">
                                        {app.appliedAt ? format(new Date(app.appliedAt), 'MMM dd, yyyy HH:mm') : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Updated</span>
                                    <span className="text-sm font-bold text-slate-600">
                                        {app.updatedAt ? format(new Date(app.updatedAt), 'MMM dd, yyyy HH:mm') : '—'}
                                    </span>
                                </div>
                                {app.student && (
                                    <div className="pt-4 border-t border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</span>
                                            <Link href={`/admin/students/${app.student.id}`}>
                                                <Button className="rounded-xl bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2">
                                                    View Profile
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
