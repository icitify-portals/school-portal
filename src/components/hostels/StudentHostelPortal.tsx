"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Home, Info, CheckCircle, Clock,
    AlertCircle, Landmark, Sparkles, Building, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { applyForHostel, processHostelPayment } from "@/actions/hostels";
import { toast } from "sonner";
import { format } from "date-fns";
import MaintenanceReporting from "./MaintenanceReporting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench } from "lucide-react";

export default function StudentHostelPortal({
    availableHostels,
    application,
    studentLevel,
    hostelSettings
}: {
    availableHostels: any[],
    application: any,
    studentLevel: number,
    hostelSettings?: any
}) {
    const [applying, setApplying] = useState<number | null>(null);
    const [paying, setPaying] = useState(false);

    const handleApply = async (hostelId: number) => {
        setApplying(hostelId);
        const res = await applyForHostel(hostelId);
        if (res.success) {
            toast.success(res.message);
            window.location.reload();
        } else {
            toast.error(res.error);
        }
        setApplying(null);
    };

    const handlePayment = async () => {
        setPaying(true);
        const res = await processHostelPayment(application.id);
        if (res.success) {
            toast.success("Payment processed successfully via Remita!");
            window.location.reload();
        } else {
            toast.error(res.error);
        }
        setPaying(false);
    };

    const isPriority = studentLevel === 100 || studentLevel >= 400; // Simplified final year check

    if (application) {
        return (
            <div className="space-y-10 animate-in fade-in duration-700 text-slate-850">
                <Tabs defaultValue="overview" className="w-full">
                    <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-2 rounded-[2rem] border border-white/40 mb-10 shadow-sm">
                        <TabsList className="bg-transparent border-none">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-[1.5rem] px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 text-slate-705 transition-all">
                                <Home className="w-4 h-4" /> Overview
                            </TabsTrigger>
                            <TabsTrigger value="maintenance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-[1.5rem] px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 text-slate-705 transition-all">
                                <Wrench className="w-4 h-4" /> Maintenance
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="space-y-10 outline-none mt-0">
                        <div className="bg-white/60 backdrop-blur-3xl p-8 lg:p-10 rounded-[3rem] shadow-xl border border-white/40 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-events-none" />
                            <div className={cn(
                                "w-20 h-20 rounded-[1.8rem] flex items-center justify-center shadow-lg transition-all duration-500 relative z-10",
                                application.status === 'allocated' ? "bg-emerald-650 text-white shadow-emerald-500/20" : "bg-indigo-600 text-white shadow-indigo-500/20"
                            )}>
                                <Home className="w-10 h-10 drop-shadow-sm" />
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-3 relative z-10">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">Accommodation Status</h3>
                                    <Badge className={cn(
                                        "rounded-full uppercase text-[10px] font-black px-5 py-2 tracking-widest border shadow-sm",
                                        application.status === 'allocated' ? "bg-emerald-50 border-emerald-250 text-emerald-600 shadow-sm" : "bg-indigo-50 border-indigo-250 text-indigo-600 shadow-sm"
                                    )}>
                                        {application.status}
                                    </Badge>
                                </div>
                                <p className="text-slate-650 font-bold uppercase tracking-wider text-xs max-w-lg opacity-85">
                                    {application.status === 'pending' && "Your application is currently under review by the Hall Warden."}
                                    {application.status === 'approved' && "Approved! Please proceed to payment to secure your slot."}
                                    {application.status === 'allocated' && `Success! You have been allocated to ${application.hostel.name}.`}
                                </p>
                            </div>

                            <div className="w-full md:w-auto relative z-10">
                                {application.status === 'approved' && application.paymentStatus === 'unpaid' && (
                                    <Button className="w-full h-14 px-10 rounded-[1.5rem] bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-xs shadow-xl gap-3 border border-slate-800 text-white transition-all active:scale-95">
                                        <Landmark className="w-4 h-4" />
                                        Pay Application Fee
                                    </Button>
                                )}
                                {application.status === 'allocated' && (
                                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                                        <div className="bg-emerald-600/10 border border-emerald-500/30 p-6 rounded-[2rem] text-center flex-1 shadow-inner min-w-[160px]">
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1 opacity-80">Room Assigned</p>
                                            <p className="text-2xl font-black text-emerald-900">Room {application.room?.roomNumber || '---'}</p>
                                        </div>
                                        {application.checkedInAt && (
                                            <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-[2rem] text-center flex-1 shadow-inner min-w-[160px]">
                                                <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1 opacity-80">Digital Check-in</p>
                                                <p className="text-sm font-black text-indigo-900">{format(new Date(application.checkedInAt), 'MMM dd, HH:mm')}</p>
                                            </div>
                                        )}
                                        {application.checkedOutAt && (
                                            <div className="bg-slate-100 border border-slate-200 p-6 rounded-[2rem] text-center flex-1 opacity-60 min-w-[160px]">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Checked Out</p>
                                                <p className="text-sm font-black text-slate-700">{format(new Date(application.checkedOutAt), 'MMM dd, HH:mm')}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(!hostelSettings || hostelSettings.paymentMode === 'standalone') ? (
                                <Card className="p-8 border border-white/40 shadow-xl bg-white/60 backdrop-blur-3xl rounded-[3rem] space-y-6">
                                    <h4 className="font-black text-indigo-900 uppercase tracking-widest text-xs flex items-center gap-2 drop-shadow-sm">
                                        <Clock className="w-4 h-4" /> Deadlines & Expiry
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-indigo-100/50">
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Applied Date</span>
                                            <span className="text-sm font-black text-indigo-900">{format(new Date(application.appliedAt), 'MMM dd, yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Payment Deadline</span>
                                            <span className="text-sm font-black text-red-600">
                                                {application.paymentDeadline ? format(new Date(application.paymentDeadline), 'MMM dd, HH:mm') : '---'}
                                            </span>
                                        </div>
                                    </div>
                                    {application.paymentStatus === 'unpaid' && application.status === 'allocated' && (
                                        <Button 
                                            onClick={handlePayment} 
                                            disabled={paying}
                                            className="w-full mt-4 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg font-black tracking-widest uppercase text-xs active:scale-95 border border-white/10"
                                        >
                                            {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay Hostel Fee (₦${hostelSettings?.hostelFee || '0.00'})`}
                                        </Button>
                                    )}
                                    {application.paymentStatus === 'paid' && (
                                        <div className="w-full mt-4 h-14 bg-emerald-50 border border-emerald-250 text-emerald-700 flex items-center justify-center rounded-2xl font-black tracking-widest uppercase text-xs gap-2 shadow-sm">
                                            <CheckCircle className="w-5 h-5" /> Paid Successfully
                                        </div>
                                    )}
                                </Card>
                            ) : (
                                <Card className="p-8 border border-white/40 shadow-xl bg-white/60 backdrop-blur-3xl rounded-[3rem] space-y-4 flex flex-col justify-center text-center">
                                    <div className="w-14 h-14 bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-[1.2rem] flex items-center justify-center mx-auto shadow-inner">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-black text-indigo-900 uppercase tracking-widest text-xs mt-2">
                                        Bundled Fee Allocation
                                    </h4>
                                    <p className="text-xs font-bold text-slate-650 max-w-sm mx-auto leading-relaxed">
                                        Your hostel bed space is secured. The hostel fee is bundled with your main tuition invoice. Please ensure your tuition is paid to retain this room.
                                    </p>
                                </Card>
                            )}

                            <Card className="p-8 border border-white/40 shadow-xl bg-white/60 backdrop-blur-3xl rounded-[3rem] space-y-6">
                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2 drop-shadow-sm">
                                    <Info className="w-4 h-4 text-indigo-600" /> Hall Information
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-205">
                                        <span className="text-xs font-black text-slate-505 uppercase tracking-wider">Target Hall</span>
                                        <span className="text-sm font-black text-slate-900">{application.hostel.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs font-black text-slate-505 uppercase tracking-wider">Priority Applied</span>
                                        <Badge className="rounded-md uppercase text-[9px] font-black px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-sm">
                                            {application.isPriority ? 'YES' : 'NO'}
                                        </Badge>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="maintenance" className="outline-none mt-0">
                        <MaintenanceReporting />
                    </TabsContent>
                </Tabs>
            </div >
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            {/* Header / Info Section */}
            <div className="bg-indigo-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-white border border-indigo-950">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-650/30 to-indigo-805/30 opacity-50 mix-blend-overlay" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-500 rounded-[1rem] flex items-center justify-center shadow-inner">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight uppercase italic">Room Application Queue</h3>
                        </div>
                        <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider opacity-85 max-w-md leading-relaxed">
                            Apply for a bed space in our residential halls. {isPriority ? "Priority status detected: You are eligible for earlier consideration." : "Applications are processed on a first-come, first-served basis."}
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-center min-w-[200px]">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-indigo-200">Your Eligibility</p>
                        <p className="text-3xl font-black">{studentLevel} LEVEL</p>
                        <Badge className="mt-2 text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-sm">
                            {isPriority ? "Priority Eligible" : "Standard Entry"}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableHostels.map((h) => (
                    <Card key={h.id} className="relative overflow-hidden border border-white/40 shadow-xl bg-white/60 backdrop-blur-3xl group transition-all duration-500 hover:-translate-y-2 rounded-[3rem]">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="w-14 h-14 bg-white/80 rounded-[1.5rem] border border-slate-200 flex items-center justify-center shadow-inner">
                                    <Building className="w-7 h-7 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                                    <p className="text-sm font-black text-emerald-600 mt-1">AVAILABLE</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors italic uppercase">{h.name}</h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{h.type} RESIDENCE</p>
                            </div>

                            <div className="bg-white/85 p-5 rounded-[2rem] flex justify-between items-center shadow-inner border border-white/50">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                                    <p className="text-xl font-black text-slate-800">{h.capacity || 0} Slots</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-300" />
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Occupancy</p>
                                    <p className="text-xl font-black text-slate-800">{Math.round(((h.capacity - h.occupiedCount) / h.capacity) * 100) || 0}% Free</p>
                                </div>
                            </div>

                            <Button
                                onClick={() => handleApply(h.id)}
                                disabled={applying !== null}
                                className="w-full h-14 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-650/20 text-white gap-2 border border-indigo-500 transition-all active:scale-95"
                            >
                                {applying === h.id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Bed Space"}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {availableHostels.length === 0 && (
                <div className="py-32 text-center bg-white/60 backdrop-blur-3xl rounded-[3rem] border-4 border-dashed border-white/60 shadow-xl shadow-slate-200/50">
                    <div className="w-20 h-20 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <AlertCircle className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight mb-2 italic">No Available Hostels</h4>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs max-w-md mx-auto leading-relaxed">The housing registry for your gender or level is currently closed</p>
                </div>
            )}
        </div>
    );
}

function ArrowRight(props: any) {
    return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>;
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
