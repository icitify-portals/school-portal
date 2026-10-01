"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Save, Loader2, AlertCircle, Phone, Mail, MapPin, Hash, IdCard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getStudentProfileStatus, completeStudentProfile } from "@/actions/student-profile";

const NIGERIAN_STATES = [
    "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
    "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
    "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
    "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"
];

export default function CompleteProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", otherNames: "", gender: "",
        nin: "", jambNumber: "", phone: "", email: "",
        stateOfOrigin: "", lga: "",
    });

    useEffect(() => {
        getStudentProfileStatus().then((res) => {
            if (res.success && res.profile) {
                setProfile(res.profile);
                setFormData({
                    firstName: res.profile.firstName || "", lastName: res.profile.lastName || "",
                    otherNames: res.profile.otherNames || "", gender: res.profile.gender || "",
                    nin: res.profile.nin || "", jambNumber: res.profile.jambNumber || "",
                    phone: res.profile.phone || "", email: res.profile.email || "",
                    stateOfOrigin: res.profile.stateOfOrigin || "", lga: res.profile.lga || "",
                });
                if (res.isComplete) router.push("/student");
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const res = await completeStudentProfile(formData);
        setSaving(false);
        if (res.success) { toast.success(res.message); router.push("/student"); }
        else toast.error(res.error);
    }

    function updateField(field: string, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!profile) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><p className="text-slate-600">Unable to load student profile.</p></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><User size={32} /></div>
                    <h1 className="text-2xl font-bold text-slate-900">Complete Your Profile</h1>
                    <p className="text-sm text-slate-500 mt-1">Please fill in your details to continue. All fields are required.</p>
                </div>

                {profile.matricNumber && (
                    <Card className="mb-6 border-indigo-200 bg-indigo-50">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-slate-500">Matric No:</span><span className="ml-2 font-mono font-bold text-indigo-700">{profile.matricNumber}</span></div>
                                <div><span className="text-slate-500">Programme:</span><span className="ml-2 font-medium">{profile.programmeType} Level {profile.currentLevel}</span></div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5" /> Personal Information</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label className="text-xs font-bold text-slate-500 uppercase">First Name *</Label><Input value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="Enter first name" required /></div>
                                <div><Label className="text-xs font-bold text-slate-500 uppercase">Last Name *</Label><Input value={formData.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="Enter last name" required /></div>
                            </div>
                            <div><Label className="text-xs font-bold text-slate-500 uppercase">Other Names</Label><Input value={formData.otherNames} onChange={(e) => updateField("otherNames", e.target.value)} placeholder="Middle name(s) (optional)" /></div>
                            <div>
                                <Label className="text-xs font-bold text-slate-500 uppercase">Gender *</Label>
                                <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><IdCard className="w-3 h-3" /> NIN (11 digits) *</Label><Input value={formData.nin} onChange={(e) => updateField("nin", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="12345678901" maxLength={11} required /></div>
                                <div><Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Hash className="w-3 h-3" /> JAMB Reg No *</Label><Input value={formData.jambNumber} onChange={(e) => updateField("jambNumber", e.target.value.toUpperCase())} placeholder="202660003248HI" required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number *</Label><Input value={formData.phone} onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="08012345678" maxLength={11} required /></div>
                                <div><Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Mail className="w-3 h-3" /> Email *</Label><Input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="student@email.com" required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> State of Origin *</Label>
                                    <Select value={formData.stateOfOrigin} onValueChange={(v) => updateField("stateOfOrigin", v)}>
                                        <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                                        <SelectContent>{NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div><Label className="text-xs font-bold text-slate-500 uppercase">LGA *</Label><Input value={formData.lga} onChange={(e) => updateField("lga", e.target.value)} placeholder="Local Government Area" required /></div>
                            </div>
                            <Button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2 h-12 text-base font-bold">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save & Continue
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}