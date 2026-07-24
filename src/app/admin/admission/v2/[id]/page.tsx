"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText, User, Mail, Phone, Calendar, CheckCircle2, XCircle, AlertCircle,
    Loader2, ArrowLeft, Printer, CreditCard, GraduationCap, BookOpen, Hash,
    Image as ImageIcon, ChevronDown, ChevronUp
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
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        const id = parseInt(params.id as string);
        if (isNaN(id)) return;
        getAdminV2ApplicationDetail(id).then(data => {
            setApp(data);
            setNotes(data?.admissionNotes || "");
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

    const renderFieldValue = (value: any, fieldType?: string) => {
        if (value === null || value === undefined || value === "") return <span className="text-slate-300 italic">—</span>;
        // Handle image fields
        if (fieldType === 'image' || fieldType === 'photo' || fieldType === 'signature' || (typeof value === 'string' && value.startsWith('data:image'))) {
            return (
                <div className="relative group">
                    <img src={value} alt="Upload" className="w-20 h-20 object-contain rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:scale-[3] transition-transform duration-200 hover:z-10 hover:shadow-xl bg-white" />
                </div>
            );
        }
        // Handle file links
        if (typeof value === 'string' && value.startsWith('http')) {
            if (value.match(/\.(jpeg|jpg|gif|png)$/i)) {
                return (
                    <div className="relative group">
                        <img src={value} alt="Upload" className="w-20 h-20 object-contain rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:scale-[3] transition-transform duration-200 hover:z-10 hover:shadow-xl bg-white" />
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
            return <span className="text-slate-600">{value.join(', ')}</span>;
        }
        // Handle objects
        if (typeof value === 'object') {
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
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                <div className="flex items-center gap-4">
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
                            {app.applicantPhoto ? (
                                <img src={app.applicantPhoto} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg" />
                            ) : (
                                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <User className="w-10 h-10 text-white/40" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase italic">{app.applicantName}</h1>
                                <div className="flex items-center gap-4 mt-2 text-slate-300 text-sm">
                                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {app.formNumber || 'No form number'}</span>
                                    <span>{statusBadge(app.status)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() => window.print()}
                                className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black text-[10px] uppercase tracking-widest px-5 py-3 backdrop-blur-md"
                            >
                                <Printer className="w-4 h-4 mr-2" /> Print
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                    <User className="w-5 h-5" /> Personal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {app.parsedData?.firstName && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">First Name</p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.firstName}</p>
                                        </div>
                                    )}
                                    {app.parsedData?.lastName && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Name</p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.lastName}</p>
                                        </div>
                                    )}
                                    {app.parsedData?.surname && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Surname</p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.surname}</p>
                                        </div>
                                    )}
                                    {app.parsedData?.middleName && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Middle Name</p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.middleName}</p>
                                        </div>
                                    )}
                                    {app.parsedData?.email && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                <Mail className="w-3 h-3 inline mr-1" /> Email
                                            </p>
                                            <p className="text-sm font-bold text-slate-800">{app.parsedData.email}</p>
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
                                    {app.jambRegNumber && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">JAMB Reg No</p>
                                            <p className="text-sm font-bold text-slate-800 font-mono">{app.jambRegNumber}</p>
                                        </div>
                                    )}
                                    {app.applicationMode && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Study Mode</p>
                                            <p className="text-sm font-bold text-slate-800 capitalize">{app.applicationMode.replace('_', ' ')}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {app.formStructure && app.formStructure.length > 0 && (
                            <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                        <FileText className="w-5 h-5" /> Application Form Data
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    {app.formStructure
                                        .filter((section: any) => section.fields && section.fields.length > 0)
                                        .map((section: any) => {
                                            const isExpanded = expandedSections.has(section.title);
                                            return (
                                                <div key={section.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                                                    <button
                                                        onClick={() => toggleSection(section.title)}
                                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                                                    >
                                                        <span className="font-black text-sm text-slate-700 uppercase tracking-wider">{section.title}</span>
                                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {section.fields.map((field: any) => {
                                                                const value = app.parsedData?.[field.label] ?? app.parsedData?.[field.systemKey || ''];
                                                                return (
                                                                    <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{field.label}</p>
                                                                        <div className="text-sm">{renderFieldValue(value, field.type)}</div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </CardContent>
                            </Card>
                        )}

                        {app.olevelData && app.olevelData.length > 0 && (
                            <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                        <BookOpen className="w-5 h-5" /> O-Level Results
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    {app.olevelData.map((sitting: any) => (
                                        <div key={sitting.id} className="space-y-3">
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-black text-[10px] uppercase tracking-widest">
                                                    Sitting {sitting.sittingNumber}
                                                </span>
                                                <span className="font-bold text-slate-600">{sitting.examBodyName}</span>
                                                <span className="text-slate-400">{sitting.examYear}</span>
                                                <span className="font-mono text-xs text-slate-400">{sitting.examNumber}</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="bg-slate-50">
                                                            <th className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</th>
                                                            <th className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Grade</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {sitting.subjects.map((sub: any) => (
                                                            <tr key={sub.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2 font-medium text-slate-800">{sub.subjectName}</td>
                                                                <td className="px-4 py-2">
                                                                    <span className="px-2.5 py-0.5 bg-slate-100 rounded-md font-bold text-xs font-mono">{sub.grade}</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                    <CreditCard className="w-5 h-5" /> Payment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Fee</span>
                                    <span className="font-black text-slate-900">₦{app.template?.applicationFee?.toLocaleString() || '0'}</span>
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

                        <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
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
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
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
