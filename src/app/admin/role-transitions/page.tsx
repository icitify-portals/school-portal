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
  Award
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
            <UserCheck className="w-10 h-10 text-indigo-600" />
            ROLE TRANSITIONS
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
            Manage user role transitions from applicant to fresher to student
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowTransitionModal(true)}
            className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <UserCheck className="w-5 h-5" />
            Manual Transition
          </Button>
          <Button onClick={fetchData} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-slate-50/50 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Transitions</p>
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/50 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicant → Fresher</p>
              <p className="text-2xl font-black text-slate-900">{stats.applicantToFresher}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-indigo-50/50 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fresher → Student</p>
              <p className="text-2xl font-black text-slate-900">{stats.fresherToStudent}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Transitions</p>
              <p className="text-2xl font-black text-slate-900">{stats.manual}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-none shadow-xl rounded-[2.5rem] p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white font-bold text-sm"
            placeholder="Search by name, email, or matric number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Transitions Table */}
      <Card className="border-none shadow-xl overflow-hidden rounded-[2.5rem]">
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
            <tbody className="divide-y divide-slate-50 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredTransitions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                    No transitions found
                  </td>
                </tr>
              ) : (
                filteredTransitions.map((transition) => (
                  <tr key={transition.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{transition.userName}</span>
                        <span className="text-xs text-slate-500">{transition.userEmail}</span>
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
                      <span className="text-sm text-slate-600">
                        {transition.programmeName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">Level {transition.level}</span>
                        {transition.matricNumber && (
                          <span className="text-xs text-slate-500">{transition.matricNumber}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600">
                          {new Date(transition.processedAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(transition.processedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCheck className="w-5 h-5" />
                Manual Role Transition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Search */}
              <div>
                <Label className="text-sm font-bold text-slate-700">Search User by Email</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={transitionForm.userEmail}
                    onChange={(e) => setTransitionForm({ ...transitionForm, userEmail: e.target.value })}
                    placeholder="Enter user email..."
                  />
                  <Button onClick={() => searchUser(transitionForm.userEmail)}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                {transitionForm.userName && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-bold text-slate-900">{transitionForm.userName}</p>
                    <p className="text-xs text-slate-500">{transitionForm.userEmail}</p>
                  </div>
                )}
              </div>

              {/* Transition Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-bold text-slate-700">Target Role</Label>
                  <Select value={transitionForm.toRole} onValueChange={(value) => setTransitionForm({ ...transitionForm, toRole: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresher">Fresher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-bold text-slate-700">Transition Type</Label>
                  <Select value={transitionForm.transitionType} onValueChange={(value) => setTransitionForm({ ...transitionForm, transitionType: value })}>
                    <SelectTrigger className="mt-2">
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
                  <Label className="text-sm font-bold text-slate-700">Academic Session</Label>
                  <Input
                    value={transitionForm.academicSession}
                    onChange={(e) => setTransitionForm({ ...transitionForm, academicSession: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold text-slate-700">Level</Label>
                  <Select value={transitionForm.level} onValueChange={(value) => setTransitionForm({ ...transitionForm, level: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 Level (UTME)</SelectItem>
                      <SelectItem value="200">200 Level (Direct Entry)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {transitionForm.toRole === 'student' && (
                  <div>
                    <Label className="text-sm font-bold text-slate-700">Matric Number</Label>
                    <Input
                      value={transitionForm.matricNumber}
                      onChange={(e) => setTransitionForm({ ...transitionForm, matricNumber: e.target.value })}
                      placeholder="e.g., 2026/123456"
                      className="mt-2"
                    />
                  </div>
                )}

                {transitionForm.toRole === 'student' && (
                  <div>
                    <Label className="text-sm font-bold text-slate-700">Programme</Label>
                    <Select value={transitionForm.programmeId} onValueChange={(value) => setTransitionForm({ ...transitionForm, programmeId: value })}>
                      <SelectTrigger className="mt-2">
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
                <Label className="text-sm font-bold text-slate-700">Reason (Optional)</Label>
                <Input
                  value={transitionForm.reason}
                  onChange={(e) => setTransitionForm({ ...transitionForm, reason: e.target.value })}
                  placeholder="Reason for transition..."
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTransitionModal(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleManualTransition}
                  disabled={processing || !transitionForm.userId}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
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
