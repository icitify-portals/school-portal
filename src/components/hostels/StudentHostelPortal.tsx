"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Home, Info, CheckCircle, Clock,
    AlertCircle, Landmark, Sparkles, Building, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { applyForHostel } from "@/actions/hostels";
import { toast } from "sonner";
import { format } from "date-fns";
import MaintenanceReporting from "./MaintenanceReporting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench } from "lucide-react";

export default function StudentHostelPortal({
    availableHostels,
    application,
    studentLevel
}: {
    availableHostels: any[],
    application: any,
    studentLevel: number
}) {
    const [applying, setApplying] = useState<number | null>(null);

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

    const isPriority = studentLevel === 100 || studentLevel >= 400; // Simplified final year check

    if (application) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <Tabs defaultValue="overview" className="w-full">
                    <div className="flex justify-between items-center bg-white/50 p-2 rounded-2xl border border-slate-100 mb-6">
                        <TabsList className="bg-transparent border-none">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest gap-2">
                                <Home className="w-3.5 h-3.5" /> Overview
                            </TabsTrigger>
                            <TabsTrigger value="maintenance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest gap-2">
                                <Wrench className="w-3.5 h-3.5" /> Maintenance
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="space-y-8 outline-none mt-0">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-8">
                            <div className={cn(
                                "w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-500",
                                application.status === 'allocated' ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
                            )}>
                                <Home className="w-10 h-10" />
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-2">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Accommodation Status</h3>
                                    <Badge className={cn(
                                        "rounded-xl uppercase text-[10px] font-black px-4 py-1.5 tracking-widest",
                                        application.status === 'allocated' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                                    )}>
                                        {application.status}
                                    </Badge>
                                </div>
                                <p className="text-slate-500 font-medium max-w-lg">
                                    {application.status === 'pending' && "Your application is currently under review by the Hall Warden."}
                                    {application.status === 'approved' && "Approved! Please proceed to payment to secure your slot."}
                                    {application.status === 'allocated' && `Success! You have been allocated to ${application.hostel.name}.`}
                                </p>
                            </div>

                            <div className="w-full md:w-auto">
                                {application.status === 'approved' && application.paymentStatus === 'unpaid' && (
                                    <Button className="w-full h-14 px-10 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-xs shadow-xl gap-3">
                                        <Landmark className="w-4 h-4" />
                                        Pay Application Fee
                                    </Button>
                                )}
                                {application.status === 'allocated' && (
                                    <div className="flex flex-col md:flex-row gap-4 items-center">
                                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center flex-1">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Room Assigned</p>
                                            <p className="text-xl font-black text-emerald-900">Room {application.room?.roomNumber || '---'}</p>
                                        </div>
                                        {application.checkedInAt && (
                                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-center flex-1">
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Digital Check-in</p>
                                                <p className="text-sm font-black text-indigo-900">{format(new Date(application.checkedInAt), 'MMM dd, HH:mm')}</p>
                                            </div>
                                        )}
                                        {application.checkedOutAt && (
                                            <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl text-center flex-1 opacity-60">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Checked Out</p>
                                                <p className="text-sm font-black text-slate-700">{format(new Date(application.checkedOutAt), 'MMM dd, HH:mm')}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-6 border-none shadow-sm bg-indigo-50/50 rounded-3xl space-y-4">
                                <h4 className="font-black text-indigo-900 uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Deadlines & Expiry
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-indigo-100/50">
                                        <span className="text-xs font-bold text-slate-500">Applied Date</span>
                                        <span className="text-sm font-black text-indigo-900">{format(new Date(application.appliedAt), 'MMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs font-bold text-slate-500">Payment Deadline</span>
                                        <span className="text-sm font-black text-red-600">
                                            {application.paymentDeadline ? format(new Date(application.paymentDeadline), 'MMM dd, HH:mm') : '---'}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 border-none shadow-sm bg-slate-50 rounded-3xl space-y-4">
                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Hall Information
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-xs font-bold text-slate-500">Target Hall</span>
                                        <span className="text-sm font-black text-slate-900">{application.hostel.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs font-bold text-slate-500">Priority Applied</span>
                                        <Badge variant={application.isPriority ? 'success' : 'outline'} className="rounded-md uppercase text-[9px] font-black">
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
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Header / Info Section */}
            <div className="bg-indigo-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight uppercase">Room Application Queue</h3>
                        </div>
                        <p className="text-indigo-200/50 text-sm font-medium max-w-md">
                            Apply for a bed space in our residential halls. {isPriority ? "Priority status detected: You are eligible for earlier consideration." : "Applications are processed on a first-come, first-served basis."}
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center min-w-[200px]">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Your Eligibility</p>
                        <p className="text-2xl font-black">{studentLevel} LEVEL</p>
                        <Badge variant={isPriority ? "success" : "secondary"} className="mt-2 text-[9px] font-black uppercase tracking-widest">
                            {isPriority ? "Priority Eligible" : "Standard Entry"}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableHostels.map((h) => (
                    <Card key={h.id} className="relative overflow-hidden border-none shadow-xl bg-white group transition-all duration-500 hover:-translate-y-2">
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                    <Building className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                                    <p className="text-sm font-black text-emerald-500">AVAILABLE</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{h.name}</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{h.type} RESIDENCE</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                                    <p className="text-lg font-black text-slate-900">{h.capacity || 0} Slots</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-200" />
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Occupancy</p>
                                    <p className="text-lg font-black text-slate-900">{Math.round(((h.capacity - h.occupiedCount) / h.capacity) * 100) || 0}% Free</p>
                                </div>
                            </div>

                            <Button
                                onClick={() => handleApply(h.id)}
                                disabled={applying !== null}
                                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 gap-2"
                            >
                                {applying === h.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Bed Space"}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {availableHostels.length === 0 && (
                <div className="py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-slate-200" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight mb-1">No Available Hostels</h4>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">The housing registry for your gender or level is currently closed</p>
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
