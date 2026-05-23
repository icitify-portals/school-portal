"use client";

import React, { useState, useEffect } from 'react';
import { 
  Library, 
  Search, 
  Download, 
  Printer, 
  User, 
  CheckCircle2, 
  Calendar, 
  ChevronRight, 
  ShieldCheck,
  Loader2,
  FileText,
  Clock,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { getMatriculationLedgerAction } from '@/actions/matriculation-register';

export default function MatriculationLedgerDashboard() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Configuration
  const sessionId = 1;

  useEffect(() => {
    loadLedger();
  }, []);

  async function loadLedger() {
    setLoading(true);
    const res = await getMatriculationLedgerAction(sessionId);
    if (res.success) setLedger(res.data);
    setLoading(false);
  }

  const filteredLedger = ledger.filter(entry => 
    entry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.matricNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Library size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Matriculation Ledger</h1>
            <p className="text-slate-500 font-medium text-lg">Official Record of Session 2026/2027 • Registry Office</p>
          </div>
        </div>
        
        <div className="flex gap-3">
           <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
              <Printer size={20} />
           </button>
           <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <Download size={20} />
              Export Register
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Stats Summary */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                 <User size={28} />
              </div>
              <div>
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Matriculants</div>
                 <div className="text-3xl font-black text-slate-900">{ledger.length}</div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                 <ShieldCheck size={28} />
              </div>
              <div>
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Signatures</div>
                 <div className="text-3xl font-black text-slate-900">{ledger.length}</div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                 <Clock size={28} />
              </div>
              <div>
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ceremony Status</div>
                 <div className="text-lg font-black text-slate-900">ACTIVE SESSION</div>
              </div>
           </div>
        </div>

        {/* Ledger Table */}
        <div className="col-span-12 space-y-6">
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={22} className="text-indigo-600" />
                    Matriculation Registry Entries
                 </h2>
                 <div className="flex gap-4">
                    <div className="relative">
                       <input 
                         type="text" 
                         placeholder="Search registry..." 
                         className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium w-64 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                       <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                       <Filter size={20} />
                    </button>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="px-8 py-5">Matriculant Details</th>
                          <th className="px-8 py-5">Official Signature</th>
                          <th className="px-8 py-5">Signing Metadata</th>
                          <th className="px-8 py-5 text-right">Verification</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {loading ? (
                          <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></td></tr>
                       ) : filteredLedger.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50/50 transition-all group">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 font-bold">
                                      {entry.studentName.charAt(0)}
                                   </div>
                                   <div>
                                      <div className="text-slate-900 font-bold text-lg leading-tight">{entry.studentName}</div>
                                      <div className="text-indigo-600 font-black text-xs mt-1 uppercase tracking-tighter">{entry.matricNumber || 'NOT ASSIGNED'}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white transition-all">
                                   <img src={entry.signature} alt="Signature" className="h-10 object-contain mix-blend-multiply opacity-80" />
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                      <Calendar size={12} className="text-slate-300" />
                                      {new Date(entry.signedAt).toLocaleString()}
                                   </div>
                                   <div className="text-[10px] font-mono text-slate-400">IP: {entry.ip}</div>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                   <ShieldCheck size={12} />
                                   Verified
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              {filteredLedger.length === 0 && !loading && (
                 <div className="p-32 text-center space-y-4 opacity-30">
                    <Library size={64} className="mx-auto text-slate-300" />
                    <p className="text-xl font-bold text-slate-900">No registry entries found.</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
