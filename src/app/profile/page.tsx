"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    User,
    Shield,
    HeartPulse,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    MessageSquare,
    Loader2,
    Save,
    CheckCircle2,
    AlertCircle,
    Info,
    GraduationCap,
    Camera,
    ShieldCheck,
    Fingerprint,
    Bell
} from "lucide-react";
import { updateStudentProfile, updateStaffProfile, getLoggedUserProfile, uploadProfileImage } from "@/actions/student-profile";
import { verifyNin } from "@/actions/nin-actions";
import { IdentityCard } from "@/components/IdentityCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PushSubscriptionToggle } from "@/components/notifications/PushSubscriptionToggle";

export default function ProfilePage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"personal" | "guardian" | "kin" | "health" | "notifications">("personal");
    const [ninInput, setNinInput] = useState("");
    const [isVerifyingNin, setIsVerifyingNin] = useState(false);
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);

    useEffect(() => {
        if (session?.user) fetchProfile();
    }, [session]);

    async function fetchProfile() {
        setLoading(true);
        const data = await getLoggedUserProfile();
        setProfile(data);
        setLoading(false);
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!session?.user) return;
        setIsSaving(true);

        const userId = profile.userId || parseInt((session.user as any).id);
        let res;

        if (profile.isStaffProfile) {
            const { bankName, accountNumber, maritalStatus, qualification, imageUrl } = profile;
            res = await updateStaffProfile(userId, { bankName, accountNumber, maritalStatus, qualification, imageUrl });
        } else {
            const { id, userId: uId, user, programme, enrollments, ...editableData } = profile;
            res = await updateStudentProfile(userId, editableData);
        }

        if (res.success) {
            toast.success("Profile updated successfully");
        } else {
            toast.error(res.error || "Failed to update profile");
        }
        setIsSaving(false);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile((prev: any) => ({ ...prev, [name]: value }));
    };

    async function handleVerifyNin() {
        if (!ninInput || ninInput.length !== 11) {
            toast.error("Please enter a valid 11-digit NIN");
            return;
        }

        setIsVerifyingNin(true);
        const res = await verifyNin(profile.userId || parseInt((session?.user as any).id), ninInput);
        if (res.success) {
            toast.success(res.message);
            fetchProfile(); // Refresh profile data
            setNinInput("");
        } else {
            toast.error(res.error || "Failed to verify NIN");
        }
        setIsVerifyingNin(false);
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file (JPEG or PNG)");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size is too large. Maximum 2MB allowed");
            return;
        }

        setIsUpdatingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await uploadProfileImage(formData);
        if (res.success && res.imageUrl) {
            toast.success(profile?.isStaffProfile ? "Profile image updated successfully!" : "Profile image uploaded and locked for ID Card generation.");
            setProfile((prev: any) => ({
                ...prev,
                imageUrl: res.imageUrl,
                isProfileLocked: !profile.isStaffProfile ? true : prev.isProfileLocked
            }));
        } else {
            toast.error(res.error || "Failed to upload image");
        }
        setIsUpdatingImage(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Synchronizing Identity...</p>
            </div>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] p-12 text-center">
                <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black italic uppercase text-slate-900">Digital Void Detected</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-4">We couldn't locate your profile record. Please contact the registrar or IT support.</p>
            </Card>
        </div>
    );

    const isStaff = profile.isStaffProfile;

    const tabs = [
        { id: "personal", label: isStaff ? "Employment Info" : "Academic Info", icon: User },
        ...(!isStaff ? [
            { id: "guardian", label: "Guardian Details", icon: Shield },
            { id: "kin", label: "Next of Kin", icon: MessageSquare },
            { id: "health", label: "Health Records", icon: HeartPulse },
        ] : []),
        { id: "notifications", label: "Notifications", icon: Bell },
    ];

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-emerald-100/50 border border-emerald-50/50">
                <div className="flex gap-8 items-center">
                    <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-600 to-green-700 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-emerald-200 overflow-hidden">
                            {profile.imageUrl ? (
                                <img src={profile.imageUrl} alt={profile.user?.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black text-white italic">
                                    {profile.user?.name?.charAt(0) || "S"}
                                </span>
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter truncate max-w-md">
                            {profile.user?.name}
                        </h1>
                        <div className="flex flex-wrap gap-3 mt-3">
                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full tracking-widest border border-emerald-100/50">
                                {isStaff ? (profile.staffId || "STAFF") : (profile.matricNumber || "No Matric")}
                            </span>
                            <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-full tracking-widest border border-slate-200/50">
                                {isStaff ? profile.jobTitle : `${profile.currentLevel} LEVEL`}
                            </span>
                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full tracking-widest border border-emerald-100/50">
                                {profile.status || "Active"}
                            </span>
                        </div>
                    </div>
                </div>
                <Button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="bg-emerald-800 h-16 px-10 rounded-2xl hover:bg-emerald-950 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-100/40 transition-all hover:scale-105"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <span className="flex items-center gap-3">
                            <Save className="w-4 h-4" /> Commit Changes
                        </span>
                    )}
                </Button>
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Navigation Sidebar (Sticky to prevent left menu hanging while content scrolls) */}
                <div className="lg:col-span-3 lg:sticky lg:top-8 self-start space-y-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "w-full flex items-center gap-4 p-6 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-transparent",
                                activeTab === tab.id
                                    ? "bg-emerald-600 text-white shadow-2xl shadow-emerald-200 translate-x-3 scale-105"
                                    : "bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 shadow-xl shadow-slate-100"
                            )}
                        >
                            <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-emerald-200" : "text-slate-200")} />
                            {tab.label}
                        </button>
                    ))}

                    <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 mt-12 space-y-4">
                        <div className="flex items-center gap-3 text-amber-600">
                            <Info className="w-5 h-5" />
                            <h4 className="font-black text-[10px] uppercase tracking-widest italic">Identity Guard</h4>
                        </div>
                        <p className="text-[10px] font-bold text-amber-800/60 leading-loose uppercase tracking-tighter">
                            Crucial academic fields are locked. Contact the Digital Registrar's office for corrections.
                        </p>
                    </div>
                </div>

                {/* Form Panels */}
                <div className="lg:col-span-9">
                    <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-12 overflow-hidden">
                        <form className="space-y-12" onSubmit={(e) => e.preventDefault()}>
                            {activeTab === "personal" && (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic flex items-center gap-2">
                                                <GraduationCap className="w-3 h-3 text-emerald-500" /> {isStaff ? "Primary Department" : "Degree Programme"}
                                            </Label>
                                            <div className="h-14 flex items-center px-6 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-black text-slate-500 uppercase tracking-tight">
                                                {isStaff ? (profile.department?.name || profile.department || "Unassigned") : (profile.programme?.name || "Unassigned")}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic flex items-center gap-2">
                                                <MapPin className="w-3 h-3 text-emerald-500" /> Institutional Unit
                                            </Label>
                                            <div className="h-14 flex items-center px-6 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-black text-slate-500 uppercase tracking-tight">
                                                Main Campus / {profile.unit?.name || "Unassigned"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-slate-50">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">User Reference</Label>
                                            <Input readOnly value={profile.user?.email || ""} className="bg-slate-50 h-14 rounded-2xl font-bold text-slate-400 border-slate-100" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">{isStaff ? "Staff ID" : "Admission Year"}</Label>
                                            <Input readOnly value={(isStaff ? profile.staffId : profile.admissionYear) || ""} className="bg-slate-50 h-14 rounded-2xl font-bold text-slate-400 border-slate-100" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">{isStaff ? "Job Title" : "Mode of Entry"}</Label>
                                            <Input readOnly value={(isStaff ? profile.jobTitle : profile.modeOfEntry) || (isStaff ? "Lecturer" : "UTME")} className="bg-slate-50 h-14 rounded-2xl font-bold text-slate-900 border-slate-100" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic flex items-center justify-between">
                                                <span>{isStaff ? "Grade Level" : "Academic Status"}</span>
                                                {isStaff ? (
                                                    <span className="text-[8px] text-emerald-400/80 tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">(HR RECORD)</span>
                                                ) : (
                                                    <span className="text-[8px] text-emerald-400/80 tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">(REGISTRY)</span>
                                                )}
                                            </Label>
                                            <Input readOnly value={(isStaff ? profile.gradeLevel : (profile.status || "Active")) || (isStaff ? "L1" : "Active")} className="bg-emerald-50/30 h-14 rounded-2xl font-black text-emerald-900 border-emerald-100/50 shadow-inner" />
                                        </div>
                                    </div>

                                    {isStaff ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-slate-50">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Gender</Label>
                                                    <Input readOnly value={profile.gender?.toUpperCase() || ""} className="bg-slate-50 h-14 rounded-2xl font-bold text-slate-400 border-slate-100" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Marital Status</Label>
                                                    <Input name="maritalStatus" value={profile.maritalStatus || ""} onChange={handleChange} placeholder="e.g. Single, Married..." className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200 focus:ring-2 focus:ring-emerald-500" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Qualification</Label>
                                                    <Input name="qualification" value={profile.qualification || ""} onChange={handleChange} placeholder="e.g. Ph.D, M.Sc..." className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200 focus:ring-2 focus:ring-emerald-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Bank Name</Label>
                                                    <Input name="bankName" value={profile.bankName || ""} onChange={handleChange} placeholder="e.g. GTBank, Zenith Bank..." className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200 focus:ring-2 focus:ring-emerald-500" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Account Number</Label>
                                                    <Input name="accountNumber" value={profile.accountNumber || ""} onChange={handleChange} placeholder="10-digit number" className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200 focus:ring-2 focus:ring-emerald-500" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-slate-50">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Gender</Label>
                                                <Input readOnly value={profile.gender?.toUpperCase() || ""} className="bg-slate-50 h-14 rounded-2xl font-bold text-slate-400 border-slate-100" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Genotype</Label>
                                                <Input name="genotype" value={profile.genotype || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200 focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Blood Group</Label>
                                                <Input name="bloodGroup" value={profile.bloodGroup || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200 focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Identity & ID Card Section */}
                                    <div className="pt-10 border-t border-slate-100 space-y-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-8 bg-emerald-600 rounded-full" />
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Digital Identity Verification</h3>
                                        </div>

                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                            {/* Column 1: Verification Controls */}
                                            <div className="space-y-8">
                                                {/* NIN Verification */}
                                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                            <Fingerprint className="w-3 h-3 text-emerald-500" />
                                                            NIN Fallback Verification
                                                        </Label>
                                                        {profile.ninVerified && (
                                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded-lg border border-emerald-200">
                                                                Verified
                                                            </span>
                                                        )}
                                                    </div>

                                                    {!profile.ninVerified ? (
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Enter 11-digit NIN"
                                                                value={ninInput}
                                                                onChange={(e) => setNinInput(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                                                className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200"
                                                            />
                                                            <Button
                                                                onClick={handleVerifyNin}
                                                                disabled={isVerifyingNin || ninInput.length !== 11}
                                                                className="h-14 bg-emerald-600 rounded-2xl hover:bg-emerald-700 px-6 shrink-0 text-white"
                                                            >
                                                                {isVerifyingNin ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="h-14 flex items-center px-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs font-bold text-emerald-700 gap-3">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            National Identity Synchronized: {profile.nin}
                                                        </div>
                                                    )}
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                                                        NIN verification will automatically update your legal names in the university portal to match the national database.
                                                    </p>
                                                </div>

                                                {/* Profile Image Management (Direct Secure Upload) */}
                                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                        <Camera className="w-3 h-3 text-emerald-500" />
                                                        Identity Card Photographic Capture
                                                    </Label>

                                                    {profile.isProfileLocked ? (
                                                        <div className="space-y-4">
                                                            <div className="h-14 flex items-center px-6 bg-amber-50 rounded-2xl border border-amber-100 text-xs font-bold text-amber-700 gap-3">
                                                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                                Biometric Image Locked for ID Generation
                                                            </div>
                                                            <p className="text-[8px] font-black text-slate-400 uppercase italic tracking-wider">
                                                                Your profile image has been verified and locked. Contact support for re-capture.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-8 bg-slate-50/50 hover:bg-emerald-50/20 transition-all cursor-pointer relative group">
                                                                <input
                                                                    id="profile-upload-input"
                                                                    type="file"
                                                                    accept="image/jpeg,image/png,image/jpg"
                                                                    onChange={handleFileChange}
                                                                    disabled={isUpdatingImage}
                                                                    className="hidden"
                                                                />
                                                                <label htmlFor="profile-upload-input" className="w-full h-full flex flex-col items-center justify-center cursor-pointer space-y-3">
                                                                    {isUpdatingImage ? (
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                                                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Uploading Biometrics...</p>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                                                                <Camera className="w-6 h-6 text-slate-500 group-hover:text-emerald-600" />
                                                                            </div>
                                                                            <div className="text-center">
                                                                                <span className="text-xs font-black text-slate-700 uppercase tracking-tight block">Upload Profile Photo</span>
                                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-1">JPEG or PNG up to 2MB</span>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </label>
                                                            </div>
                                                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3 items-start">
                                                                <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                                                <p className="text-[9px] font-bold text-emerald-800 uppercase leading-relaxed">
                                                                    <span className="font-black underline">Notice:</span> {isStaff ? "Your photo is loaded onto your staff identity card." : "Your photo will be locked immediately for security and ID card integration."}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Column 2: ID Card Preview */}
                                            <div className="flex flex-col items-center justify-center p-8 bg-emerald-50/30 rounded-[3rem] border border-emerald-100/30">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-8 italic">Identity Card Live Preview</h4>
                                                <div className="scale-75 origin-center lg:scale-90 xl:scale-100">
                                                     <IdentityCard
                                                         name={profile.user?.name}
                                                         id={isStaff ? (profile.staffId || "STAFF") : (profile.matricNumber || "PENDING")}
                                                         role={isStaff ? "staff" : "student"}
                                                         department={isStaff ? (profile.department?.name || profile.department || "General Administration") : (profile.programme?.name || "General Administration")}
                                                         photoUrl={profile.imageUrl}
                                                         barcode={profile.barcode || (isStaff ? `${profile.user?.name} | ${profile.staffId || "STAFF"}` : `${profile.user?.name} | ${profile.matricNumber}`)}
                                                     />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "guardian" && (
                                <div className="space-y-10 animate-in slide-in-from-right-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Guardian Name</Label>
                                            <Input name="guardianName" value={profile.guardianName || ""} onChange={handleChange} placeholder="e.g. Dr. John Doe" className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200 shadow-sm" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Occupation</Label>
                                            <Input name="guardianOccupation" value={profile.guardianOccupation || ""} onChange={handleChange} placeholder="Medical Practitioner" className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200 shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Primary Phone</Label>
                                            <Input name="guardianPhone" value={profile.guardianPhone || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                <MessageSquare className="w-3 h-3 text-emerald-500" /> WhatsApp Number
                                            </Label>
                                            <Input name="guardianWhatsapp" value={profile.guardianWhatsapp || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Email Address</Label>
                                            <Input name="guardianEmail" value={profile.guardianEmail || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Permanent Home Address</Label>
                                        <Textarea name="guardianAddress" value={profile.guardianAddress || ""} onChange={handleChange} className="rounded-2xl border-slate-200 p-6 font-bold text-slate-900 shadow-sm min-h-[120px]" />
                                    </div>
                                </div>
                            )}

                            {activeTab === "kin" && (
                                <div className="space-y-10 animate-in slide-in-from-right-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kin Name</Label>
                                            <Input name="kinName" value={profile.kinName || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Phone</Label>
                                            <Input name="kinPhone" value={profile.kinPhone || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">WhatsApp</Label>
                                            <Input name="kinWhatsapp" value={profile.kinWhatsapp || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Email</Label>
                                            <Input name="kinEmail" value={profile.kinEmail || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kin Address</Label>
                                        <Textarea name="kinAddress" value={profile.kinAddress || ""} onChange={handleChange} className="rounded-2xl border-slate-200 p-6 font-bold text-slate-900 min-h-[120px]" />
                                    </div>
                                </div>
                            )}

                            {activeTab === "health" && (
                                <div className="space-y-10 animate-in slide-in-from-right-4">
                                    <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 flex gap-6 items-center">
                                        <ShieldCheck className="w-10 h-10 text-rose-500 shrink-0" />
                                        <div>
                                            <h4 className="font-black italic uppercase text-rose-900">Health Surveillance</h4>
                                            <p className="text-[9px] font-black text-rose-700/60 uppercase tracking-widest leading-loose mt-1">
                                                Accurate health data ensures emergency protocols are followed correctly by the University Medical Center.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Personal/Family Doctor Name</Label>
                                            <Input name="doctorName" value={profile.doctorName || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Doctor Phone</Label>
                                            <Input name="doctorPhone" value={profile.doctorPhone || ""} onChange={handleChange} className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Chronical Ailments</Label>
                                            <Textarea name="ailments" value={profile.ailments || ""} onChange={handleChange} placeholder="e.g. Type 1 Diabetes, Asthma..." className="rounded-2xl border-slate-200 p-6 font-bold text-slate-900 min-h-[100px]" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Surgical History (Operations)</Label>
                                            <Textarea name="operations" value={profile.operations || ""} onChange={handleChange} placeholder="e.g. Appendectomy (2022)" className="rounded-2xl border-slate-200 p-6 font-bold text-slate-900 min-h-[100px]" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Strict Food Allergies</Label>
                                        <Input name="foodAllergies" value={profile.foodAllergies || ""} onChange={handleChange} placeholder="e.g. Peanuts, Lactose Intolerant" className="h-14 rounded-2xl font-bold text-rose-600 border-slate-200" />
                                    </div>
                                </div>
                            )}

                            {activeTab === "notifications" && (
                                <div className="space-y-10 animate-in slide-in-from-right-4">
                                    <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex gap-6 items-center">
                                        <Bell className="w-10 h-10 text-emerald-500 shrink-0" />
                                        <div>
                                            <h4 className="font-black italic uppercase text-emerald-900">Real-Time Alerts</h4>
                                            <p className="text-[9px] font-black text-emerald-700/60 uppercase tracking-widest leading-loose mt-1">
                                                Stay updated with push notifications for results, financial transactions, and academic announcements.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <div className="space-y-1">
                                                <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">Browser Push Notifications</h5>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Receive alerts directly on your device even when the portal is closed.
                                                </p>
                                            </div>
                                            <PushSubscriptionToggle />
                                        </div>

                                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                                            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-[9px] font-bold text-amber-800/60 leading-relaxed uppercase">
                                                Email and Toast notifications are enabled by default for all critical academic and financial activities.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}

