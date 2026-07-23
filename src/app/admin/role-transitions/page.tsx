"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  UserCheck,
  ArrowRight,
  Users,
  GraduationCap,
  Search,
  RefreshCw,
  Eye,
  Calendar,
  BookOpen,
  Award,
  Loader2
} from "lucide-react";
import {
  getRoleTransitions,
  transitionUserRole
} from "@/actions/applicant-documents";
import { getAllProgrammesWithRequirements } from "@/actions/programme-requirements";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RoleTransitionsPage() {
  const [transitions, setTransitions] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form state for manual transition
  const [transitionForm, setTransitionForm] = useState({
    userId: "",
    userName: "",
    userEmail: "",
    toRole: "fresher",
    transitionType: "manual",
    academicSession: "2026/2027",
    level: "100",
    matricNumber: "",
    programmeId: "",
    reason: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transitionsRes, programmesRes] = await Promise.all([
        getRoleTransitions(),
        getAllProgrammesWithRequirements()
      ]);

      if (transitionsRes.success && transitionsRes.transitions) setTransitions(transitionsRes.transitions);
      if (programmesRes.success && programmesRes.programmes) setProgrammes(programmesRes.programmes);
    } catch (error) {
      toast.error("Failed to fetch data");
    }
    setLoading(false);
  };

  const handleManualTransition = async () => {
    if (!transitionForm.userId || !transitionForm.userName || !transitionForm.userEmail) {
      toast.error("Please search and select a user first");
      return;
    }

    if (transitionForm.toRole === 'student' && !transitionForm.matricNumber) {
      toast.error("Matric number is required for student role");
      return;
    }

    setProcessing(true);
    try {
      const result = await transitionUserRole(
        parseInt(transitionForm.userId),
        transitionForm.toRole as 'fresher' | 'student',
        transitionForm.transitionType as 'admission_utme' | 'admission_de' | 'manual',
        transitionForm.academicSession,
        parseInt(transitionForm.level),
        transitionForm.matricNumber || undefined,
        transitionForm.programmeId ? parseInt(transitionForm.programmeId) : undefined,
        transitionForm.reason || undefined
      );

      if (result.success) {
        toast.success("Role transition completed successfully");
        setShowTransitionModal(false);
        resetForm();
        await fetchData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to transition user role");
    }
    setProcessing(false);
  };

  const resetForm = () => {
    setTransitionForm({
      userId: "",
      userName: "",
      userEmail: "",
      toRole: "fresher",
      transitionType: "manual",
      academicSession: "2026/2027",
      level: "100",
      matricNumber: "",
      programmeId: "",
      reason: ""
    });
  };

  const searchUser = async (email: string) => {
    // This would need to be implemented as an API action
    // For now, we'll simulate user search
    if (email.includes("test")) {
      setTransitionForm({
        ...transitionForm,
        userId: "1",
        userName: "Test User",
        userEmail: email
      });
    } else {
      toast.error("User not found");
    }
  };

  const getTransitionIcon = (type: string) => {
    switch (type) {
      case 'admission_utme':
        return <GraduationCap className="w-5 h-5 text-blue-500" />;
      case 'admission_de':
        return <Award className="w-5 h-5 text-purple-500" />;
      case 'manual':
        return <UserCheck className="w-5 h-5 text-emerald-500" />;
      default:
        return <ArrowRight className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTransitionBadge = (type: string) => {
    switch (type) {
      case 'admission_utme':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">UTME Admission</Badge>;
      case 'admission_de':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">DE Admission</Badge>;
      case 'manual':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Manual</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'applicant':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Applicant</Badge>;
      case 'fresher':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Fresher</Badge>;
      case 'student':
        return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Student</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredTransitions = transitions.filter(transition => {
    const matchesSearch =
      transition.userName?.toLowerCase().includes(search.toLowerCase()) ||
      transition.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      transition.matricNumber?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const stats = {
    total: transitions.length,
    applicantToFresher: transitions.filter(t => t.fromRole === 'applicant' && t.toRole === 'fresher').length,
    fresherToStudent: transitions.filter(t => t.fromRole === 'fresher' && t.toRole === 'student').length,
    manual: transitions.filter(t => t.transitionType === 'manual').length
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-650/30 to-purple-650/30 opacity-50 mix-blend-overlay" />
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-4 mb-2">
              <UserCheck className="w-12 h-12 text-indigo-400 drop-shadow-md" />
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                Role Transitions
              </h2>
            </div>
            <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
              Manage user role transitions from applicant to fresher to student
            </p>
          </div>
          <div className="relative z-10 flex gap-3 shrink-0">
            <Button
              onClick={() => setShowTransitionModal(true)}
              className="font-black px-6 py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-md uppercase text-xs tracking-widest border border-white/10"
            >
              <UserCheck className="w-5 h-5 mr-2" />
              Manual Transition
            </Button>
            <Button onClick={fetchData} disabled={loading} className="font-black px-6 py-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 active:scale-95 shadow-md uppercase text-xs tracking-widest">
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-100 rounded-[1.5rem] text-slate-600 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Transitions</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-100 rounded-[1.5rem] text-amber-600 shadow-inner">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Applicant → Fresher</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.applicantToFresher}</p>
              </div>
            </div>
          </Card>
          <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-100 rounded-[1.5rem] text-indigo-600 shadow-inner">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fresher → Student</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.fresherToStudent}</p>
              </div>
            </div>
          </Card>
          <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-100 rounded-[1.5rem] text-emerald-600 shadow-inner">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Manual Transitions</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.manual}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white font-bold text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
              placeholder="Search by name, email, or matric number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {/* Transitions Table */}
        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">User</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Transition</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Programme</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Level/Matric</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 bg-white/20">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600" />
                    </td>
                  </tr>
                ) : filteredTransitions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                      No transitions found
                    </td>
                  </tr>
                ) : (
                  filteredTransitions.map((transition) => (
                    <tr key={transition.id} className="hover:bg-white/40 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-800 uppercase">{transition.userName}</span>
                          <span className="text-xs text-slate-500 font-bold mt-0.5">{transition.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          {getRoleBadge(transition.fromRole)}
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                          {getRoleBadge(transition.toRole)}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {getTransitionIcon(transition.transitionType)}
                          {getTransitionBadge(transition.transitionType)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-slate-600">
                          {transition.programmeName || 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">Level {transition.level}</span>
                          {transition.matricNumber && (
                            <span className="text-xs text-slate-400 font-mono mt-0.5">{transition.matricNumber}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col text-sm font-bold text-slate-600 font-mono">
                          <span>
                            {new Date(transition.processedAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-400 font-normal">
                            {new Date(transition.processedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Button size="sm" variant="ghost" className="hover:bg-white/60 rounded-xl">
                          <Eye className="w-4 h-4 text-slate-600" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Manual Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] max-h-[90vh] overflow-y-auto">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-800 font-black uppercase text-lg tracking-wide">
                <UserCheck className="w-6 h-6 text-indigo-600" />
                Manual Role Transition
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              {/* User Search */}
              <div className="p-5 bg-white/40 border border-white/60 rounded-[2rem] space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Search User by Email</Label>
                <div className="flex gap-2">
                  <Input
                    value={transitionForm.userEmail}
                    onChange={(e) => setTransitionForm({ ...transitionForm, userEmail: e.target.value })}
                    placeholder="Enter user email..."
                    className="bg-white border-slate-200 rounded-xl font-bold"
                  />
                  <Button onClick={() => searchUser(transitionForm.userEmail)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm px-4">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                {transitionForm.userName && (
                  <div className="p-4 bg-white border border-slate-200/55 rounded-xl">
                    <p className="text-sm font-black text-slate-800 uppercase">{transitionForm.userName}</p>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">{transitionForm.userEmail}</p>
                  </div>
                )}
              </div>

              {/* Transition Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Target Role</Label>
                  <Select value={transitionForm.toRole} onValueChange={(value) => setTransitionForm({ ...transitionForm, toRole: value })}>
                    <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresher">Fresher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Transition Type</Label>
                  <Select value={transitionForm.transitionType} onValueChange={(value) => setTransitionForm({ ...transitionForm, transitionType: value })}>
                    <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admission_utme">UTME Admission</SelectItem>
                      <SelectItem value="admission_de">Direct Entry</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Academic Session</Label>
                  <Input
                    value={transitionForm.academicSession}
                    onChange={(e) => setTransitionForm({ ...transitionForm, academicSession: e.target.value })}
                    className="bg-white border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Level</Label>
                  <Select value={transitionForm.level} onValueChange={(value) => setTransitionForm({ ...transitionForm, level: value })}>
                    <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">ND 1 (100)</SelectItem>
                      <SelectItem value="200">ND 2 (200)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {transitionForm.toRole === 'student' && (
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Matric Number</Label>
                    <Input
                      value={transitionForm.matricNumber}
                      onChange={(e) => setTransitionForm({ ...transitionForm, matricNumber: e.target.value })}
                      placeholder="e.g., 2026/123456"
                      className="bg-white border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                )}

                {transitionForm.toRole === 'student' && (
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Programme</Label>
                    <Select value={transitionForm.programmeId} onValueChange={(value) => setTransitionForm({ ...transitionForm, programmeId: value })}>
                      <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold">
                        <SelectValue placeholder="Select programme" />
                      </SelectTrigger>
                      <SelectContent>
                        {programmes.map((programme) => (
                          <SelectItem key={programme.id} value={programme.id.toString()}>
                            {programme.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Reason (Optional)</Label>
                <Input
                  value={transitionForm.reason}
                  onChange={(e) => setTransitionForm({ ...transitionForm, reason: e.target.value })}
                  placeholder="Reason for transition..."
                  className="bg-white border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTransitionModal(false);
                    resetForm();
                  }}
                  className="flex-1 font-black uppercase text-xs tracking-widest py-3 border border-slate-200 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleManualTransition}
                  disabled={processing || !transitionForm.userId}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest py-3 rounded-xl shadow-md"
                >
                  {processing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4 mr-2" />
                  )}
                  Transition Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
