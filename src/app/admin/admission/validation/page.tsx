"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Users,
  Settings
} from "lucide-react";
import Link from "next/link";
import {
  validateCandidateAdmission,
  batchValidateProgrammeCandidates,
  getCandidateValidationStatus
} from "@/actions/admission-validation";
import { getAllProgrammesWithRequirements } from "@/actions/programme-requirements";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdmissionValidationPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'invalid' | 'pending'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const programmesRes = await getAllProgrammesWithRequirements();
      if (programmesRes.success && programmesRes.programmes) {
        setProgrammes(programmesRes.programmes);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  const handleBatchValidation = async () => {
    if (!selectedProgramme) {
      toast.error("Please select a programme");
      return;
    }

    setValidating(true);
    try {
      const result = await batchValidateProgrammeCandidates(selectedProgramme);
      if (result.success) {
        toast.success(`Validation complete: ${result.validCount} valid, ${result.invalidCount} invalid`);
        // Refresh candidates list
        await fetchCandidates();
      } else {
        toast.error(result.error || "Validation failed");
      }
    } catch (error) {
      toast.error("Validation failed");
    }
    setValidating(false);
  };

  const fetchCandidates = async () => {
    // This would need to be implemented in actions
    // For now, showing placeholder
    setCandidates([]);
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch =
      candidate.jambRegNo?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.surname?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.firstname?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'valid' && candidate.validationStatus === 'VALID') ||
      (statusFilter === 'invalid' && candidate.validationStatus === 'INVALID') ||
      (statusFilter === 'pending' && candidate.validationStatus === 'PENDING');

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Valid</Badge>;
      case 'INVALID':
        return <Badge className="bg-rose-100 text-rose-700 border-rose-200">Invalid</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getValidationStats = () => {
    const total = candidates.length;
    const valid = candidates.filter(c => c.validationStatus === 'VALID').length;
    const invalid = candidates.filter(c => c.validationStatus === 'INVALID').length;
    const pending = candidates.filter(c => c.validationStatus === 'PENDING').length;

    return { total, valid, invalid, pending };
  };

  const stats = getValidationStats();

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
            <ShieldCheck className="w-10 h-10 text-indigo-600" />
            ADMISSION VALIDATION
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
            Validate UTME subjects and O-Level requirements compliance
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/admission/validation/requirements">
            <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-white hover:bg-slate-50 text-slate-700 border border-slate-200">
              <Settings className="w-5 h-5" />
              Configure Requirements
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-slate-50/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Candidates</p>
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid</p>
              <p className="text-2xl font-black text-slate-900">{stats.valid}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invalid</p>
              <p className="text-2xl font-black text-slate-900">{stats.invalid}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="border-none shadow-xl rounded-[2.5rem] p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 w-full lg:w-auto">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Select Programme</label>
            <select
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-bold text-sm"
              value={selectedProgramme || ''}
              onChange={(e) => setSelectedProgramme(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Programmes</option>
              {programmes.map((programme) => (
                <option key={programme.id} value={programme.id}>
                  {programme.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleBatchValidation}
              disabled={validating || !selectedProgramme}
              className="font-black px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex gap-2"
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Validate All
            </Button>

            <div className="relative">
              <select
                className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-bold text-sm appearance-none pr-10"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="valid">Valid Only</option>
                <option value="invalid">Invalid Only</option>
                <option value="pending">Pending Only</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Candidates Table */}
      <Card className="border-none shadow-xl overflow-hidden rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Candidate</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">JAMB Reg No</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Programme</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">UTME Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">O-Level Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Overall</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400">
                    No candidates found
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 uppercase">
                          {candidate.surname}, {candidate.firstname}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          Level 100
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-black">
                        {candidate.jambRegNo}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-600">
                      {candidate.programme?.name || 'N/A'}
                    </td>
                    <td className="px-8 py-6">
                      {candidate.utmeSubjectsValid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {candidate.oLevelValid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {getStatusBadge(candidate.validationStatus)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
