"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  BarChart3, 
  TrendingUp, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  ChevronRight, 
  GraduationCap, 
  ShieldCheck,
  Loader2,
  Printer,
  Search,
  Download
} from 'lucide-react';
import { computeStudentGPAction, bulkComputeResultsAction, getStudentSemesterResultAction } from '@/actions/result-computation';

export default function ResultComputationDashboard() {
  const [computing, setComputing] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Configuration
  const sessionId = 1;
  const semester: '1' | '2' = '1';

  const handleCompute = async () => {
    if (!studentId) return;
    setComputing(true);
    const res = await computeStudentGPAction(parseInt(studentId), sessionId, semester);
    if (res.success) {
        await loadResult();
    }
    setComputing(false);
  };

  async function loadResult() {
     setLoading(true);
     const res = await getStudentSemesterResultAction(parseInt(studentId), sessionId, semester);
     if (res.success) setResultData(res.data);
     setLoading(false);
  }

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Calculator size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Academic GPA Engine</h1>
            <p className="text-slate-500 font-medium text-lg">Compute and verify semester performance metrics</p>
          </div>
        </div>
        
        <div className="flex gap-3">
           <div className="relative">
              <input 
                type="number" 
                placeholder="Student System ID..."
                className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none w-64 font-medium transition-all"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           </div>
           <button 
             onClick={handleCompute}
             disabled={computing || !studentId}
             className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
           >
              {computing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
              Compute Result
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Performance Overview */}
        {resultData?.summary ? (
           <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Semester GPA', value: resultData.summary.gpa, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Cumulative GPA', value: resultData.summary.cgpa, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Credits Registered', value: resultData.summary.tcr, icon: FileSpreadsheet, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Credits Earned', value: resultData.summary.tce, icon: CheckCircle2, color: 'text-rose-600', bg: 'bg-rose-50' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                   <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                      <stat.icon size={24} />
                   </div>
                   <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                      <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                   </div>
                </div>
              ))}
           </div>
        ) : (
           <div className="col-span-12 p-20 bg-white rounded-[40px] border border-slate-100 text-center space-y-6 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto">
                 <Calculator size={40} />
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-slate-900">Engine Idle</h2>
                 <p className="text-slate-500 font-medium max-w-xs mx-auto">Enter a Student ID to begin the automated GPA computation process.</p>
              </div>
           </div>
        )}

        {/* Course-by-Course Analysis */}
        {resultData?.marks && (
           <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                 <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                       <FileSpreadsheet size={20} className="text-indigo-600" />
                       Grade Breakdown
                    </h2>
                    <div className="flex gap-2">
                       <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                          <Printer size={16} />
                       </button>
                       <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                          <Download size={16} />
                       </button>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                             <th className="px-6 py-4">Course</th>
                             <th className="px-6 py-4">Units</th>
                             <th className="px-6 py-4">Score</th>
                             <th className="px-6 py-4">Grade</th>
                             <th className="px-6 py-4">Point</th>
                             <th className="px-6 py-4 text-right">Weighted</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {resultData.marks.map((m: any) => (
                             <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                   <div>
                                      <div className="font-bold text-slate-900">{m.courseName}</div>
                                      <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">{m.courseCode}</div>
                                   </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-600">{m.units}</td>
                                <td className="px-6 py-4 font-black text-slate-900">{m.total}%</td>
                                <td className="px-6 py-4">
                                   <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-black ${
                                     m.grade === 'F' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                   }`}>
                                      {m.grade || 'N/A'}
                                   </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-500">{m.points}</td>
                                <td className="px-6 py-4 text-right font-black text-indigo-600">
                                   {(parseFloat(m.points) * m.units).toFixed(2)}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {/* Sidebar: Institutional Governance */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-6 shadow-xl shadow-indigo-100">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                 <ShieldCheck size={24} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-bold">Academic Standing</h3>
                 <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    GPA and CGPA are computed based on the NUC 5.0 Scale. Results are not official until they are approved by the Faculty Dean and published to the Student Portal.
                 </p>
              </div>
              <div className="space-y-3">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Classification</span>
                    <span className="text-sm font-black text-emerald-400">First Class</span>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <AlertCircle size={14} className="text-amber-500" />
                 Computation Logic
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                 GPA = Σ(Grade Points × Units) / Σ(Total Credits Registered).<br/><br/>
                 CGPA = Σ(Total Weighted Grade Points) / Σ(Cumulative Total Credits Registered) across all academic sessions.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
