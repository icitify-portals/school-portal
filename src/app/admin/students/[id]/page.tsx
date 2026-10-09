"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, User, Mail, Phone, Calendar, Briefcase, Droplet, Hash, BookOpen, MapPin, Activity, Edit } from "lucide-react";
import { getStudentById, updateAdminStudentProfile } from "@/actions/students";
import { getProgrammes } from "@/actions/programmes";
import { getAcademicSessions } from "@/actions/transcripts";
import { useBranch } from "@/providers/BranchProvider";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function StudentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = parseInt(params.id as string);
    const { isK12 } = useBranch();

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [programmes, setProgrammes] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);

    const [editOpen, setEditOpen] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    const openEditModal = () => {
        if (!student) return;
        setEditData({
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            otherNames: student.otherNames || '',
            email: student.user?.email || '',
            phone: student.user?.phone || '',
            nin: student.nin || '',
            jambNumber: student.jambNumber || '',
            matricNumber: student.matricNumber || '',
            dob: (() => {
                if (!student.dob) return '';
                const d = new Date(student.dob);
                return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
            })(),
            gender: student.gender || '',
            programmeId: student.programmeId || '',
            currentLevel: student.currentLevel || '',
            admissionYear: student.admissionYear || '',
            currentSessionId: student.currentSessionId || '',
            admissionSessionId: student.admissionSessionId || '',
            status: student.status || '',
            studyMode: student.studyMode || '',
            userStatus: student.user?.status || ''
        });
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        const res = await updateAdminStudentProfile(studentId, editData);
        setIsSaving(false);
        if (res.success) {
            toast.success("Student profile updated successfully");
            setEditOpen(false);
            const data = await getStudentById(studentId);
            setStudent(data);
        } else {
            toast.error(res.error || "Failed to update");
        }
    };

    useEffect(() => {
        if (!studentId) return;
        const fetchStudent = async () => {
            setLoading(true);
            const [data, progs, sess] = await Promise.all([
                getStudentById(studentId),
                getProgrammes(),
                getAcademicSessions()
            ]);
            setStudent(data);
            setProgrammes(progs || []);
            setSessions(sess || []);
            setLoading(false);
        };
        fetchStudent();
    }, [studentId]);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-8 pb-32 max-w-5xl mx-auto text-center space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Student Not Found</h2>
                <Button onClick={() => router.push("/admin/students")} variant="outline">Back to Students</Button>
            </div>
        );
    }

    return (
        <div className="p-8 pb-32 max-w-[1200px] w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/admin/students")} className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Student Details</h2>
                        <p className="text-slate-500 mt-1">View comprehensive student profile and records</p>
                    </div>
                    <Button onClick={openEditModal} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                        <Edit className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <Card className="border-none shadow-sm md:col-span-1 h-fit">
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                        <div className="w-32 h-32 rounded-[2rem] bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center border-4 border-white shadow-xl overflow-hidden relative">
                            {student.imageUrl ? (
                                <Image src={student.imageUrl} alt="Profile" fill className="object-cover" />
                            ) : (
                                <User className="w-12 h-12" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{student.user?.name}</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">{student.matricNumber || 'No Matric Number'}</p>
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${student.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {student.status}
                                </span>
                                {student.isFinanciallyLocked && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-700">
                                        Fin Locked
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Information */}
                <div className="md:col-span-2 space-y-6">
                    {/* Academic Info */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-600" /> Academic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Programme</span>
                                <p className="text-sm font-medium text-slate-900">{student.programme?.name || 'Not Assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Level</span>
                                <p className="text-sm font-medium text-slate-900">
                                    {student.status === 'nd_graduant'
                                        ? 'ND Graduant'
                                        : student.status === 'nd_graduated'
                                        ? 'ND Graduated'
                                        : student.status === 'hnd_graduant'
                                        ? 'HND Graduant'
                                        : student.status === 'hnd_graduated'
                                        ? 'HND Graduated'
                                        : isK12
                                        ? `Grade ${student.currentLevel}`
                                        : `${student.programme?.programmeType || ''} ${student.currentLevel}`.trim()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admission Year</span>
                                <p className="text-sm font-medium text-slate-900">{student.admissionYear || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">JAMB / Admission Number</span>
                                <p className="text-sm font-medium text-slate-900">{student.jambNumber || student.admissionNumber || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Info */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-600" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                                <p className="text-sm font-medium text-slate-900">{student.user?.email || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
                                <p className="text-sm font-medium text-slate-900">{student.user?.phone || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of Birth</span>
                                <p className="text-sm font-medium text-slate-900">{student.dob || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gender</span>
                                <p className="text-sm font-medium text-slate-900 capitalize">{student.gender || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical / Health Info */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-600" /> Medical & Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Droplet className="w-3 h-3" /> Blood Group</span>
                                <p className="text-sm font-medium text-slate-900">{student.bloodGroup || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Hash className="w-3 h-3" /> Genotype</span>
                                <p className="text-sm font-medium text-slate-900">{student.genotype || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Next of Kin / Guardian */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-indigo-600" /> Guardian / Next of Kin
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Guardian Name</span>
                                <p className="text-sm font-medium text-slate-900">{student.guardianName || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Guardian Phone</span>
                                <p className="text-sm font-medium text-slate-900">{student.guardianPhone || 'N/A'}</p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Guardian Address</span>
                                <p className="text-sm font-medium text-slate-900">{student.guardianAddress || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Student Data</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input value={editData.firstName || ''} onChange={e => setEditData({...editData, firstName: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Middle Name</Label>
                                <Input value={editData.otherNames || ''} onChange={e => setEditData({...editData, otherNames: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input value={editData.lastName || ''} onChange={e => setEditData({...editData, lastName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={editData.email || ''} onChange={e => setEditData({...editData, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Matric No</Label>
                                <Input value={editData.matricNumber || ''} onChange={e => setEditData({...editData, matricNumber: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>JAMB No</Label>
                                <Input value={editData.jambNumber || ''} onChange={e => setEditData({...editData, jambNumber: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>NIN</Label>
                            <Input value={editData.nin || ''} onChange={e => setEditData({...editData, nin: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input type="date" value={editData.dob || ''} onChange={e => setEditData({...editData, dob: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={editData.gender || ''}
                                    onChange={e => setEditData({...editData, gender: e.target.value})}
                                >
                                    <option value="">— Select —</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t pt-4 mt-2">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Academic Details</h4>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label>Programme (Course)</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={editData.programmeId || ''}
                                        onChange={e => setEditData({...editData, programmeId: e.target.value})}
                                    >
                                        <option value="">— Select Programme —</option>
                                        {programmes.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Current Level</Label>
                                        <Input type="number" value={editData.currentLevel || ''} onChange={e => setEditData({...editData, currentLevel: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Admission Year</Label>
                                        <Input type="number" value={editData.admissionYear || ''} onChange={e => setEditData({...editData, admissionYear: e.target.value})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Current Session</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={editData.currentSessionId || ''}
                                            onChange={e => setEditData({...editData, currentSessionId: e.target.value})}
                                        >
                                            <option value="">— Select Session —</option>
                                            {sessions.map((s: any) => (
                                                <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Admission Session</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={editData.admissionSessionId || ''}
                                            onChange={e => setEditData({...editData, admissionSessionId: e.target.value})}
                                        >
                                            <option value="">— Select Session —</option>
                                            {sessions.map((s: any) => (
                                                <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Student Status</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={editData.status || ''}
                                            onChange={e => setEditData({...editData, status: e.target.value})}
                                        >
                                            <option value="">— Select Status —</option>
                                            <option value="active">Active</option>
                                            <option value="nd_graduant">ND Graduant</option>
                                            <option value="hnd_graduant">HND Graduant</option>
                                            <option value="nd_graduated">ND Graduated</option>
                                            <option value="hnd_graduated">HND Graduated</option>
                                            <option value="withdrawn">Withdrawn</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="rusticated">Rusticated</option>
                                            <option value="pending_review">Pending Review</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Study Mode</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={editData.studyMode || ''}
                                            onChange={e => setEditData({...editData, studyMode: e.target.value})}
                                        >
                                            <option value="">— Select Mode —</option>
                                            <option value="full-time">Full-time</option>
                                            <option value="part-time">Part-time</option>
                                            <option value="elearning">E-learning</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Status</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={editData.userStatus || ''}
                                        onChange={e => setEditData({...editData, userStatus: e.target.value})}
                                    >
                                        <option value="">— Select Account Status —</option>
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="withdrawn">Withdrawn</option>
                                        <option value="nd_graduant">ND Graduant</option>
                                        <option value="hnd_graduant">HND Graduant</option>
                                        <option value="nd_graduated">ND Graduated</option>
                                        <option value="hnd_graduated">HND Graduated</option>
                                        <option value="rusticated">Rusticated</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
