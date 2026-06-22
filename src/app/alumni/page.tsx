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
    UserCircle 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAlumniProfile, updateAlumniProfile } from "@/actions/alumni";
import { toast } from "sonner";

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
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Profile Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <GraduationCap className="w-10 h-10 text-indigo-600" />
                            Alumni Network
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Connect with your alma mater and showcase your professional journey.</p>
                    </div>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-10">
                            <CardTitle className="text-2xl font-black italic">Your Alumni Identity</CardTitle>
                            <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Verify your status and update your current role</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> Graduation Year
                                        </label>
                                        <Input 
                                            type="number" 
                                            value={profile.graduationYear} 
                                            onChange={e => setProfile({...profile, graduationYear: parseInt(e.target.value)})}
                                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Linkedin className="w-3 h-3" /> LinkedIn Profile
                                        </label>
                                        <Input 
                                            value={profile.linkedinUrl} 
                                            onChange={e => setProfile({...profile, linkedinUrl: e.target.value})}
                                            placeholder="https://linkedin.com/in/username"
                                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Building className="w-3 h-3" /> Current Company
                                        </label>
                                        <Input 
                                            value={profile.currentCompany} 
                                            onChange={e => setProfile({...profile, currentCompany: e.target.value})}
                                            placeholder="Where are you now?"
                                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" /> Professional Title
                                        </label>
                                        <Input 
                                            value={profile.currentPosition} 
                                            onChange={e => setProfile({...profile, currentPosition: e.target.value})}
                                            placeholder="e.g. Senior Engineer"
                                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                                        />
                                    </div>
                                </div>
                                <Button 
                                    disabled={saving}
                                    className="bg-indigo-600 hover:bg-indigo-700 px-10 h-14 rounded-2xl text-md font-black shadow-lg shadow-indigo-500/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                    Sync Professional Profile
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Stats/Actions */}
                <div className="space-y-8">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-indigo-600 text-white p-8">
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Award className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black">Alumni Status</h3>
                                <p className="text-indigo-100 font-medium">{profile.isVerified ? "Verified Graduate" : "Pending Verification"}</p>
                            </div>
                            {!profile.isVerified && (
                                <div className="p-4 bg-white/10 rounded-2xl text-xs font-bold leading-relaxed">
                                    Your status is currently pending. An institutional officer will verify your records against the graduation list.
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-8 space-y-6">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Quick Actions</h4>
                        <div className="grid gap-3">
                            <Button variant="outline" className="h-14 rounded-2xl border-slate-100 justify-start px-6 font-bold gap-3">
                                <Briefcase className="w-5 h-5 text-indigo-600" /> Career Services
                            </Button>
                            <Button variant="outline" className="h-14 rounded-2xl border-slate-100 justify-start px-6 font-bold gap-3">
                                <Globe className="w-5 h-5 text-indigo-600" /> Alumni Directory
                            </Button>
                            <Button variant="outline" className="h-14 rounded-2xl border-slate-100 justify-start px-6 font-bold gap-3">
                                <UserCircle className="w-5 h-5 text-indigo-600" /> Official Transcript
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
