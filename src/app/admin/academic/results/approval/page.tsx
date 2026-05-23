"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  FileCheck, 
  ArrowRight, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Lock,
  EyeOff,
  Globe,
  Loader2,
  BarChart,
  MessageSquare
} from 'lucide-react';
import { approveDepartmentResultsAction, approveFacultyResultsAction, getApprovalStats } from '@/actions/result-workflow';

export default function ResultApprovalControlCenter() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sessionId, setSessionId] = useState(1);
  const [semester, setSemester] = useState<'1' | '2'>('1');

  useEffect(() => {
    loadStats();
  }, [sessionId, semester]);

  async function loadStats() {
    setLoading(true);
    const res = await getApprovalStats(sessionId, semester);
    if (res.success) setStats(res.data);
    setLoading(false);
  }

  const handleApproval = async (type: 'dept' | 'faculty') => {
    setProcessing(true);
    const id = 1; // Placeholder for actual Dept/Faculty ID
    const res = type === 'dept' 
      ? await approveDepartmentResultsAction(id, sessionId, semester)
      : await approveFacultyResultsAction(id, sessionId, semester);
    
    setProcessing(false);
    if (res.success) loadStats();
  };

  const getCount = (status: string) => stats.find(s => s.status === status)?.count || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Academic Integrity Hub</h1>
            <p className="text-slate-500 font-medium text-lg">Result approval workflow and publication management</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Progress Overview */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BarChart size={14} />
                Approval Pipeline
              </h2>

              <div className="space-y-6 relative">
                 <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-100 -z-10" />
                 
                 <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-md ${
                      getCount('pending') > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                       <FileCheck size={20} />
                    </div>
                    <div>
                       <div className="text-slate-900 font-bold">Lecturer Submission</div>
                       <div className="text-slate-400 text-xs font-medium">{getCount('pending')} Students Pending Review</div>
                    </div>
                 </div>

                 <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-md ${
                      getCount('hod_approved') > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                       <UserCheck size={20} />
                    </div>
                    <div>
                       <div className="text-slate-900 font-bold">HOD Verification</div>
                       <div className="text-slate-400 text-xs font-medium">{getCount('hod_approved')} Students Verified by Dept</div>
                    </div>
                 </div>

                 <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-md ${
                      getCount('dean_approved') > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                       <Building2 size={20} />
                    </div>
                    <div>
                       <div className="text-slate-900 font-bold">Dean Authorization</div>
                       <div className="text-slate-400 text-xs font-medium">{getCount('dean_approved')} Students Authorized by Faculty</div>
                    </div>
                 </div>

                 <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-md ${
                      getCount('published') > 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                       <Globe size={20} />
                    </div>
                    <div>
                       <div className="text-slate-900 font-bold">Public Release</div>
                       <div className="text-slate-400 text-xs font-medium">{getCount('published')} Students Live</div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-widest text-xs">
                 <Lock size={14} />
                 Visibility Lock Active
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Results are currently **hidden** from the student portal. Students will only see their results once they reach the **Published** state.
              </p>
           </div>
        </div>

        {/* Action Center */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* HOD Action */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6 relative overflow-hidden group">
                 <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500" />
                 <div className="relative z-10 space-y-6">
                    <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                       <UserCheck size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Department Approval</h3>
                       <p className="text-slate-500 font-medium text-sm mt-1">Review and verify results for all students in your department.</p>
                    </div>
                    <button 
                      onClick={() => handleApproval('dept')}
                      disabled={processing || getCount('pending') === 0}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {processing ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                       Approve Dept Results
                    </button>
                 </div>
              </div>

              {/* Dean Action */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6 relative overflow-hidden group">
                 <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-500" />
                 <div className="relative z-10 space-y-6">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                       <Building2 size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Authorization</h3>
                       <p className="text-slate-500 font-medium text-sm mt-1">Authorize department-approved results for faculty-wide release.</p>
                    </div>
                    <button 
                      onClick={() => handleApproval('faculty')}
                      disabled={processing || getCount('hod_approved') === 0}
                      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {processing ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                       Authorize Faculty Results
                    </button>
                 </div>
              </div>
           </div>

           {/* Complaints Summary */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                 <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare size={20} className="text-rose-500" />
                    Pending Academic Complaints
                 </h2>
                 <button className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
              </div>
              <div className="p-8 text-center space-y-4 opacity-40 py-20">
                 <AlertCircle size={48} className="mx-auto text-slate-300" />
                 <p className="text-slate-500 font-medium">No unresolved complaints in this cycle.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
