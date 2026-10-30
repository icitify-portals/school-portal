"use client";

import React, { useState } from "react";
import { Printer, ArrowLeft, Edit3, User, ShieldCheck, CheckCircle2, QrCode, Loader2, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { viewableAssetUrl } from "@/lib/assets";
import { saveStudentDossierAction } from "@/actions/dossier";
import { toast } from "sonner";

const NIGERIAN_STATES = [
    "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
    "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
    "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
    "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"
];

interface StudentDossierPrintableProps {
    data: any;
    isStaffView?: boolean;
}

export function StudentDossierPrintable({ data, isStaffView = false }: StudentDossierPrintableProps) {
    const router = useRouter();
    if (!data || !data.student) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>Student dossier record not available.</p>
            </div>
        );
    }

    const { student, user, programme, department, currentSession, admissionSession, medicalRecord, matricRecord } = data;

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        otherNames: student.otherNames || "",
        gender: student.gender || "",
        dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
        phone: student.phone || user?.phone || "",
        email: user?.email || "",
        nin: student.nin || "",
        jambNumber: student.jambNumber || student.admissionNumber || "",
        stateOfOrigin: student.stateOfOrigin || "",
        lga: student.lga || "",
        guardianName: student.guardianName || "",
        guardianOccupation: student.guardianOccupation || "",
        guardianPhone: student.guardianPhone || "",
        guardianAddress: student.guardianAddress || "",
        kinName: student.kinName || "",
        kinPhone: student.kinPhone || "",
        kinAddress: student.kinAddress || "",
    });

    const handlePrint = () => {
        window.print();
    };

    const handleSaveDossier = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSaving(true);
        const res = await saveStudentDossierAction(form);
        setSaving(false);
        if (res.success) {
            toast.success(res.message || "Student Dossier saved successfully.");
            setIsEditing(false);
            router.refresh();
        } else {
            setError(res.error || "Please fill in all required fields.");
            toast.error(res.error || "Please fill in all required fields.");
        }
    };

    const fullName = `${student.lastName || ''} ${student.firstName || ''} ${student.otherNames || ''}`.trim() || user?.name || "Student";
    const photoUrl = student.imageUrl ? (viewableAssetUrl(student.imageUrl) || student.imageUrl) : null;
    const sessionName = currentSession?.name || "2026/2027";
    const refCode = `FSS-DOS-${student.id}-${sessionName.replace('/', '-')}`;

    if (isEditing && !isStaffView) {
        return (
            <div className="min-h-screen bg-slate-100 py-8 px-4 text-slate-900">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl flex items-center gap-1.5">
                            <ArrowLeft className="w-4 h-4" /> View Printable Dossier
                        </Button>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                            All Fields Marked * Are Compulsory
                        </span>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">Edit Official Student Dossier</h2>
                        <p className="text-sm text-slate-500 mb-6">Ensure all personal, guardian, and next-of-kin fields are filled accurately before saving and printing.</p>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm text-red-700 font-medium">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveDossier} className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white bg-emerald-700 px-4 py-2 rounded-t-xl">Section 1: Personal Bio-Data</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 border border-t-0 border-slate-200 rounded-b-xl bg-slate-50/50">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Surname / Last Name *</label>
                                        <input required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">First Name *</label>
                                        <input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Other Names</label>
                                        <input value={form.otherNames} onChange={e => setForm({...form, otherNames: e.target.value})} placeholder="Middle name (optional)" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender *</label>
                                        <select required value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium">
                                            <option value="">Select Gender...</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Date of Birth *</label>
                                        <input required type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number *</label>
                                        <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="e.g. 08012345678" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Address *</label>
                                        <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">NIN (11 Digits) *</label>
                                        <input required maxLength={11} value={form.nin} onChange={e => setForm({...form, nin: e.target.value.replace(/\D/g, '').slice(0, 11)})} placeholder="11-digit NIN" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">JAMB / Admission No *</label>
                                        <input required value={form.jambNumber} onChange={e => setForm({...form, jambNumber: e.target.value.toUpperCase()})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">State of Origin *</label>
                                        <select required value={form.stateOfOrigin} onChange={e => setForm({...form, stateOfOrigin: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium">
                                            <option value="">Select State...</option>
                                            {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Local Government Area (LGA) *</label>
                                        <input required value={form.lga} onChange={e => setForm({...form, lga: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white bg-emerald-700 px-4 py-2 rounded-t-xl">Section 2: Parent / Guardian Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 border border-t-0 border-slate-200 rounded-b-xl bg-slate-50/50">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Guardian Full Name *</label>
                                        <input required value={form.guardianName} onChange={e => setForm({...form, guardianName: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Occupation *</label>
                                        <input required value={form.guardianOccupation} onChange={e => setForm({...form, guardianOccupation: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Guardian Phone *</label>
                                        <input required value={form.guardianPhone} onChange={e => setForm({...form, guardianPhone: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Guardian Residential Address *</label>
                                        <input required value={form.guardianAddress} onChange={e => setForm({...form, guardianAddress: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white bg-emerald-700 px-4 py-2 rounded-t-xl">Section 3: Next of Kin Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 border border-t-0 border-slate-200 rounded-b-xl bg-slate-50/50">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Next of Kin Full Name *</label>
                                        <input required value={form.kinName} onChange={e => setForm({...form, kinName: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Next of Kin Phone *</label>
                                        <input required value={form.kinPhone} onChange={e => setForm({...form, kinPhone: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Next of Kin Address *</label>
                                        <input required value={form.kinAddress} onChange={e => setForm({...form, kinAddress: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl px-6">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-8 flex items-center gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {saving ? "Saving Dossier..." : "Save & View Printable Dossier"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen print:min-h-0 bg-slate-100 py-8 px-4 print:p-0 print:bg-white text-slate-900">
            <style>{`@media print { @page { size: A4 portrait; margin: 8mm; } html, body { height: auto !important; } .one-page-print { zoom: 0.66; break-inside: avoid; page-break-inside: avoid; page-break-after: avoid; } }`}</style>
            <div className="max-w-4xl mx-auto space-y-6 one-page-print">
                {/* Action Bar (Hidden on Print) */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.history.back()}
                            className="rounded-xl flex items-center gap-1.5"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                        {!isStaffView && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="rounded-xl flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700"
                            >
                                <Edit3 className="w-4 h-4" /> Edit / Update Dossier
                            </Button>
                        )}
                    </div>
                    <Button 
                        onClick={handlePrint}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 px-6"
                    >
                        <Printer className="w-4 h-4" /> Print Student Dossier
                    </Button>
                </div>

                {/* Printable Dossier Sheet */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-12 print:p-0 print:shadow-none print:border-none print:rounded-none">
                    {/* Institutional Header */}
                    <div className="border-b-4 border-emerald-700 pb-6 mb-8 text-center relative">
                        <div className="flex items-center justify-center gap-4 mb-3">
                            <img src="/fss_logo.png" alt="FSS Logo" className="w-20 h-20 object-contain" />
                            <div className="text-center">
                                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
                                    Federal School of Statistics, Ibadan
                                </h1>
                                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
                                    (An Institution of the National Bureau of Statistics)
                                </p>
                                <p className="text-xs font-medium text-slate-500">
                                    P.M.B. 5065, Sango, Ibadan, Oyo State, Nigeria
                                </p>
                            </div>
                        </div>
                        <div className="inline-block bg-emerald-700 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mt-2">
                            Official Student Bio-Data & Academic Dossier • Session {sessionName}
                        </div>
                        <div className="absolute right-0 top-0 text-right hidden sm:block">
                            <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Reference</div>
                            <div className="text-xs font-mono font-bold text-slate-700">{refCode}</div>
                        </div>
                    </div>

                    {/* Top Identity Block */}
                    <div className="grid grid-cols-12 gap-6 items-start mb-8 pb-6 border-b border-slate-200">
                        {/* Passport Photo */}
                        <div className="col-span-12 sm:col-span-3 flex flex-col items-center sm:items-start">
                            <div className="w-36 h-44 bg-slate-50 border-2 border-slate-300 rounded-xl overflow-hidden relative shadow-sm flex items-center justify-center">
                                {photoUrl ? (
                                    <img src={photoUrl} alt="Student Photo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-300 p-4 text-center">
                                        <User className="w-12 h-12 mb-1" />
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Passport Photo</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-center sm:text-left">
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wider inline-block">
                                    {student.status === 'active' ? 'Active Student' : (student.status?.replace('_', ' ') || 'Registered')}
                                </span>
                            </div>
                        </div>

                        {/* Core Summary Info */}
                        <div className="col-span-12 sm:col-span-9 space-y-3">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name (Surname First)</span>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{fullName}</h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Matriculation No.</span>
                                    <span className="text-sm font-black font-mono text-indigo-700">{student.matricNumber || 'NOT YET ASSIGNED'}</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Application / JAMB No.</span>
                                    <span className="text-sm font-bold font-mono text-slate-800">{student.jambNumber || student.admissionNumber || 'N/A'}</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Current Level</span>
                                    <span className="text-sm font-bold text-slate-800 uppercase">
                                        {student.programmeType || ''} {student.currentLevel || 1}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Programme of Study</span>
                                    <span className="text-sm font-bold text-slate-800">{programme?.name || 'Not Assigned'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Department</span>
                                    <span className="text-sm font-bold text-slate-800">{department?.name || 'Not Assigned'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 1: PERSONAL & BIO-DATA */}
                    <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white bg-slate-800 px-3 py-1.5 rounded-md mb-3">
                            Section 1: Personal & Demographic Information
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Gender</span>
                                <span className="font-bold text-slate-800 capitalize">{student.gender || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Date of Birth</span>
                                <span className="font-bold text-slate-800">{student.dob || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">National ID (NIN)</span>
                                <span className="font-mono font-bold text-slate-800">{student.nin || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Nationality</span>
                                <span className="font-bold text-slate-800">{student.nationality || 'Nigerian'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">State of Origin</span>
                                <span className="font-bold text-slate-800">{student.stateOfOrigin || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Local Govt. (LGA)</span>
                                <span className="font-bold text-slate-800">{student.lga || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Blood Group</span>
                                <span className="font-bold text-slate-800">{student.bloodGroup || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Genotype</span>
                                <span className="font-bold text-slate-800">{student.genotype || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: ACADEMIC PROFILE */}
                    <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white bg-slate-800 px-3 py-1.5 rounded-md mb-3">
                            Section 2: Institutional Academic Profile
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Mode of Study</span>
                                <span className="font-bold text-slate-800 capitalize">{student.studyMode || 'Full-time'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Mode of Entry</span>
                                <span className="font-bold text-slate-800">{student.modeOfEntry || 'Full Time'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Admission Session</span>
                                <span className="font-bold text-slate-800">{admissionSession?.name || student.admissionYear || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Current Session</span>
                                <span className="font-bold text-slate-800">{sessionName}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: CONTACT & RESIDENTIAL */}
                    <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white bg-slate-800 px-3 py-1.5 rounded-md mb-3">
                            Section 3: Contact & Residential Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Student Email Address</span>
                                <span className="font-bold text-slate-800">{user?.email || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Student Mobile Phone</span>
                                <span className="font-bold text-slate-800">{user?.phone || 'N/A'}</span>
                            </div>
                            <div className="sm:col-span-2">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Residential / Permanent Address</span>
                                <span className="font-medium text-slate-800">{student.guardianAddress || student.kinAddress || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: NEXT OF KIN & GUARDIAN */}
                    <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white bg-slate-800 px-3 py-1.5 rounded-md mb-3">
                            Section 4: Next of Kin & Guardian Records
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-500 block">Next of Kin Details</span>
                                <p><strong className="text-slate-500">Name:</strong> <span className="font-bold">{student.kinName || 'N/A'}</span></p>
                                <p><strong className="text-slate-500">Phone:</strong> <span>{student.kinPhone || 'N/A'}</span></p>
                                <p><strong className="text-slate-500">Address:</strong> <span>{student.kinAddress || 'N/A'}</span></p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-500 block">Parent / Guardian Details</span>
                                <p><strong className="text-slate-500">Name:</strong> <span className="font-bold">{student.guardianName || student.kinName || 'N/A'}</span></p>
                                <p><strong className="text-slate-500">Phone:</strong> <span>{student.guardianPhone || student.kinPhone || 'N/A'}</span></p>
                                <p><strong className="text-slate-500">Address:</strong> <span>{student.guardianAddress || student.kinAddress || 'N/A'}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: HEALTH & STATUTORY STATUS */}
                    <div className="mb-8">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white bg-slate-800 px-3 py-1.5 rounded-md mb-3">
                            Section 5: Health & Institutional Clearances
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Medical Form</span>
                                <span className={`font-bold ${student.medicalFormSubmittedAt ? 'text-emerald-700' : 'text-amber-600'}`}>
                                    {student.medicalFormSubmittedAt ? 'Submitted & Cleared' : 'Pending Submission'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Matriculation Oath</span>
                                <span className={`font-bold ${student.oathSignedAt || matricRecord ? 'text-emerald-700' : 'text-amber-600'}`}>
                                    {student.oathSignedAt || matricRecord ? 'Signed & Verified' : 'Pending Signing'}
                                </span>
                            </div>
                            <div className="sm:col-span-2">
                                <span className="text-slate-400 font-bold uppercase block text-[10px]">Health Notes / Allergies</span>
                                <span className="font-medium text-slate-800">{medicalRecord?.allergies || student.ailments || 'None Recorded'}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 6: ATTESTATION & SIGNATURES */}
                    <div className="pt-6 border-t-2 border-slate-300">
                        <p className="text-[11px] text-slate-600 italic leading-relaxed mb-8">
                            I solemnly declare that the particulars provided above in this official student dossier are complete, 
                            truthful, and correct. I accept that any false declaration or deliberate withholding of relevant facts may 
                            lead to immediate disqualification or forfeiture of my admission/studentship in the Federal School of Statistics, Ibadan.
                        </p>

                        <div className="grid grid-cols-3 gap-8 pt-4 items-end text-center">
                            <div className="space-y-2">
                                <div className="border-b border-slate-400 h-12 flex items-center justify-center">
                                    {student.signatureUrl ? (
                                        <img src={viewableAssetUrl(student.signatureUrl) || student.signatureUrl} alt="Signature" className="max-h-10 object-contain" />
                                    ) : matricRecord?.oathSignature ? (
                                        <img src={matricRecord.oathSignature} alt="Oath Signature" className="max-h-10 object-contain" />
                                    ) : null}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Student&rsquo;s Signature & Date</span>
                            </div>

                            <div className="space-y-2">
                                <div className="border-b border-slate-400 h-12"></div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Head of Department / Officer</span>
                            </div>

                            <div className="space-y-2">
                                <div className="border-b border-slate-400 h-12 flex items-center justify-center">
                                    <div className="text-[10px] font-black text-slate-400 border-2 border-dashed border-slate-300 px-3 py-1 rounded">
                                        OFFICIAL STAMP / SEAL
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Registrar&rsquo;s Office & Stamp</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
