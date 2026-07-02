"use client";

import { useState, useEffect } from "react";
import { 
    GraduationCap, 
    Briefcase, 
    Linkedin, 
    Globe, 
    Award, 
    Loader2, 
    Save, 
    Calendar, 
    Building, 
    UserCircle,
    ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAlumniProfile, updateAlumniProfile } from "@/actions/alumni";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AlumniPortalPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getAlumniProfile();
        setProfile(data || {
            graduationYear: new Date().getFullYear(),
            currentCompany: "",
            currentPosition: "",
            linkedinUrl: ""
        });
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const res = await updateAlumniProfile(profile);
        if (res.success) {
            toast.success("Profile updated successfully!");
        } else {
            toast.error(res.error || "Failed to update profile");
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Bento Header */}
                <div className="bg-slate-900 rounded-[2rem] p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                    <div className="absolute -left-10 -bottom-10 opacity-10 blur-xl">
                        <GraduationCap className="w-80 h-80" />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-black flex items-center gap-4 tracking-tighter">
                            Alumni Network
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mt-3">
                            Connect • Network • Grow
                        </p>
                    </div>
                    <div className="relative z-10">
                        <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full animate-pulse", profile.isVerified ? "bg-emerald-400" : "bg-amber-400")} />
                            <span className="text-xs font-black uppercase tracking-widest">
                                {profile.isVerified ? "Verified Graduate" : "Status Pending"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[auto]">
                    
                    {/* Main Form Bento - Spans 2 cols */}
                    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden lg:col-span-2 bg-white">
                        <CardHeader className="bg-indigo-600 text-white p-8">
                            <CardTitle className="text-2xl font-black tracking-tight">Professional Identity</CardTitle>
                            <CardDescription className="text-indigo-200 font-medium">Keep your career details up to date to help peers find you.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Graduation Year
                                        </label>
                                        <Input 
                                            type="number" 
                                            value={profile.graduationYear} 
                                            onChange={e => setProfile({...profile, graduationYear: parseInt(e.target.value)})}
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold text-lg focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Linkedin className="w-3.5 h-3.5 text-blue-500" /> LinkedIn Profile
                                        </label>
                                        <Input 
                                            value={profile.linkedinUrl} 
                                            onChange={e => setProfile({...profile, linkedinUrl: e.target.value})}
                                            placeholder="https://linkedin.com/in/username"
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Building className="w-3.5 h-3.5 text-emerald-500" /> Current Company
                                        </label>
                                        <Input 
                                            value={profile.currentCompany} 
                                            onChange={e => setProfile({...profile, currentCompany: e.target.value})}
                                            placeholder="Where do you work?"
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Professional Title
                                        </label>
                                        <Input 
                                            value={profile.currentPosition} 
                                            onChange={e => setProfile({...profile, currentPosition: e.target.value})}
                                            placeholder="e.g. Senior Software Engineer"
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <Button 
                                        disabled={saving}
                                        className="bg-slate-900 hover:bg-slate-800 w-full md:w-auto px-10 h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Save className="w-5 h-5 mr-3" />}
                                        Save Profile
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Sidebar Bento Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Verification Bento */}
                        {!profile.isVerified && (
                            <Card className="border-none shadow-sm rounded-[2rem] bg-amber-50 overflow-hidden">
                                <CardContent className="p-8">
                                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-[1.2rem] flex items-center justify-center mb-6 shadow-sm">
                                        <Award className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-black text-amber-900 tracking-tight mb-2">Pending Verification</h3>
                                    <p className="text-sm text-amber-700/80 font-medium leading-relaxed">
                                        An institutional officer must verify your records against the graduation list before you gain full access to the directory.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions Bento */}
                        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden flex-1">
                            <CardHeader className="bg-slate-50 p-6 border-b border-slate-100">
                                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid gap-4">
                                    <Button variant="outline" className="h-16 rounded-2xl border-slate-200 justify-between px-6 font-bold group hover:border-indigo-300 hover:bg-indigo-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Briefcase className="w-4 h-4" /></div>
                                            Career Services
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                    </Button>
                                    <Button variant="outline" className="h-16 rounded-2xl border-slate-200 justify-between px-6 font-bold group hover:border-indigo-300 hover:bg-indigo-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Globe className="w-4 h-4" /></div>
                                            Alumni Directory
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                    </Button>
                                    <Button variant="outline" className="h-16 rounded-2xl border-slate-200 justify-between px-6 font-bold group hover:border-indigo-300 hover:bg-indigo-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><UserCircle className="w-4 h-4" /></div>
                                            Official Transcript
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        
                    </div>
                </div>
            </div>
        </div>
    );
}
