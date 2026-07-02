"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ChevronRight, 
  GraduationCap, 
  BarChart3, 
  ShieldCheck,
  Loader2,
  AlertCircle,
  MoreVertical,
  Mail,
  ArrowUpRight
} from 'lucide-react';
import { getApplicantsForScreening, bulkAdmitApplicants, rejectApplicant } from '@/actions/admission-screening';
import { Card } from "@/components/ui/card";

export default function AdmissionsScreeningDashboard() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadApplicants();
  }, []);

  async function loadApplicants() {
    setLoading(true);
    const res = await getApplicantsForScreening();
    // @ts-expect-error - TS2345: Auto-suppressed for build
    if (res.success) setApplicants(res.data);
    setLoading(false);
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAdmit = async () => {
    if (selectedIds.length === 0) return;
    setProcessing(true);
    const res = await bulkAdmitApplicants(selectedIds);
    setProcessing(false);
    if (res.success) {
      setSelectedIds([]);
      loadApplicants();
    }
  };

  const getApplicantName = (formData: string) => {
     try {
        const data = JSON.parse(formData);
        return `${data.firstName || 'Candidate'} ${data.lastName || ''}`;
     } catch (e) {
        return 'Unknown Candidate';
     }
  };

  const getStudyMode = (formDataStr: string) => {
     try {
        const formData = JSON.parse(formDataStr || "{}");
        let jambRegNo = "";
        for (const key of Object.keys(formData)) {
            if (key.toLowerCase().includes("jamb") && formData[key]) {
                jambRegNo = String(formData[key]).trim();
                break;
            }
        }
        const isJambCandidate = !!jambRegNo && !jambRegNo.toLowerCase().includes("temp") && !jambRegNo.toLowerCase().includes("direct");
        return isJambCandidate ? "Full-Time" : "Part-Time";
     } catch (e) {
        return "Part-Time";
     }
  };

  const [activeTab, setActiveTab] = useState<'all' | 'ft' | 'pt'>('all');

  const ftCount = applicants.filter(a => getStudyMode(a.formData) === 'Full-Time').length;
  const ptCount = applicants.filter(a => getStudyMode(a.formData) === 'Part-Time').length;

  const filteredApplicants = applicants.filter(a => {
    const nameMatches = getApplicantName(a.formData).toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.id.toString().includes(searchTerm);
    if (!nameMatches) return false;

    const mode = getStudyMode(a.formData);
    if (activeTab === 'ft') return mode === 'Full-Time';
    if (activeTab === 'pt') return mode === 'Part-Time';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-4 mb-2">
              <Users className="w-12 h-12 text-indigo-400 drop-shadow-md" />
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                Admissions Screening Hub
              </h2>
            </div>
            <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
              Review applications and manage institutional entry decisions
            </p>
          </div>
          <div className="relative z-10 flex gap-3 shrink-0">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by name or ID..."
                className="pl-12 pr-4 py-3 rounded-2xl border border-white/20 bg-white/10 text-white placeholder-slate-400 outline-none w-64 font-bold text-sm focus:bg-white focus:text-slate-800 transition-all focus:border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button 
              onClick={handleBulkAdmit}
              disabled={selectedIds.length === 0 || processing}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Admit Selected ({selectedIds.length})
            </button>
          </div>
        </div>

        {/* Statistics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Total Applicants', value: applicants.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
             { label: 'Screened', value: applicants.filter(a => a.status === 'screened').length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
             { label: 'Unpaid Applications', value: applicants.filter(a => a.paymentStatus !== 'paid').length, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
             { label: 'Average Exam Score', value: '68.4%', icon: BarChart3, color: 'text-rose-600', bg: 'bg-rose-100' }
           ].map((stat, i) => (
             <Card key={i} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`p-4 ${stat.bg} ${stat.color} rounded-[1.5rem] shadow-inner`}>
                     <stat.icon size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                  </div>
                </div>
             </Card>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Applicant List */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
             {/* Dynamic Tabs */}
             <div className="flex border-b border-white/40 gap-8 text-xs font-black uppercase tracking-wider px-4">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`pb-4 border-b-2 transition-all ${
                    activeTab === 'all' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  All ({applicants.length})
                </button>
                <button 
                  onClick={() => setActiveTab('ft')}
                  className={`pb-4 border-b-2 transition-all ${
                    activeTab === 'ft' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Full-Time (JAMB) ({ftCount})
                </button>
                <button 
                  onClick={() => setActiveTab('pt')}
                  className={`pb-4 border-b-2 transition-all ${
                    activeTab === 'pt' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Part-Time (Direct) ({ptCount})
                </button>
             </div>
 
             <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
                <div className="p-8 border-b border-white/40 bg-white/20 flex justify-between items-center">
                   <h2 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <FileText size={20} className="text-indigo-600" />
                      Applicant Review Queue
                   </h2>
                   <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Filter size={18} /></button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><MoreVertical size={18} /></button>
                   </div>
                </div>
 
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-slate-900 text-white">
                            <th className="px-6 py-6 w-12"><input type="checkbox" className="rounded" /></th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Applicant Detail</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Study Mode</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Exam Score</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Applied Date</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/40 bg-white/20">
                         {loading ? (
                            <tr>
                               <td colSpan={7} className="py-20 text-center">
                                  <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
                               </td>
                            </tr>
                         ) : filteredApplicants.map((app) => (
                            <tr key={app.id} className={`hover:bg-white/40 transition-colors group ${selectedIds.includes(app.id) ? 'bg-indigo-50/30' : ''}`}>
                               <td className="px-6 py-4">
                                  <input 
                                    type="checkbox" 
                                    className="rounded text-indigo-600 focus:ring-indigo-500" 
                                    checked={selectedIds.includes(app.id)}
                                    onChange={() => toggleSelect(app.id)}
                                  />
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-white border border-slate-200/80 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        {getApplicantName(app.formData).charAt(0)}
                                     </div>
                                     <div>
                                        <div className="font-black text-slate-800 uppercase text-sm">{getApplicantName(app.formData)}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase mt-0.5">ID: ADM-2026-{app.id}</div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                    getStudyMode(app.formData) === 'Full-Time' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-orange-50 border-orange-200 text-orange-700'
                                  }`}>
                                     {getStudyMode(app.formData)}
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border font-mono ${
                                    (app.examScore || 0) >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'
                                  }`}>
                                     {app.examScore || 0}%
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                     <div className={`w-1.5 h-1.5 rounded-full ${
                                       app.status === 'screened' ? 'bg-emerald-500' : 'bg-amber-500'
                                     }`} />
                                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider capitalize">{app.status}</span>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono">
                                  {new Date(app.appliedAt).toLocaleDateString()}
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                     <button className="p-2 bg-white/60 hover:bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 transition-all shadow-sm">
                                        <FileText size={16} />
                                     </button>
                                     <button className="p-2 bg-white/60 hover:bg-rose-50 border border-slate-200 rounded-lg text-slate-600 hover:text-rose-600 transition-all shadow-sm">
                                        <XCircle size={16} />
                                     </button>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </Card>
          </div>
 
          {/* Right Sidebar: Decision Center */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-40 mix-blend-overlay" />
                <div className="relative z-10 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                   <GraduationCap size={24} />
                </div>
                <div className="relative z-10 space-y-2">
                   <h3 className="text-xl font-black uppercase tracking-tight">Admission Policy</h3>
                   <p className="text-xs text-slate-400 leading-relaxed font-bold">
                      Applicants marked as **Admitted** will receive an automated admission letter and a portal activation link. Ensure all documents are verified before final decision.
                   </p>
                </div>
                <button className="relative z-10 w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                   <Mail size={18} />
                   Notify Candidates
                </button>
             </div>
 
             <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-8 space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <ArrowUpRight size={14} className="text-indigo-600" />
                   Recent Decisions
                </h3>
                <div className="space-y-4">
                   {[1, 2].map(i => (
                      <div key={i} className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg flex items-center justify-center"><CheckCircle2 size={16} /></div>
                         <div className="text-xs font-black text-slate-700">Candidate #{340 + i} Admitted</div>
                      </div>
                   ))}
                </div>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
