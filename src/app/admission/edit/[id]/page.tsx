"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Loader2, 
    Edit3, 
    AlertTriangle, 
    CheckCircle2, 
    ArrowRight, 
    ChevronLeft,
    Clock,
    CreditCard
} from "lucide-react";
import { getExamSlipData, requestEditAccess, confirmEditFinePayment, updateAdmissionApplication } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EditAdmissionPage() {
    const params = useParams();
    const router = useRouter();
    const id = parseInt(params.id as string);
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [access, setAccess] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    const [payingFine, setPayingFine] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const slip = await getExamSlipData(id);
        if (slip) {
            setData(slip);
            setFormData(JSON.parse(slip.formData || "{}"));
            const accessRes = await requestEditAccess(id);
            setAccess(accessRes);
        }
        setLoading(false);
    };

    const handleConfirmFine = async () => {
        const ref = prompt("Enter Fine Payment Reference:");
        if (!ref) return;
        setPayingFine(true);
        const res = await confirmEditFinePayment(id, ref);
        if (res.success) {
            toast.success("Payment confirmed! You now have a 24-hour edit window.");
            fetchData();
        } else {
            toast.error(res.error);
        }
        setPayingFine(false);
    };

    const handleUpdate = async () => {
        setSubmitting(true);
        const res = await updateAdmissionApplication(id, formData);
        if (res.success) {
            toast.success("Application updated successfully!");
            router.push(`/admission/slip/${id}`);
        } else {
            toast.error(res.error);
        }
        setSubmitting(false);
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!data) return <div className="min-h-screen flex justify-center items-center font-black text-2xl italic uppercase text-slate-300">Application Not Found</div>;

    if (access?.needsFine) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <Card className="max-w-xl w-full border-none shadow-2xl rounded-[3rem] p-12 text-center space-y-8 bg-white">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-12 h-12 text-amber-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-slate-900 italic uppercase leading-tight">Edit Window Closed</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">The deadline for free editing has passed.</p>
                    </div>
                    <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 space-y-4">
                        <p className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center justify-center gap-2">
                            <CreditCard className="w-4 h-4" /> Administrative Fine Required
                        </p>
                        <p className="text-sm font-bold text-amber-900 leading-relaxed italic">
                            To re-open your application for editing, you must pay an administrative fine of <span className="font-black">₦{access.fineAmount.toLocaleString()}</span>. 
                            This will grant you a <span className="font-black">24-hour window</span> to make changes.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => router.back()} className="flex-1 py-8 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</Button>
                        <Button onClick={handleConfirmFine} disabled={payingFine} className="flex-[2] bg-slate-900 text-white font-black py-8 rounded-2xl uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl">
                            {payingFine ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Payment"}
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white py-12 px-8">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Button variant="ghost" onClick={() => router.back()} className="rounded-2xl p-4 hover:bg-white/10 text-white">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black italic uppercase italic">Edit Application</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                                {data.template.name} • #{data.id}
                            </p>
                        </div>
                    </div>
                    {data.editWindowExpiresAt && (
                        <div className="px-6 py-3 bg-emerald-600 rounded-2xl flex items-center gap-3">
                            <Clock className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Window Expires: {format(new Date(data.editWindowExpiresAt), 'hh:mm a')}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-12 px-8 space-y-8">
                <Card className="border-none shadow-xl rounded-[3.5rem] overflow-hidden bg-white">
                    <CardContent className="p-12 space-y-12">
                        {data.template.sections.map((section: any) => (
                            <div key={section.id} className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                                    <h3 className="text-xl font-black text-slate-900 italic uppercase">{section.title}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {section.fields.map((field: any) => (
                                        <div key={field.id} className={cn("space-y-3", field.type === 'textarea' && "md:col-span-2")}>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{field.label}</label>
                                            {field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' ? (
                                                <input 
                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={formData[field.label] || ""}
                                                    onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                                                />
                                            ) : field.type === 'date' ? (
                                                <input 
                                                    type="date"
                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={formData[field.label] || ""}
                                                    onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                                                />
                                            ) : field.type === 'select' ? (
                                                <select 
                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                                    value={formData[field.label] || ""}
                                                    onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                                                >
                                                    <option value="">Select option...</option>
                                                    {field.options?.split(',').map((opt: string) => (
                                                        <option key={opt} value={opt.trim()}>{opt.trim()}</option>
                                                    ))}
                                                </select>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="pt-10 border-t border-slate-50 flex justify-end gap-4">
                            <Button variant="ghost" onClick={() => router.back()} className="px-10 py-8 rounded-2xl font-black uppercase text-xs tracking-widest">Discard Changes</Button>
                            <Button 
                                onClick={handleUpdate}
                                disabled={submitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-8 rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 flex gap-3"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Edit3 className="w-5 h-5" /> Save Updated Details</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
