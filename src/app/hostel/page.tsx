"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, User, MapPin, CheckCircle2, Loader2, Wrench } from "lucide-react";
import { getHostelAllocation, applyForHostel, getHostels } from "@/actions/hostel";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function HostelPage() {
    const [allocation, setAllocation] = useState<any>(null);
    const [hostels, setHostels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [allocData, hostelsData] = await Promise.all([
            getHostelAllocation(),
            getHostels()
        ]);
        setAllocation(allocData);
        setHostels(hostelsData);
        setLoading(false);
    };

    const handleApply = async (hostelId: number) => {
        setApplying(true);
        const res = await applyForHostel(hostelId);
        if (res.success) {
            toast.success("Application submitted successfully!");
            fetchData();
        } else {
            toast.error(res.error || "Failed to apply");
        }
        setApplying(false);
    };

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hostel Accommodation</h2>
                    <p className="text-slate-500 font-medium">Manage your residence and maintenance requests.</p>
                </div>
                {allocation && (
                    <Button variant="outline" className="rounded-xl border-slate-200 font-bold gap-2">
                        <Wrench className="w-4 h-4 text-indigo-600" /> Maintenance Request
                    </Button>
                )}
            </div>

            {allocation ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-2xl">
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 h-40 flex items-center px-10 text-white relative">
                            <div className="z-10">
                                <Badge className="bg-white/20 text-white border-none mb-2 uppercase tracking-widest text-[10px] font-black">
                                    Current Residence
                                </Badge>
                                <h3 className="text-3xl font-black">{allocation.hostel?.name}</h3>
                                <p className="text-indigo-100 font-medium">{allocation.room?.block?.name || "Block Default"}</p>
                            </div>
                            <Home className="absolute right-10 top-1/2 -translate-y-1/2 w-32 h-32 text-white/10" />
                        </div>
                        <CardContent className="pt-10 px-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className="flex gap-5 items-center">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                                            <MapPin className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Room</p>
                                            <p className="text-xl font-black text-slate-900">{allocation.room?.roomNumber || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-5 items-center">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                                            <User className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bed Space</p>
                                            <p className="text-xl font-black text-slate-900">Assigned</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 rounded-2xl p-8 border border-slate-100">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Roommate Overview</h4>
                                    <div className="space-y-4">
                                        {["Occupant 1", "Occupant 2", "Occupant 3"].map(name => (
                                            <div key={name} className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 shadow-sm">
                                                    {name[0]}
                                                </div>
                                                <span className="text-sm font-bold text-slate-600">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl h-fit overflow-hidden">
                        <CardHeader className="bg-slate-50/50 pb-6">
                            <CardTitle className="text-lg font-black text-slate-900">Session Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-400">Academic Year</span>
                                    <span className="font-black text-slate-800">{allocation.session?.name || "2024/2025"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-400">Date Allocated</span>
                                    <span className="font-black text-slate-800">{new Date(allocation.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-400">Status</span>
                                        <Badge className="bg-emerald-500 text-white border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                                            Active
                                        </Badge>
                                    </div>
                                </div>
                                <Button variant="ghost" className="w-full mt-6 text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold rounded-xl">
                                    Request Exit
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto">
                    <Card className="border-none bg-white shadow-2xl shadow-indigo-100/50 rounded-[2.5rem] overflow-hidden">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center px-10">
                            <div className="w-24 h-24 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                                <Home className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Apply for Housing</h3>
                            <p className="text-slate-500 font-medium max-w-sm mt-4 mb-10 leading-relaxed">
                                Experience campus life to the fullest. Choose a hall of residence that fits your preferences.
                            </p>
                            
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 px-10 h-16 rounded-2xl text-lg font-black shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
                                        Apply for Accommodation
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black">Select a Hall</DialogTitle>
                                        <DialogDescription className="font-medium">
                                            Choose your preferred hostel. Allocation depends on availability.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        {hostels.map((hostel) => (
                                            <Button
                                                key={hostel.id}
                                                variant="outline"
                                                className="h-20 justify-start px-6 rounded-2xl border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 group"
                                                onClick={() => handleApply(hostel.id)}
                                                disabled={applying}
                                            >
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        <Home className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900">{hostel.name}</p>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{hostel.gender} Hall</p>
                                                    </div>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

