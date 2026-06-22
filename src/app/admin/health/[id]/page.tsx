"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Activity,
    CheckCircle2,
    XCircle,
    FileText,
    Loader2,
    ArrowLeft,
    Heart,
    User,
    ShieldCheck,
    AlertCircle,
    Calendar,
    Stethoscope
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { getStudentHealthData, recordStudentVitals, verifyHealthReport, updateHealthStatus, updateAppointmentStatus } from "@/actions/health";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StudentMedicalReviewPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [healthData, setHealthData] = useState<any>(null);
    const [isSubmittingVitals, setIsSubmittingVitals] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Vitals form
    const [vitals, setVitals] = useState({
        weight: "",
        height: "",
        bloodPressure: "",
        pulse: "",
        temperature: "",
        respiratoryRate: "",
        oxygenSaturation: "",
        notes: ""
    });

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getStudentHealthData(parseInt(id as string));
        if (res.success) {
            setHealthData(res.data);
        } else {
            toast.error(res.error || "Failed to load data");
        }
        setLoading(false);
    };

    const handleRecordVitals = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingVitals(true);
        const res = await recordStudentVitals({
            studentId: parseInt(id as string),
            recordedBy: (session?.user as any).id,
            weight: parseFloat(vitals.weight),
            height: parseFloat(vitals.height),
            bloodPressure: vitals.bloodPressure,
            pulse: parseInt(vitals.pulse),
            temperature: parseFloat(vitals.temperature),
            respiratoryRate: parseInt(vitals.respiratoryRate),
            oxygenSaturation: parseInt(vitals.oxygenSaturation),
            notes: vitals.notes
        });
        if (res.success) {
            toast.success("Vital signs recorded");
            setVitals({
                weight: "", height: "", bloodPressure: "", pulse: "",
                temperature: "", respiratoryRate: "", oxygenSaturation: "", notes: ""
            });
            fetchData();
        } else {
            toast.error(res.error || "Failed to record");
        }
        setIsSubmittingVitals(false);
    };

    const handleVerifyReport = async (reportId: number, status: 'verified' | 'rejected') => {
        const reason = status === 'rejected' ? prompt("Reason for rejection:") : undefined;
        if (status === 'rejected' && !reason) return;

        const res = await verifyHealthReport(reportId, (session?.user as any).id, status, reason || undefined);
        if (res.success) {
            toast.success(`Report ${status}`);
            fetchData();
        } else {
            toast.error(res.error);
        }
    };

    const handleUpdateAppointment = async (appointmentId: number, status: any) => {
        const doctorNotes = status === 'completed' ? prompt("Enter consultation notes / findings:") : undefined;
        const res = await updateAppointmentStatus(appointmentId, status, undefined, doctorNotes || undefined);
        if (res.success) {
            toast.success("Appointment updated");
            fetchData();
        } else {
            toast.error(res.error);
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>;
    if (!healthData) return <div className="p-20 text-center font-bold text-rose-500">Student not found</div>;

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-10 pb-20">
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="w-14 h-14 rounded-2xl bg-white shadow-xl shadow-slate-100 hover:bg-slate-50 transition-all"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </Button>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 transition-all uppercase italic">
                        <Activity className="w-10 h-10 text-indigo-600" />
                        Medical Review
                    </h1>
                    <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px] italic">
                        Student: {healthData.firstName} {healthData.lastName} • {healthData.matricNumber || 'NO MATRIC'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left: Document Verification & History */}
                <div className="lg:col-span-2 space-y-10">
                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                        <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/50">
                            <CardTitle className="text-xl font-black italic uppercase text-slate-800 flex items-center gap-3">
                                <FileText className="w-6 h-6 text-indigo-500" />
                                Submitted Test Reports
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-6">
                            {healthData.healthRecords?.map((record: any) => (
                                <div key={record.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100 shadow-sm">
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h5 className="font-black text-lg text-slate-800 uppercase italic leading-none mb-1">{record.title}</h5>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.type} • Uploaded {new Date(record.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-white"
                                        >
                                            <a href={record.fileUrl} target="_blank">View File</a>
                                        </Button>
                                        {record.status === 'pending' ? (
                                            <>
                                                <Button
                                                    onClick={() => handleVerifyReport(record.id, 'verified')}
                                                    className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-[10px] tracking-widest text-white shadow-lg shadow-emerald-100"
                                                >
                                                    Verify
                                                </Button>
                                                <Button
                                                    onClick={() => handleVerifyReport(record.id, 'rejected')}
                                                    variant="ghost"
                                                    className="h-12 px-6 rounded-xl text-rose-600 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest"
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        ) : (
                                            <span className={cn(
                                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest italic",
                                                record.status === 'verified' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                            )}>
                                                {record.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!healthData.healthRecords || healthData.healthRecords.length === 0) && (
                                <div className="text-center py-20 text-slate-300 italic flex flex-col items-center gap-4">
                                    <FileText className="w-12 h-12 opacity-20" />
                                    <p className="font-bold tracking-widest text-xs uppercase">No medical documents submitted</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                        <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-black italic uppercase text-slate-800 flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-emerald-500" />
                                Scheduled Clinic Visits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {healthData.appointments?.length === 0 ? (
                                <div className="p-20 text-center text-slate-300 italic">
                                    <p className="font-bold tracking-widest text-xs uppercase">No appointments requested</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {healthData.appointments?.map((app: any) => (
                                        <div key={app.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="text-center min-w-[60px] p-4 bg-slate-50 rounded-2xl border border-slate-100 italic font-black">
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-tighter">{new Date(app.appointmentDate).toLocaleString('default', { month: 'short' })}</p>
                                                    <p className="text-xl text-indigo-600">{new Date(app.appointmentDate).getDate()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 italic uppercase">Visit Reason</p>
                                                    <p className="text-xs text-slate-500 max-w-md line-clamp-2">"{app.reason}"</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">{new Date(app.appointmentDate).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {app.status === 'pending' && (
                                                    <Button
                                                        onClick={() => handleUpdateAppointment(app.id, 'approved')}
                                                        className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[9px]"
                                                    >
                                                        Approve Slot
                                                    </Button>
                                                )}
                                                {app.status === 'approved' && (
                                                    <Button
                                                        onClick={() => handleUpdateAppointment(app.id, 'completed')}
                                                        className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-black text-white font-black uppercase tracking-widest text-[9px]"
                                                    >
                                                        Record Completion
                                                    </Button>
                                                )}
                                                <span className={cn(
                                                    "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic",
                                                    app.status === 'completed' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                                                        app.status === 'approved' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                            app.status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                                "bg-rose-50 text-rose-600 border border-rose-100"
                                                )}>
                                                    {app.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                        <CardHeader className="p-10 border-b border-slate-50">
                            <CardTitle className="text-xl font-black italic uppercase text-slate-800 flex items-center gap-3">
                                <Activity className="w-6 h-6 text-indigo-500" />
                                Historical Vitals Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest italic border-b border-slate-50">
                                        <th className="px-10 py-6">Date</th>
                                        <th className="px-10 py-6">BP</th>
                                        <th className="px-10 py-6">Weight/Height</th>
                                        <th className="px-10 py-6">Temp/Pulse</th>
                                        <th className="px-10 py-6">Officer</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {healthData.vitals?.map((v: any) => (
                                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-10 py-6">
                                                <span className="text-xs font-black text-slate-800 italic uppercase">{new Date(v.recordedAt).toLocaleDateString()}</span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className="text-sm font-black text-indigo-600 italic">{v.bloodPressure || '-'}</span>
                                            </td>
                                            <td className="px-10 py-6 text-xs font-bold text-slate-500">
                                                {v.weight}kg / {v.height}cm
                                            </td>
                                            <td className="px-10 py-6 text-xs font-bold text-slate-500">
                                                {v.temperature}°C / {v.pulse}bpm
                                            </td>
                                            <td className="px-10 py-6 text-xs font-black text-slate-400 italic uppercase">
                                                {v.recorder?.name || 'Medical Unit'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Vitals Recording & Student Snapshot */}
                <div className="space-y-10">
                    <Card className="border-none shadow-2xl rounded-[3rem] bg-indigo-600 text-white overflow-hidden shadow-indigo-100">
                        <CardHeader className="p-10 bg-indigo-700/50">
                            <CardTitle className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                <Stethoscope className="w-6 h-6" />
                                New Vital Recording
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10">
                            <form onSubmit={handleRecordVitals} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-indigo-200 opacity-60">Weight (kg)</label>
                                        <Input
                                            value={vitals.weight}
                                            onChange={e => setVitals({ ...vitals, weight: e.target.value })}
                                            className="bg-white/10 border-none rounded-xl h-12 text-white font-black"
                                            placeholder="70"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-indigo-200 opacity-60">Height (cm)</label>
                                        <Input
                                            value={vitals.height}
                                            onChange={e => setVitals({ ...vitals, height: e.target.value })}
                                            className="bg-white/10 border-none rounded-xl h-12 text-white font-black"
                                            placeholder="180"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-indigo-200 opacity-60">BP (mmHg)</label>
                                        <Input
                                            value={vitals.bloodPressure}
                                            onChange={e => setVitals({ ...vitals, bloodPressure: e.target.value })}
                                            className="bg-white/10 border-none rounded-xl h-12 text-white font-black"
                                            placeholder="120/80"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-indigo-200 opacity-60">Pulse (bpm)</label>
                                        <Input
                                            value={vitals.pulse}
                                            onChange={e => setVitals({ ...vitals, pulse: e.target.value })}
                                            className="bg-white/10 border-none rounded-xl h-12 text-white font-black"
                                            placeholder="72"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-indigo-200 opacity-60">Temp (°C)</label>
                                        <Input
                                            value={vitals.temperature}
                                            onChange={e => setVitals({ ...vitals, temperature: e.target.value })}
                                            className="bg-white/10 border-none rounded-xl h-12 text-white font-black"
                                            placeholder="36.5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-indigo-200 opacity-60">SpO2 (%)</label>
                                        <Input
                                            value={vitals.oxygenSaturation}
                                            onChange={e => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                                            className="bg-white/10 border-none rounded-xl h-12 text-white font-black"
                                            placeholder="98"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-indigo-200 opacity-60">Officer Observations</label>
                                    <Textarea
                                        value={vitals.notes}
                                        onChange={e => setVitals({ ...vitals, notes: e.target.value })}
                                        className="bg-white/10 border-none rounded-2xl min-h-[100px] text-white font-medium"
                                        placeholder="Note any abnormalities..."
                                    />
                                </div>
                                <Button
                                    className="w-full h-16 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase tracking-[0.2em] text-xs shadow-2xl"
                                    disabled={isSubmittingVitals}
                                >
                                    {isSubmittingVitals ? <Loader2 className="w-4 h-4 animate-spin" /> : "Store Vital Signs"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10 space-y-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic mb-6">Patient Snapshot</h4>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-50">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genotype / Blood</p>
                                    <p className="text-base font-black italic text-slate-800">{healthData.genotype || '??'} / {healthData.bloodGroup || '??'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flagged Allergies</p>
                                    <p className="text-xs font-bold text-rose-500 italic bg-rose-50 p-4 rounded-xl">{healthData.foodAllergies || 'None Documented'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Clearance Actions</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={() => updateHealthStatus(parseInt(id as string), 'cleared')}
                                    className="h-14 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 font-black uppercase text-[10px] tracking-widest shadow-sm"
                                >
                                    Set Cleared
                                </Button>
                                <Button
                                    onClick={() => updateHealthStatus(parseInt(id as string), 'flagged')}
                                    className="h-14 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 font-black uppercase text-[10px] tracking-widest shadow-sm"
                                >
                                    Set Flagged
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
