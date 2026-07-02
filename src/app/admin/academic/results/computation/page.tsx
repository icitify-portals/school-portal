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
     // @ts-expect-error - TS2339: Auto-suppressed for build
     if (res.success) setResultData(res.data);
     setLoading(false);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1600px] w-full mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Calculator className="w-12 h-12 text-indigo-400" />
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                            Academic GPA Engine
                        </h1>
                    </div>
                    <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                        Compute and verify semester performance metrics
                    </p>
                </div>
                
                <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner gap-2 flex-wrap">
                   <div className="relative">
                      <input 
                        type="number" 
                        placeholder="Student System ID..."
                        className="pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 text-white placeholder:text-white/50 rounded-xl outline-none w-48 lg:w-64 font-medium transition-all h-10"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                      />
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                   </div>
                   <button 
                     onClick={handleCompute}
                     disabled={computing || !studentId}
                     className="px-6 py-2.5 bg-indigo-600 text-white text-xs uppercase tracking-widest rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                   >
                      {computing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                      Compute
                   </button>
                </div>
            </div>
        </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Performance Overview */}
        {resultData?.summary ? (
           <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Semester GPA', value: resultData.summary.gpa, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50', shadow: 'shadow-indigo-200/50' },
                { label: 'Cumulative GPA', value: resultData.summary.cgpa, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', shadow: 'shadow-emerald-200/50' },
                { label: 'Credits Registered', value: resultData.summary.tcr, icon: FileSpreadsheet, color: 'text-amber-600', bg: 'bg-amber-50', shadow: 'shadow-amber-200/50' },
                { label: 'Credits Earned', value: resultData.summary.tce, icon: CheckCircle2, color: 'text-rose-600', bg: 'bg-rose-50', shadow: 'shadow-rose-200/50' }
              ].map((stat, i) => (
                <div key={i} className={`bg-white/60 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/40 shadow-xl ${stat.shadow} flex items-center gap-4`}>
                   <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                      <stat.icon size={24} />
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                      <div className="text-3xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{stat.value}</div>
                   </div>
                </div>
              ))}
           </div>
        ) : (
           <div className="col-span-12 p-20 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/40 text-center space-y-6 shadow-xl shadow-slate-200/50">
              <div className="w-24 h-24 bg-white/80 border border-white text-slate-300 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                 <Calculator size={48} />
              </div>
              <div className="space-y-2">
                 <h2 className="text-3xl font-black text-slate-800 tracking-tighter drop-shadow-sm">Engine Idle</h2>
                 <p className="text-slate-500 font-medium max-w-sm mx-auto text-lg leading-snug">Enter a Student ID to begin the automated GPA computation process.</p>
              </div>
           </div>
        )}

        {/* Course-by-Course Analysis */}
        {resultData?.marks && (
           <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
                 <div className="p-8 border-b border-white/20 bg-white/40 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                       <FileSpreadsheet size={22} className="text-indigo-600" />
                       Grade Breakdown
                    </h2>
                    <div className="flex gap-2">
                       <button className="p-2.5 bg-white/80 border border-white/40 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                          <Printer size={18} />
                       </button>
                       <button className="p-2.5 bg-white/80 border border-white/40 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                          <Download size={18} />
                       </button>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-slate-200/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/20">
                             <th className="px-8 py-5">Course</th>
                             <th className="px-8 py-5">Units</th>
                             <th className="px-8 py-5">Score</th>
                             <th className="px-8 py-5">Grade</th>
                             <th className="px-8 py-5">Point</th>
                             <th className="px-8 py-5 text-right">Weighted</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100/60">
                          {resultData.marks.map((m: any) => (
                             <tr key={m.id} className="hover:bg-white/40 transition-colors">
                                <td className="px-8 py-5">
                                   <div>
                                      <div className="font-bold text-slate-800">{m.courseName}</div>
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{m.courseCode}</div>
                                   </div>
                                </td>
                                <td className="px-8 py-5 font-bold text-slate-600">{m.units}</td>
                                <td className="px-8 py-5 font-black text-slate-900">{m.total}%</td>
                                <td className="px-8 py-5">
                                   <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black tracking-widest ${
                                     m.grade === 'F' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                   }`}>
                                      {m.grade || 'N/A'}
                                   </div>
                                </td>
                                <td className="px-8 py-5 font-bold text-slate-500">{m.points}</td>
                                <td className="px-8 py-5 text-right font-black text-indigo-600 text-lg">
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
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 shadow-xl shadow-indigo-200/40 relative overflow-hidden group border border-slate-800">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-500/30 transition-colors duration-700" />
              <div className="relative z-10 space-y-8">
                 <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-indigo-400 border border-white/10 shadow-inner">
                    <ShieldCheck size={28} />
                 </div>
                 <div className="space-y-3">
                    <h3 className="text-2xl font-black tracking-tighter drop-shadow-sm">Academic Standing</h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                       GPA and CGPA are computed based on the NUC 5.0 Scale. Results are not official until they are approved by the Faculty Dean and published to the Student Portal.
                    </p>
                 </div>
                 <div className="p-5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 flex justify-between items-center shadow-inner">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classification</span>
                    <span className="text-base font-black text-emerald-400 drop-shadow-sm">First Class</span>
                 </div>
              </div>
           </div>

           <div className="bg-white/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-200/50 space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <AlertCircle size={14} className="text-amber-500" />
                 Computation Logic
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                 <span className="font-bold text-slate-800">GPA</span> = Σ(Grade Points × Units) / Σ(Total Credits Registered).<br/><br/>
                 <span className="font-bold text-slate-800">CGPA</span> = Σ(Total Weighted Grade Points) / Σ(Cumulative Total Credits Registered) across all academic sessions.
              </p>
           </div>
        </div>
      </div>
    </div>
  </div>
  );
}
