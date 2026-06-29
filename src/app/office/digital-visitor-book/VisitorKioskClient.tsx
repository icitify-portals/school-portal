"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogIn, LogOut, UserCheck, ShieldCheck, Building2, User } from "lucide-react";
import { kioskCheckInAction, kioskCheckOutAction, getOfficeVisitorsAction } from "@/actions/visitor-kiosk";

export default function VisitorKioskClient() {
    const [officeName, setOfficeName] = useState("");
    const [isSetup, setIsSetup] = useState(false);

    const [activeFlow, setActiveFlow] = useState<"home" | "checkin" | "checkout">("home");
    const [submitting, setSubmitting] = useState(false);

    const [activeVisitors, setActiveVisitors] = useState<any[]>([]);

    useEffect(() => {
        if (isSetup && activeFlow === 'checkout') {
            loadVisitors();
        }
    }, [isSetup, activeFlow]);

    async function loadVisitors() {
        const res = await getOfficeVisitorsAction(officeName);
        if (res.visitors) setActiveVisitors(res.visitors);
    }

    async function handleSetup(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setOfficeName(formData.get("officeName") as string);
        setIsSetup(true);
    }

    async function handleCheckIn(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            phone: formData.get("phone") as string,
            purpose: formData.get("purpose") as string,
            destinationType: 'office' as any,
            destinationName: officeName,
        };

        const res = await kioskCheckInAction(data);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(res.message);
            setActiveFlow("home");
        }
        setSubmitting(false);
    }

    async function handleCheckOut(destinationId: number) {
        setSubmitting(true);
        const res = await kioskCheckOutAction(destinationId);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(res.message);
            loadVisitors();
        }
        setSubmitting(false);
    }

    if (!isSetup) {
        return (
            <Card className="w-full max-w-md p-8 rounded-[2.5rem] shadow-xl bg-white border-slate-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl mb-4">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest text-center">Setup Visitor Kiosk</h2>
                </div>
                <form onSubmit={handleSetup} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Office / Destination Name</Label>
                        <Input name="officeName" autoFocus required placeholder="e.g., Dean's Office, HR Dept" className="h-14 rounded-2xl border-slate-200" />
                        <p className="text-[10px] text-slate-400">This tablet will be locked to this office name for tracking.</p>
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-950 text-white font-black uppercase tracking-widest text-[10px] transition-all">
                        Launch Kiosk Mode
                    </Button>
                </form>
            </Card>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col justify-center">
            {activeFlow === "home" && (
                <div className="text-center space-y-12 animate-in fade-in zoom-in-95 duration-500">
                    <div>
                        <div className="mx-auto p-6 bg-emerald-50 text-emerald-600 rounded-[2.5rem] w-fit mb-6 shadow-sm">
                            <ShieldCheck className="w-16 h-16" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{officeName}</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-4">Digital Visitor Logbook</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <Card 
                            onClick={() => setActiveFlow("checkin")}
                            className="p-8 rounded-[2.5rem] border-2 border-emerald-100 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer bg-white group"
                        >
                            <LogIn className="w-12 h-12 text-emerald-600 mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-black text-slate-800">Check In</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">I am a new visitor</p>
                        </Card>
                        
                        <Card 
                            onClick={() => setActiveFlow("checkout")}
                            className="p-8 rounded-[2.5rem] border-2 border-blue-100 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer bg-white group"
                        >
                            <LogOut className="w-12 h-12 text-blue-600 mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-black text-slate-800">Check Out</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">I am leaving the office</p>
                        </Card>
                    </div>
                </div>
            )}

            {activeFlow === "checkin" && (
                <Card className="w-full max-w-2xl mx-auto p-8 md:p-12 rounded-[2.5rem] shadow-2xl border-none bg-white animate-in slide-in-from-bottom-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Visitor Check-In</h2>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{officeName}</p>
                        </div>
                        <Button variant="ghost" onClick={() => setActiveFlow("home")} className="text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                    </div>

                    <form onSubmit={handleCheckIn} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[12px] font-black uppercase tracking-widest text-slate-500">Full Name</Label>
                            <Input name="name" autoFocus required placeholder="Your full name" className="h-16 text-lg rounded-[1.5rem] border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[12px] font-black uppercase tracking-widest text-slate-500">Phone Number (Optional)</Label>
                            <Input name="phone" placeholder="Your contact number" className="h-16 text-lg rounded-[1.5rem] border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[12px] font-black uppercase tracking-widest text-slate-500">Purpose of Visit</Label>
                            <Input name="purpose" required placeholder="Who are you here to see?" className="h-16 text-lg rounded-[1.5rem] border-slate-200" />
                        </div>
                        
                        <Button disabled={submitting} type="submit" className="w-full h-16 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs transition-all mt-4">
                            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Check-In"}
                        </Button>
                    </form>
                </Card>
            )}

            {activeFlow === "checkout" && (
                <Card className="w-full max-w-3xl mx-auto p-8 md:p-12 rounded-[2.5rem] shadow-2xl border-none bg-white animate-in slide-in-from-bottom-8">
                    <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Select to Check Out</h2>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Currently checked in at {officeName}</p>
                        </div>
                        <Button variant="ghost" onClick={() => setActiveFlow("home")} className="text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                    </div>

                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        {activeVisitors.length === 0 ? (
                            <div className="text-center py-12">
                                <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active visitors to check out.</p>
                            </div>
                        ) : (
                            activeVisitors.map(v => (
                                <div key={v.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white text-slate-400 rounded-xl shadow-sm">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 text-lg">{v.visitor?.name}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{v.purpose}</div>
                                        </div>
                                    </div>
                                    <Button 
                                        disabled={submitting} 
                                        onClick={() => handleCheckOut(v.id)} 
                                        className="h-12 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Check Out
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
